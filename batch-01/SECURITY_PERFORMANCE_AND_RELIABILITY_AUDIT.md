# SECURITY_PERFORMANCE_AND_RELIABILITY_AUDIT.md — Voeq (FINAL)

> Code/configuration-level audit (not a penetration test). Evidence: `app.ts`,
> `routes/*`, `middleware/*`, `services/*`, `realtime.ts`, `index.ts`, web `lib/*`,
> `components/*`, build output, `.env.example`, `render.yaml`. Investigation-only; no
> secrets copied. Confirmed vs observed separated.

---

# SECURITY

## Authentication (Confirmed safe)
- Session model: JWT (jose) + server-side `Session` row; `requireAuth` re-checks the
  session row, so signout/logout-all invalidate instantly. ✅
- OTP/magic-link: require a valid pending token (anti-enumeration); OTP resend also
  requires pending token. ✅
- Passwords: argon2 (strong). ✅
- Google OAuth: code→token→profile; intent carried in signed state; super_admin/admin
  routed to `/admin`. ⚠️ Token delivered via URL query string (minor; see Known Issues #9).
- Recovery: password-reset request/consume with purpose-bound tokens. ✅

## Authorization (Confirmed issues)
- **Unauthenticated privileged endpoints (CONFIRMED):**
  - `POST /api/admin/backup/trigger` — mounted outside `adminRouter`, no `requireAdmin`
    (Known Issues #1, Critical/High).
  - `GET /api/cron/tick` — mounted under `apiRouter`, no guard (Known Issues #2, Medium).
  - `GET /api/test/db` — public; discloses user/institution/campus/category/agreement/
    featureFlag counts incl. **user count** (Known Issues #3, Medium).
- **IDOR / ownership:** Review service, listing service, conversation service all enforce
  ownership/participation checks before mutate. ✅ No IDOR observed in core mutate paths.
- **Role checks:** `requireVendor`/`requireShopper`/`requireSuperUserAdmin` (web) +
  `requireAdmin`/`requireModerator`/`requireSuperAdmin`/`requirePermission` (API) enforce
  section + capability. ⚠️ Moderator mismatch (API-enforced, web-invisible) — Known
  Issues #5.
- **API vs frontend discrepancy:** moderator accepted by API but no web console
  (authorization inconsistency, not an escalation beyond moderator's intended scope).

## Input handling (Observed)
- All API inputs validated with Zod at route boundaries; error handler returns 400
  ValidationError (no stack leak). ✅
- File upload: type + size + SightEngine moderation before Cloudinary. ✅ But base64-JSON
  transport + 1MB global body limit makes the 5MB cap unreachable (Known Issues #4/#12).
- HTML/content rendering: listing/review text rendered via React (auto-escaped);
  `isomorphic-dompurify` present in deps (sanitization available). No raw `dangerouslySetInnerHTML`
  observed. ✅ (INFERRED safe; not exhaustively traced.)
- Unsafe URLs: `safeRedirect` rejects schemes/protocol-relative/`@`/foreign hosts. ✅

## Sensitive information exposure
- Error handler returns generic 500 (no stack/SQL). ✅
- Secrets: only env var **names** referenced; no values in code/docs. ✅
- **Exposure risks:** public `/api/test/db` (counts) and unauthenticated
  backup/cron (side effects, not data leak). No PII leakage observed in API responses.

## Rate limiting / abuse prevention
- Upstash Redis (with in-memory fallback) on auth/upload/agreement (specific limits:
  OTP 5/15min lockout, magic 3/15min, upload 50/hr). ✅
- Global in-memory IP limiter: 100 req/15min/IP (`app.ts`). ⚠️ Per-process only
  (single free-tier instance OK); easily bypassed by spoofed IP behind misconfigured
  proxy; allows no-Origin requests (CORS). Partial coverage.
- Socket.io `message` events: no per-event rate limit (participant could spam). Low.

## External integrations (trust boundaries)
- Google OAuth: server-side secret; state-signed intent. ✅
- Resend (email), Cloudinary (media), SightEngine (moderation), Upstash (ratelimit),
  Neon (DB), PostHog/Sentry (observability). Webhook validation: **none observed** (no
  inbound webhooks in code). ⚠️ Cron has no secret/token (see #2).
- CORS pinned to `CORS_ORIGIN` (voeq.ng) but allows no-Origin (see Known Issues #10).

---

# PERFORMANCE (evidence-based observations)

## Confirmed / strongly inferred
1. **Upload transport inefficiency:** base64-in-JSON inflates ~33% and is capped by the 1MB
   global JSON limit (Known Issues #4/#12). Use multipart + presigned uploads in rebuild.
2. **Write-on-read view counting:** `getListingBySlug` increments + logs EventLog on every
   GET (Known Issues #6). Adds a DB write per read; inflates popularity metrics.
3. **Bundle sizes (from build output):** vendor/dashboard 259 kB First Load (recharts),
   admin 212 kB, `/` 161 kB, browse 161 kB, v/[slug] 195 kB. recharts loads only on
   vendor dashboard + admin analytics (3 files); socket.io-client only on messages route
   (not global). ✅ Acceptable, but vendor dashboard is heavy due to charts.
4. **No global N+1 observed** in `listListings` (single query + 2 aggregates +
   groupBy); `getListingBySlug` does 1 read + related + increment (a few queries).
   INFERRED: dashboard pages issue several concurrent fetches (`Promise.all`), which is
   fine; deeper N+1 in admin analytics UNKNOWN (not traced).
5. **Unoptimized images:** photos stored on Cloudinary with explicit width/height in DB —
   `next/image` or similar likely used; optimization depends on web implementation
   (UNKNOWN exact usage). Flag for rebuild verification.
6. **Repeated API calls:** `(main)/layout.tsx` runs `getMe()` on every (main) page load
   (client-side) — a per-navigation fetch; could be cached/token-refreshed. Low.

---

(Performance continued + Reliability below.)

---

# RELIABILITY (evidence-based observations)

## Confirmed / strongly inferred
1. **Error handling present and safe:** `errorHandler` returns generic 500 (no stack
leak); `notFoundHandler` + `errorHandler` mounted last in `app.ts`. Express
`next(error)` routed correctly. ✅ No info disclosure on errors.
2. **Process resilience:** `index.ts` handles SIGTERM/SIGINT, `unhandledRejection`,
`uncaughtException` (logs + exits). ✅
3. **Socket.io disconnects:** ping/timeout configured (pingTimeout 20s, pingInterval
25s). socket.io-client auto-reconnects by default (INFERRED). Realtime `message`
broadcast is fire-and-forget with an `ack` callback. Low.
4. **External service failure:** If SightEngine/Cloudinary/Resend/Upstash fail, the
calling route returns 500. Upload requires moderation+Cloudinary — if either is down,
uploads fail (no fallback). ⚠️ No retry/circuit-breaker observed.
5. **Database failures:** Prisma throws; unhandled → 500. `ensureVendorRow` intentionally
avoids transactions (pooled-DB compat); idempotent upsert mitigates. Low.
6. **Race conditions / idempotency:**
- `ensureVendorRow` idempotent upsert (safe vs double-submit). ✅
- `conversation_started` logged via 2s heuristic (Known Issues #7) — fragile.
- `getListingBySlug` increments without de-dup (Known Issues #6).
7. **Data consistency:** soft-deletes filter correctly; review delete cascades in a
transaction; rating recomputed in same flow. ✅
8. **next build self-mutation (dev only):** repeated builds corrupt Next dist; clean
build in CI mitigates. Known Issues #15.

---

# AUDIT SUMMARY

| Area | Status | Key findings |
|---|---|---|
| Authentication | Confirmed safe | JWT+session, OTP pending-token, argon2, OAuth intent |
| Authorization | Issues found | 3 unauthenticated privileged endpoints; moderator mismatch |
| Input handling | Confirmed safe | Zod validation, generic errors, moderation on upload |
| Sensitive exposure | Mostly safe | public test endpoint discloses counts (Medium) |
| Rate limiting | Partial | Upstash on key routes; global in-memory per-process; no socket limit |
| External integrations | Trust gaps | no cron secret; CORS no-Origin allowed |
| Performance | Observations | base64 upload, write-on-read views, heavy vendor dashboard bundle |
| Reliability | Mostly safe | safe error handling; few race/de-dup gaps; no retry on ext-fail |

**Security concerns (6):** unauthenticated backup trigger, unauthenticated cron, public
test-disclosure endpoint, moderator API/web mismatch, OAuth token-in-URL, CORS no-Origin.
**Performance concerns (6):** base64 upload inefficiency + cap bug, write-on-read view
counting, heavy vendor dashboard bundle (recharts), potential image-optimization gap,
per-navigation getMe() fetch, deeper admin-analytics N+1 UNKNOWN.
**Reliability concerns (8):** safe error handling (positive), process signals handled,
socket resilience, no external-failure retry, pooled-DB non-transaction upsert,
conversation_started heuristic race, write-on-read de-dup gap, dev-only build self-mutation.

No application code was modified during this audit.
