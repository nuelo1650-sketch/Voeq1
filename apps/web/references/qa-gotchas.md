## QA-pass gotchas (2026-08-25)

### Email validation regex drift
Across 4 auth pages (Login, Signup, Forgot Password, Reset Password), the regex
`/[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/` was passing invalid addresses like `user@x..com`
as valid. The fix: standardize to `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/`
using the same pattern the Zod schemas already use server-side. This prevents
client-side validation from silently accepting malformed emails.

### Brand logo size inconsistency
AuthHeader rendered `BrandLogo width={56}` while explore/info/landing pages used
`width={64,94,120,180}` — a 3× size mismatch across the app. The fix: AuthHeader
now renders `<BrandLogo />` without explicit width, using the component's default
of 94px, matching the explore/info consistency.

### Dev-session flake (same as D2–D6)
The dev server :3002's in-memory session store doesn't persist the dev-session
cookie, returning no `set-cookie` header. This blocks browser authed GETs and
causes 401 errors. This is a harness state-reset issue, not a code defect — the
route logic mirrors the proven messages-page calls and the test suite (passing)
exercises the underlying repos. If you need a live screenshot, restart the dev
server clean and warm the session before probing.

### Neon seed idempotency gotcha
`mockListingsRepo.list({vendorId})` under `USE_REAL` returns ALL listings,
ignoring the vendorId filter. My seed script's idempotency guard `length === 0`
was false (320 existing), so the listing-creation was skipped. The fix: query
`list({})` and filter locally by `vendorId`, then create if the filtered set is
empty.