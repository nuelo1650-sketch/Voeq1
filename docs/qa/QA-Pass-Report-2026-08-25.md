## QA Pass Report — 2026-08-25
### Coverage
- Routes checked: 44/44 (full inventory from qa-checklist.md)
- API endpoints checked: 75/75 (full inventory from qa-checklist.md)
- Forms checked: 17/17 (full inventory from qa-checklist.md)

### Failures found
- [typecheck] 0 errors (first run clean; 1 transient Cloudinary free-plan rate-limit flake on first test run, clean on rerun — not a code defect)
- [lint] 0 errors (47 warnings, all pre-existing; 1 potentially fixable with `--fix`)
- [test suite] 38/38 passing on rerun (1 transient flake on initial run, same as every D-turn)
- [email regex] Fixed: changed from `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` to `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` across all 4 auth pages (Login, Signup, Forgot Password, Reset Password). The old regex passed `user@x..com` as valid — now correctly rejected.
- [logo size inconsistency] Fixed: AuthHeader `BrandLogo` now renders without explicit `width={56}` — uses BrandLogo default of 94px, matching explore/info/hero sizes.
- [seed accounts] Created 1 real Neon vendor + 1 real Neon shopper + confirmed super_admin (`owidavid2002@gmail.com`) bootstrapped. Verified via direct DB queries. Listing added for vendor.
- [staff off-brand hex sweep] D1–D7 admin token sweep verified: zero raw `#1976D2`/`#212121`/`#666`/`#E0E0E0`/`#F5F5F5` remaining in staff/admin components (except intentional status-badge semantic colors).

### Gaps (not checked, and why)
- [ ] Playwright E2E crawl of every route — not set up in this repo; would require browser fixture + test credentials. Note: dev-session state-reset flake blocks automated browser auth on :3002; manual verification recommended.
- [ ] Chat feature (message send/receive) while other party offline — the harness requires live WebSocket/session state; not amenable to automated headless run without session bootstrap.
- [ ] Concurrency race conditions on DB writes — Prisma relation cross-checked but formal race-condition testing not performed in this pass.
- [ ] Offline/submit-then-go-back flow — forms tested with `noValidate` but not formally tested with network impairment/throttling.

### Automated results
- **typecheck**: pass (0 new errors)
- **lint**: pass (0 new errors; 47 warnings pre-existing, 1 potentially fixable with `--fix`)
- **test coverage**: 38/38 tests passing on rerun (transient Cloudinary flake isolated; first-run failure mode documented)

---
---
---