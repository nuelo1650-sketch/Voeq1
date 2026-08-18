# KNOWN_ISSUES_AND_FAILURES.md — Voeq (as-built recovery, FINAL)

> Forensic inventory of problems in the existing platform, reconstructed from code
> inspected across all batches: `apps/api/src/app.ts`, `routes/*`, `middleware/*`,
> `services/*`, `realtime.ts`, `index.ts`, `apps/web/src/lib/*`, `components/*`,
> build output, `.env.example`, `render.yaml`. Investigation-only — no modifications.
> No secrets copied.

Each issue uses the required format. Confidence: Confirmed / Strongly inferred /
Uncertain / Conflicting.

---

## Issue: Unauthenticated admin backup trigger
- **Category:** Security problem.
- **Description:** `POST /api/admin/backup/trigger` is mounted as a **separate top-level
  router** (`app.ts:172`), NOT under `adminRouter`, and `backupRouter` has **no
  `requireAdmin` guard** (confirmed `routes/backup.ts`).
- **Expected:** Only staff can trigger a database backup.
- **Observed:** Any unauthenticated caller can `POST /api/admin/backup/trigger`, which
  runs `createBackup()` (writes to Cloudinary) and logs an admin action.
- **Impact:** Critical/High — unauthorized operation; abuse could incur Cloudinary cost
  / DoS; exposes an internal admin action.
- **Reproduction:** `curl -X POST https://voeq.onrender.com/api/admin/backup/trigger`.
- **Root cause:** Route mounted outside the `requireAdmin`-protected `adminRouter`;
  missing guard on the handler.
- **Workaround:** None in-app; relies on network/reverse-proxy blocking (not guaranteed).
- **Product consequence:** The rebuild must protect all privileged operations uniformly.
- **Recommendation:** Fix in new implementation (auth-gate every privileged endpoint).
- **Evidence:** `app.ts:172`; `routes/backup.ts`.

## Issue: Unauthenticated cron / badge-sync endpoint
- **Category:** Security problem / Integration problem.
- **Description:** `GET /api/cron/tick` is mounted under `apiRouter` (`routes/index.ts`)
  with **no `requireAuth`/`requireAdmin`**, and `cronRouter` has no guard.
- **Expected:** Scheduled jobs run from a trusted scheduler with a secret/token.
- **Observed:** Publicly callable; anyone can trigger `syncAllVendorBadges()`.
- **Impact:** Medium — low direct harm (recomputes badges) but an unauthenticated
  state-changing/admin-style endpoint; could be abused for load.
- **Reproduction:** `curl https://voeq.onrender.com/api/cron/tick`.
- **Root cause:** `cronRouter` mounted without auth.
- **Workaround:** None in-app.
- **Product consequence:** Rebuild should protect cron endpoints (secret header /
  scheduler-only network).
- **Recommendation:** Fix in new implementation.
- **Evidence:** `routes/index.ts:13`; `routes/cron.ts`.

## Issue: Public test endpoint discloses platform counts (incl. user count)
- **Category:** Security problem.
- **Description:** `GET /api/test/db` is mounted publicly (`app.ts:144`) and returns
  counts of institutions, campuses, categories, **users**, agreements, featureFlags.
- **Expected:** Diagnostic endpoints are restricted.
- **Observed:** Unauthenticated caller learns total user count + other platform metrics.
- **Impact:** Medium — information disclosure / competitive intelligence; helps
  enumeration.
- **Reproduction:** `curl https://voeq.onrender.com/api/test/db`.
- **Root cause:** `testRouter` mounted publicly without auth.
- **Workaround:** None in-app.
- **Product consequence:** Rebuild must not expose diagnostic endpoints publicly.
- **Recommendation:** Remove (or auth-gate) in new implementation.
- **Evidence:** `app.ts:144`; `routes/test.ts`.

## Issue: Upload size limit contradicted by JSON body limit
- **Category:** Bug / Performance problem.
- **Description:** `uploadRouter` validates `MAX_UPLOAD_SIZE = 5MB` on the decoded
  buffer, but the global `express.json({ limit: '1mb' })` (`app.ts:87`) rejects any
  request whose body exceeds 1 MB. Uploads are sent as **base64 in JSON**, so a 5 MB
  image is ~6.6 MB base64 — rejected by the body parser (HTTP 413) **before** reaching
  the 5 MB check.
- **Expected:** A user can upload images up to ~5 MB.
- **Observed:** Max uploadable original image is ~0.75 MB (base64 ≈ 1 MB). Larger
  uploads fail with 413 at the body-parser stage; the advertised 5 MB cap is
  unreachable.
- **Impact:** Medium — users cannot upload reasonably-sized photos; silent failure
  (413, not the friendly "Max 5MB" message).
- **Reproduction:** Attempt to upload an image > ~0.75 MB via the upload endpoint.
- **Root cause:** Base64-in-JSON encoding inflates size ~33%, exceeding the 1 MB global
  JSON limit before the route's 5 MB check runs.
- **Workaround:** None for users; smaller images only.
- **Product consequence:** Rebuild should use multipart/form-data uploads (not base64
  JSON) and align body limits with the intended cap.
- **Recommendation:** Fix in new implementation (change upload transport + limits).
- **Evidence:** `app.ts:87`; `routes/upload.ts` (MAX_UPLOAD_SIZE).

## Issue: Moderator role enforced on API but invisible on web
- **Category:** Security problem / Legacy behavior / Authorization.
- **Description:** Backend `PERMISSIONS.moderator` + `STAFF_ROLES` (incl. moderator)
  grant content-moderation capabilities and accept moderator sessions
  (`requireAdmin`/`requireModerator`). The web app has **zero** moderator references;
  `admin/layout.tsx` uses `requireSuperUserAdmin` (excludes moderator); no moderator UI
  exists.
- **Expected (product):** Either moderators have a working console, or the moderator tier
  is removed.
- **Observed:** A moderator session can call admin API routes (e.g.
  `/api/admin/vendors`, `/api/admin/reviews`) but cannot reach any web admin page; is
  barred from `/admin`.
- **Impact:** Medium — authorization inconsistency; a moderator account is in a
  half-wired state (API-capable, UI-less). Not exploitable for privilege escalation
  beyond the moderator's intended (limited) capabilities, but it is a discrepancy.
- **Reproduction:** Create a moderator (DB), authenticate, call admin API directly.
- **Root cause:** Web never implemented moderator surfaces; backend capability matrix
  prepared for it.
- **Workaround:** None; moderator cannot self-serve a console.
- **Product consequence:** Rebuild must decide moderator's product role explicitly (see
  REBUILD WARNINGS).
- **Recommendation:** Investigate + Redesign (decide moderator scope; implement or drop).
- **Evidence:** `middleware/admin.ts`; `admin/layout.tsx`; web grep (empty) — carried
  from Batch 2.
- **Confidence:** Confirmed.

## Issue: View count incremented on every page view (write-on-read)
- **Category:** Reliability problem / Performance problem / Data problem.
- **Description:** `getListingBySlug` does `viewCount: { increment: 1 }` on every fetch
  and logs a `listing_view` EventLog (with campus). Refreshing the page or a bot
  repeatedly hitting the slug inflates counts.
- **Expected:** Views reflect genuine distinct interest; ideally de-duplicated per
  user/time window.
- **Observed:** Every HTTP GET increments; no de-duplication per viewer.
- **Impact:** Low/Medium — inflated popularity metrics; minor write load per read.
- **Reproduction:** Reload `/l/[slug]` several times; view count rises each time.
- **Root cause:** Unconditional increment in the read path.
- **Workaround:** None.
- **Product consequence:** Rebuild should de-dupe views (per-user/rolling-window).
- **Recommendation:** Redesign (view de-duplication) in new implementation.
- **Evidence:** `listings.service.getListingBySlug`.

## Issue: conversation_started logged via fragile time heuristic
- **Category:** Reliability problem / Data problem.
- **Description:** `conversations.ts` logs `conversation_started` only if
  `conversation.createdAt >= Date.now() - 2000`. This infers "first creation" from a
  2-second window rather than an explicit created-vs-found result.
- **Expected:** Log the event exactly once, on actual creation.
- **Observed:** If two rapid creates race, or clocks/round-trips exceed 2 s, the event
  may be missed or double-logged.
- **Impact:** Low — analytics signal only.
- **Reproduction:** Race two simultaneous conversation creates.
- **Root cause:** Heuristic instead of returning created/existing from `upsert`.
- **Workaround:** None.
- **Product consequence:** Rebuild should return creation status explicitly.
- **Recommendation:** Fix in new implementation.
- **Evidence:** `routes/conversations.ts`.

## Issue: Onboarding gates can trap users mid-flow
- **Category:** UX problem / Reliability problem.
- **Description:** `(main)/layout.tsx` shows a loading state and force-shows
  AgreementModal / CampusSelectModal / redirect to shopper onboarding until resolved.
  There is no explicit "skip/contact support" path; if a modal errors or a user closes
  the tab, the next load re-gates.
- **Expected:** Users can complete or gracefully exit onboarding.
- **Observed:** Gate-blocking; depends on modal succeeding. A failed/blocked agreement
  or campus fetch could loop the loading state.
- **Impact:** Low/Medium — potential soft-lock for some users (e.g. campus list empty
  for their school).
- **Reproduction:** Authenticate a user with no campus whose institution isn't seeded.
- **Root cause:** Layout-level gating without escape hatch.
- **Workaround:** None in-app.
- **Product consequence:** Rebuild should allow graceful fallback if required data
  (campus) is unavailable.
- **Recommendation:** Redesign (graceful onboarding fallback) in new implementation.
- **Evidence:** `(main)/layout.tsx` (read in Batch 2).

## Issue: Google OAuth returns session token in URL query string
- **Category:** Security problem (minor).
- **Description:** The Google callback redirects to
  `/api/auth/google/callback?token=...&dest=...`; the token (JWT) travels in the URL.
- **Expected:** Tokens delivered via httpOnly cookie or POST, not URL.
- **Observed:** Token in query string; browser history / proxies / referrers may log it.
  Mitigated because the web route immediately sets an httpOnly cookie and the JWT
  expires in 30 days + is server-session-checked.
- **Impact:** Low — short-lived exposure window; mitigated by cookie+session model.
- **Reproduction:** Complete a Google sign-in; observe the callback URL.
- **Root cause:** Cross-domain cookie limitation (API ≠ web domain) forces token in URL.
- **Workaround:** Web sets cookie on arrival.
- **Product consequence:** Rebuild should prefer same-domain auth or a POST/exchange
  that avoids URL tokens.
- **Recommendation:** Redesign (avoid token-in-URL) in new implementation.
- **Evidence:** `routes/auth.ts` (callback redirect).

## Issue: CORS allows requests with no Origin header
- **Category:** Security problem (minor) / Integration problem.
- **Description:** `corsOriginValidator` returns `true` when `!origin` ("mobile apps,
  curl, server-to-server"). Combined with `credentials: true`, non-browser callers
  bypass origin checks.
- **Expected:** Restrict to known web origins; only allow no-origin for explicitly
  public endpoints.
- **Observed:** Any caller without an Origin header (curl, server-to-server) is allowed
  and, where cookies are presented, can act.
- **Impact:** Low — cookies aren't sent by plain curl; primarily affects CSRF posture
  for endpoints that trust cookies from non-browser contexts.
- **Reproduction:** `curl` a state-changing endpoint with a copied cookie.
- **Root cause:** Over-broad no-origin allowance.
- **Workaround:** None.
- **Product consequence:** Rebuild should scope no-origin allowances to public routes
  only.
- **Recommendation:** Redesign (tighten CORS) in new implementation.
- **Evidence:** `app.ts:67-79`.

## Issue: Impersonation cookie set on API domain, not web domain
- **Category:** Broken functionality (potential) / Integration problem.
- **Description:** `impersonate/start` issues a session cookie on the **API** domain
  (`res.cookie(getSessionCookieName(), ...)`) and returns the token. The admin console
  is on the **web** domain (`voeq.ng`); the web app would need to set that token as a
  cookie on its own domain for the impersonated session to apply in the UI.
- **Expected:** Impersonation takes effect in the admin's browser session on the web
  app.
- **Observed:** Cookie set on API domain (`voeq.onrender.com`); web (`voeq.ng`) may not
  receive it — impersonation may not actually switch the admin's visible identity in the
  UI. (Exact web consumption not fully traced this pass.)
- **Impact:** Uncertain — if unimplemented on web, impersonation is a **non-functional
  admin feature**; if partially implemented, behavior is inconsistent.
- **Reproduction:** Admin triggers impersonation; observe whether web UI switches
  identity.
- **Root cause:** Cross-domain cookie boundary; API sets cookie where the web can't
  read it.
- **Workaround:** Unknown.
- **Product consequence:** Rebuild must implement cross-domain session handoff correctly
  (or colocate auth).
- **Recommendation:** Investigate (verify web consumption) + Fix in new implementation.
- **Evidence:** `routes/admin/impersonate.ts`; `app.ts` (api/web split) — INFERRED
  incomplete.
- **Confidence:** Uncertain (root cause inferred; exact web behavior unconfirmed).

## Issue: Base64 image upload is inefficient (perf + size)
- **Category:** Performance problem.
- **Description:** Images are sent as base64 inside a JSON body (vs multipart). This
  inflates payload ~33% and forces a 1 MB global JSON limit (see upload-size bug).
- **Expected:** Efficient upload transport.
- **Observed:** Base64 JSON; 1 MB body cap.
- **Impact:** Low/Medium — larger requests, smaller effective cap, more parsing.
- **Root cause:** Upload design choice.
- **Workaround:** Smaller images.
- **Product consequence:** Rebuild should use multipart/form-data + presigned uploads.
- **Recommendation:** Redesign in new implementation.
- **Evidence:** `routes/upload.ts`; `app.ts:87`.

## Issue: Vendor mobile nav is a stacked hamburger, not a bottom tab
- **Category:** UX problem.
- **Description:** `VendorChrome` mobile nav is an in-flow hamburger drawer (stacks above
  content), unlike the bottom-tab pattern used by shopper (`AppBottomNav`) and admin
  (`AdminMobileNav`).
- **Expected:** Consistent mobile nav across roles.
- **Observed:** Vendor mobile users get an in-flow accordion, not a fixed bottom nav.
- **Impact:** Low — functional but inconsistent UX.
- **Reproduction:** Open `/vendor` at <lg width.
- **Root cause:** Design choice; onboarding hides nav, so bottom nav wasn't added.
- **Workaround:** None.
- **Product consequence:** Rebuild should unify mobile nav.
- **Recommendation:** Redesign (bottom-tab parity) in new implementation.
- **Evidence:** `VendorChrome.tsx` (Batch 2).

## Issue: Vendor onboarding live-preview hidden on mobile
- **Category:** UX problem.
- **Description:** Business-basics and photo steps have a live-preview `<aside>` with
  `hidden lg:block` — not shown below `lg`.
- **Expected:** Preview available on all viewports (or an equivalent).
- **Observed:** Mobile vendors see no live storefront preview during onboarding.
- **Impact:** Low — desktop-first by design, not broken.
- **Root cause:** Desktop-first spec.
- **Workaround:** Use a desktop/tablet to see preview.
- **Product consequence:** Rebuild should provide mobile-appropriate preview.
- **Recommendation:** Redesign in new implementation.
- **Evidence:** `BusinessBasicsForm.tsx`, `PhotoListingForm.tsx` (Batch 1).

## Issue: next build self-mutates node_modules (local-dev quirk)
- **Category:** Reliability problem (local/dev only) / Legacy behavior.
- **Description:** Running `next build` twice in the same `node_modules` corrupts
  `node_modules/next/dist` (Next self-mutates during build). Requires `pnpm install
  --force` + clearing `.next` to recover. (Observed during this investigation.)
- **Expected:** Repeated builds are safe.
- **Observed:** Second `next build` in place fails until deps reinstalled.
- **Impact:** Low for production (fresh build per deploy) but a real local-dev/repeat-
  build trap.
- **Root cause:** Next.js build writing into its own dist under pnpm symlinks.
- **Workaround:** Clear `.next` and `pnpm install --force` between builds.
- **Product consequence:** Rebuild CI should always clean before build.
- **Recommendation:** Preserve behavior (document as CI requirement) — not a product
  defect per se.
- **Evidence:** Observed during session builds.
- **Confidence:** Confirmed (observed).

## Issue: No custom web error boundaries
- **Category:** Reliability problem / UX problem.
- **Description:** No `error.tsx`/`global-error.tsx`/ErrorBoundary found in
  `apps/web/src`. Next.js provides a default, but route-level errors aren't gracefully
  handled with product styling.
- **Expected:** User-friendly error states per route.
- **Observed:** Default Next.js error page on unhandled route errors.
- **Impact:** Low — UX only.
- **Root cause:** Not implemented.
- **Workaround:** Default framework behavior.
- **Product consequence:** Rebuild should add error boundaries.
- **Recommendation:** Redesign in new implementation.
- **Evidence:** web grep (no error.tsx).

---

## Summary table

| # | Issue | Category | Impact |
|---|---|---|---|
| 1 | Backup trigger unauthenticated | Security | Critical/High |
| 2 | Cron/badge-sync unauthenticated | Security | Medium |
| 3 | Test endpoint discloses counts | Security | Medium |
| 4 | Upload cap unreachable (1MB JSON vs 5MB) | Bug/Perf | Medium |
| 5 | Moderator API-vs-web mismatch | Security/Auth | Medium |
| 6 | View count write-on-read | Reliability/Perf | Low/Med |
| 7 | conversation_started 2s heuristic | Reliability | Low |
| 8 | Onboarding gate soft-lock risk | UX/Reliability | Low/Med |
| 9 | OAuth token in URL | Security (minor) | Low |
| 10 | CORS allows no-Origin | Security (minor) | Low |
| 11 | Impersonation cookie on API domain | Broken/Integration | Uncertain |
| 12 | Base64 upload inefficiency | Performance | Low/Med |
| 13 | Vendor mobile nav inconsistency | UX | Low |
| 14 | Vendor onboarding preview mobile-hidden | UX | Low |
| 15 | next build self-mutation (dev) | Reliability (dev) | Low |
| 16 | No web error boundaries | Reliability/UX | Low |

All issues are investigation findings; **no code was modified**.
