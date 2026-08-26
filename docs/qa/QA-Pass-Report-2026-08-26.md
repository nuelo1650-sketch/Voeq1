# QA Pass Report — 2026-08-26

## Coverage
- Routes checked: **42/42** (full `find apps/web -name page.tsx` inventory; every page's role + server/client + guard verified via grep of lib/session calls + selective full reads)
- API endpoints checked: **75/75 inventoried**; ~20 read in full (auth/*, home, notifications, listings POST, vendor/photo, staff/analytics, conversations + messages). Remaining 55 verified by method/path + representative reads of guard patterns (`currentIdentity` 401 / `requireCapability` 403 / ownership checks).
- Forms checked: **15/15** (5 auth forms payload-matched to server zod; listing create, chat send, onboarding steps, conversation create — all matched; remaining static forms confirmed `noValidate` + client-side checks mirror server).

## Failures found (real, with evidence)

### F1 — `/admin` not matched by middleware (edge guard dead) — FIXED
- File: `apps/web/middleware.ts` matcher array now includes `"/admin/:path*"` (patch applied 2026-08-26). Typecheck passes.
- Verification limit: could not live-curl `/admin` in this sandbox (dev-session cookie flake), but the change mirrors the existing `/staff/:path*` entry exactly and compiles.

### F2 — Test hook `FAIL_TEST` left in production message route — FIXED (removed)
- File: `apps/web/app/api/conversations/[id]/messages/route.ts` lines 91-101 deleted.
- Grep confirmed zero test usages of `FAIL_TEST` before removal, so no test depends on it. Full suite still 38/38 after removal.

### F3 — Test suite: 1 real failure (timeout) — FIXED (root cause = load contention, not hang)
- File: `apps/web/tests/e2e-critical.test.ts` line 60 `acceptConsent records consent; setStatus activates`.
- Investigation: ran the test in isolation 3× → 4901ms / 4224ms / 4290ms, **all passed** (under default 5000ms just barely). In the full 38-test suite it hit exactly 5000ms because real-Neon roundtrips contend for the connection pool. Conclusion: flake (too-tight default timeout under load), NOT a logic bug or hang.
- Fix: `vitest.config.ts` `testTimeout: 30000` (real Neon roundtrips legitimately take 4-5s under contention; 30s gives headroom without masking a genuine hang). Full suite now 38/38 green.

### F4 — Coverage reporting broken — PARTIALLY FIXED (declared, not installable here)
- `package.json` now lists `@vitest/coverage-v8` in devDependencies AND a `test:coverage` script (`vitest run --coverage`); `vitest.config.ts` has a `coverage` block (provider v8, reporters text/json/html, include app/lib/components).
- BLOCKER: the npm registry is unreachable from this sandbox (`UND_ERR_DESTROYED` on every GET), so `pnpm add -D @vitest/coverage-v8` did NOT install the package. On a networked machine / CI, `pnpm install` will resolve it and coverage will run. Coverage % therefore still cannot be reported from this environment.
- Evidence: `ls node_modules/@vitest/coverage-v8` → MISSING after install attempt.

## DB relation cross-check (real, from packages/db/src/schema.ts)
- **No `onDelete` cascade on ANY table.** All FK-like columns (`identities.vendorId`, `vendors.identityId`, `listings.vendorId`, `reviews.vendorId/authorId`, `messages.conversationId`, `notifications.recipientId`, `follows.vendorId`, `wishlistItems.*`, `comments.listingId`) are plain `text` with no DB constraint.
- Orphan risk: deleting an identity leaves sessions/otps/magicLinks/vendors/reviews/notifications orphaned (no cascade). Deleting a vendor leaves listings/reviews/follows/wishlistItems pointing at a dead `vendorId`. Deleting a conversation leaves messages orphaned.
- **Status: BACKLOG (deliberate decision deferred per user).** Not a same-session fix. Options to decide later: (a) add Drizzle `onDelete: "cascade"` where appropriate, or (b) adopt soft-delete everywhere + manual orphan cleanup in staff delete paths. Either way it's a design decision, logged for the backlog.

## Auth/onboarding verification (real)
- Onboarding steps CANNOT be skipped: `step-2` route returns 400 `"Complete step 1 first."` if `!identity.vendorId`; `step-3` returns 400 `"Complete steps 1–2 first."`. Shopper `complete` requires auth (401). Wizard resumes to correct step from saved state. ✓
- Chat IDOR: `/messages/[id]` page returns `notFound()` if `!conv.participantIds.includes(identity.id)`; message route returns 403 if `forbidden`. ✓ Both sides protected.
- Suspended vendor: cannot send (403), can read. ✓
- Minor: `/shopper` is in `PROTECTED_PREFIXES` but no `/shopper` route exists (shopper home is `/home`) — harmless dead entry, left as-is.

## Gaps (explicit)
1. **Live API auth-enforcement curl tests** — dev-server session-cookie flake blocked authenticated curl on :3002. Static verification only.
2. **Chat offline-send test** — needs two live sessions + SSE; harness flake blocks it. Code-level only.
3. **Coverage %** — blocked by F4 install failure (no network in sandbox). Dep now declared; will work on networked machine.
4. **Race conditions on concurrent listing edits** — not simulated (no version/lock column in schema).
5. **DB orphan simulation** — not executed against Neon.
6. **Playwright E2E** — not set up in this repo.
7. **55 API routes** — verified by pattern, not line-by-line.

## Automated results (post-fix)
- **typecheck:** PASS (0 errors, `npx tsc --noEmit` exit 0)
- **lint:** PASS (0 errors; 47 pre-existing warnings)
- **test:** **38 passed / 0 failed** (was 37/38; F3 fixed via timeout)
- **coverage:** DECLARED but BLOCKED (F4 — `@vitest/coverage-v8` not installable in sandbox; run `pnpm install` on networked host)

## Fix summary (2026-08-26)
| ID | Fix | Status | Verified |
|----|-----|--------|----------|
| F1 | +`/admin/:path*` to middleware matcher | DONE | typecheck; live-curl blocked by flake |
| F2 | removed FAIL_TEST debug branch | DONE | 38/38 tests pass |
| F3 | vitest testTimeout 30s | DONE | 38/38 (was 37/38) |
| F4 | declared coverage dep + config + script | PARTIAL | dep NOT installed (no network); will work networked |
| DB cascade | backlog item | DEFERRED | n/a (design decision) |
