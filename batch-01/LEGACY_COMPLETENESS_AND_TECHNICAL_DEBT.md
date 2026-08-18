# LEGACY_COMPLETENESS_AND_TECHNICAL_DEBT.md — Voeq (FINAL)

> Final inventory of unfinished / abandoned / duplicated / obsolete / suspicious
> functionality, with KEEP / REDESIGN / REMOVE / INVESTIGATE / LEGACY ARTIFACT
> classifications. Evidence: schema, routes, services, web components, build output,
> `.env.example`. Investigation-only.

---

# INCOMPLETE / ABANDONED / DUPLICATED / OBSOLETE

## 1. Moderator role (API-enforced, web-invisible)
- **Classification:** INVESTIGATE / REDESIGN.
- **Finding:** `PERMISSIONS.moderator` + `STAFF_ROLES` grant content moderation; web has
  zero moderator UI; `requireSuperUserAdmin` excludes moderator from `/admin`.
- **Action for rebuild:** Decide moderator's product role explicitly; implement or drop.

## 2. `User.drafts` (Json)
- **Classification:** LEGACY ARTIFACT.
- **Finding:** Free-form drafts field on Account; no clear producer in current UI.
- **Action:** Do not carry forward without confirming a use.

## 3. Unused `ListingStatus` states (draft / paused / archived)
- **Classification:** LEGACY ARTIFACT / INVESTIGATE.
- **Finding:** Enum has these values; `createListing` sets `active`; transitions for
  draft→active / pause / archive not observed in app.
- **Action:** Confirm product need before carrying states.

## 4. Unused `VendorStatus` states (pending_review / rejected)
- **Classification:** LEGACY ARTIFACT / INVESTIGATE.
- **Finding:** `canGoLive` drives incomplete→live; pending_review/rejected routing not
  confirmed in code.
- **Action:** Decide whether a manual review step is a product requirement.

## 5. `Listing.searchVector` / `Vendor.searchVector` (tsvector)
- **Classification:** LEGACY ARTIFACT (implementation-specific).
- **Finding:** PostgreSQL full-text vector columns; carry the *need* (searchable content),
  not the mechanism.
- **Action:** Rebuild search per new stack.

## 6. `/api/admin/backup` + `/api/cron` + `/api/test` endpoints
- **Classification:** REMOVE / REDESIGN (security).
- **Finding:** All three are unauthenticated (backup/cron/test). backup writes to
  Cloudinary; cron triggers badge sync; test discloses counts.
- **Action:** Remove test; auth-gate backup/cron (or restrict to scheduler network).

## 7. Impersonation cross-domain cookie
- **Classification:** INVESTIGATE (potential BROKEN).
- **Finding:** Cookie set on API domain; admin console on web domain — may not apply in
  UI. Feature may be non-functional.
- **Action:** Verify web consumption; reimplement cross-domain handoff correctly.

## 8. Vendor mobile nav (hamburger drawer vs bottom tab)
- **Classification:** REDESIGN (UX).
- **Finding:** Inconsistent with shopper/admin bottom-tab nav.
- **Action:** Unify mobile nav pattern.

## 9. Vendor onboarding live-preview hidden on mobile
- **Classification:** REDESIGN (UX).
- **Finding:** Live preview `<aside hidden lg:block>`; no mobile equivalent.
- **Action:** Provide mobile-appropriate preview.

## 10. Base64 image upload (inefficient + capped)
- **Classification:** REDESIGN (perf/bug).
- **Finding:** ~33% inflation; 1MB global JSON limit makes 5MB cap unreachable.
- **Action:** Multipart/form-data + presigned uploads; align limits.

## 11. Write-on-read view counting + `conversation_started` heuristic
- **Classification:** REDESIGN (reliability/data).
- **Finding:** Unconditional increment; 2s heuristic for first-message event.
- **Action:** De-dupe views (per-user/rolling window); return created-vs-found explicitly.

## 12. No custom web error boundaries
- **Classification:** REDESIGN (UX/reliability).
- **Finding:** No `error.tsx`/`global-error.tsx` found.
- **Action:** Add per-route error UI.

## 13. OAuth token delivered in URL query string
- **Classification:** REDESIGN (security).
- **Finding:** Cross-domain cookie limitation forces token-in-URL.
- **Action:** Prefer same-domain auth or exchange that avoids URL tokens.

## 14. CORS allows no-Origin requests
- **Classification:** REDESIGN (security).
- **Finding:** `corsOriginValidator` returns true when `!origin`.
- **Action:** Scope no-Origin to public-only routes.

## 15. Global in-memory IP rate limiter
- **Classification:** REDESIGN (security scaling).
- **Finding:** 100 req/IP/15min, per-process; bypassable; no socket limit.
- **Action:** Centralize (Upstash) for all routes incl. sockets.

## 16. Deferred stubs (Events / Housing / Waybill)
- **Classification:** KEEP (intentional) — but document as not-built.
- **Finding:** "Coming soon" surfaces; no backend; not dead bugs.
- **Action:** Treat as future roadmap, not rebuild scope.

## 17. next build self-mutation (dev only)
- **Classification:** KEEP (document as CI requirement).
- **Finding:** Repeated builds corrupt Next dist under pnpm.
- **Action:** Always clean `.next` before build in CI.

---

# DUPLICATE FUNCTIONALITY
- **Vendor sections:** `/api/vendors` mounts `vendorRouter` (logged-in `/me`, `/upgrade`)
  + `vendorsRouter` (public `/:slug`) + `vendorSocialRouter` + `vendorHoursRouter` —
  four routers for one resource. Functional (ordering fixed) but fragmented; consolidate
  in rebuild. **Classification:** REDESIGN (maintainability).
- **Discovery:** `discoverRouter` (trending/recently-viewed/search) overlaps
  `searchRouter` + `listingsRouter` browse. **Classification:** REDESIGN (consolidate).

---

# DEAD CODE
- No `TODO`/`FIXME`/`HACK` markers found in source (one "temporary" comment on suspend,
  not dead). Apparent "dead" fields (e.g. `drafts`, unused enum states) are flagged as
  LEGACY ARTIFACT above, not as dead code, since they may serve future/edge paths.

---

# REBUILD WARNINGS

The rebuild must NOT accidentally reproduce:

1. **Moderator/API-vs-web-console mismatch** — decide the role and implement it fully or
   drop it; don't ship a half-wired tier.
2. **Unauthenticated privileged endpoints** — every admin/cron/backup/diagnostic route
   must be auth-gated (backup + cron + test were public).
3. **Public disclosure of platform metrics** — `/api/test/db` leaked user counts.
4. **Legacy/unused entity states** — don't carry `draft`/`paused`/`archived` (listing)
   or `pending_review`/`rejected` (vendor) without confirming product purpose.
5. **Implementation-specific search vectors** — carry the *need* for search, not
   tsvector columns.
6. **`User.drafts` Json field** — legacy; confirm before carrying.
7. **Base64-in-JSON uploads** — use multipart + presigned; don't reproduce the 1MB
   body-limit vs 5MB-cap contradiction.
8. **Write-on-read view counting** — de-dupe views; don't inflate metrics on refresh.
9. **OAuth token in URL** — avoid token-in-query; use cookie/POST exchange.
10. **CORS no-Origin allowance** — scope to public routes only.
11. **Cross-domain impersonation cookie** — implement session handoff correctly or
    colocate auth.
12. **Inconsistent mobile nav** — unify vendor with shopper/admin bottom-tab pattern.
13. **Per-process IP rate limiter** — centralize rate limiting for all surfaces.
14. **Build self-mutation** — always clean `.next` before build in CI.

---

# FINAL LEGACY ASSESSMENT

## Product completeness (qualitative, no invented percentages)
- **Clearly complete:** auth (email/OTP/magic/Google), shopper + vendor onboarding,
  browse/search/trending/recently-viewed, listing + vendor detail with full engagement,
  REST + socket.io realtime chat (verified), reviews + response + delete, wishlist/
  follow, reports/disputes, notifications, badges (cron), upload + moderation, agreements
  gate, 14-area admin console (incl. impersonation/audit/export/feature-flags).
- **Partially complete / inconsistent:** moderator role (API only), impersonation
  (cross-domain), mobile vendor nav, onboarding mobile preview.
- **Experimental / uncertain:** `pending_review`/`super_admin` review-step, `drafts`
  field, some enum states.
- **Broken / risky:** unauthenticated backup/cron/test endpoints; upload size cap bug;
  impersonation cross-domain (unverified working).
- **Unknown:** exact staff-provisioning mechanism; self-serve account deletion; cron
  scheduler; admin analytics N+1; external-failure retry behavior.

## Biggest product risks (10)
1. Unauthenticated privileged endpoints (backup/cron/test) — security + abuse.
2. Moderator role half-wired (authorization inconsistency).
3. Impersonation may be non-functional cross-domain.
4. Upload cap bug blocks normal photos.
5. Onboarding gate could soft-lock users without a seeded campus.
6. No staff self-serve provisioning path (ops dependency).
7. Deferred stubs (Events/Housing/Waybill) create expectation gaps.
8. View-count inflation distorts trending/popularity.
9. Inconsistent mobile UX (vendor nav, onboarding preview).
10. Unknown retention/legal posture for messages/reports/audit logs.

## Biggest technical risks (10)
1. Pervasive authorization gaps on unauthenticated routes.
2. In-memory per-process rate limiting (bypassable, non-scalable).
3. No retry/circuit-breaker on external services (uploads fail hard).
4. Write-on-read analytics (DB write per read).
5. Base64 upload transport (perf + cap bug).
6. Non-transactional upsert in `ensureVendorRow` (acceptable but noted).
7. Race-y `conversation_started` heuristic.
8. Socket.io `message` lacks rate limiting.
9. Heavy vendor-dashboard bundle (recharts 259kB).
10. next build self-mutation (dev/CI trap).

## Biggest security concerns
- Unauthenticated `POST /api/admin/backup/trigger` (Critical/High).
- Unauthenticated `GET /api/cron/tick` (state-changing).
- Unauthenticated `GET /api/test/db` discloses counts incl. user count.
- Moderator API-vs-web authorization mismatch.
- OAuth token delivered in URL query string.
- CORS allows no-Origin requests with credentials.
- (Mitigating: error handler safe, Zod validation, argon2, session-revocation, safeRedirect
  present.)

## Biggest rebuild opportunities
- **UX:** unified mobile nav; mobile onboarding preview; graceful onboarding fallback;
  custom error boundaries.
- **Performance:** multipart/presigned uploads; view de-duplication; bundle-split charts;
  image optimization verification.
- **Reliability:** external-failure retries; explicit created-vs-found; atomic vendor
  promotion where feasible.
- **Security:** uniform auth-gating; centralized rate limiting; tighten CORS; avoid
  URL tokens; verify impersonation.
- **Maintainability:** consolidate fragmented vendor routers; unify discovery routes;
  remove legacy fields/states.
- **Simplicity:** drop or fully implement moderator; remove legacy artifacts.

## Questions requiring human decisions (cannot be answered from code)
1. Is the **moderator** role intended to have a web console, or should it be removed?
2. How should **staff accounts** (admin/moderator/super_admin) be provisioned (DB seed,
   invite, or manual)?
3. Should **account deletion** be user-facing, and what retention applies to messages/
   reports/audit logs?
4. Is a manual **vendor approval/review step** (`pending_review`/`rejected`) a product
   requirement, or is go-live self-serve?
5. What is the **cron scheduler** mechanism (external cron vs in-app), and who triggers it?
6. Should **impersonation** be kept; if so, how should cross-domain session handoff work
   (same-domain auth vs token exchange)?
7. What **retention/legal** policy applies to private messages, reports, and audit logs?
8. Are **Events / Housing / Waybill** in scope for the rebuild, or out of scope?
9. Should the rebuild **colocate** web+api auth (same domain) to simplify cookies/tokens?
10. What is the desired **rate-limiting** posture (strict global vs per-route only)?

---

All findings are investigation-only. No application code was modified.
