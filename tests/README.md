# VS2 Test Harness

Direct-import verification for the Voeq identity layer (VS2). The harness imports
`@voeq/data` directly — bypassing Next.js route handlers and their on-demand
module compilation — so logic-heavy chunks are tested deterministically in one
process (no cross-instance in-memory store splits).

## Why two layers

- **Data-layer harness (`vs2-harness.ts`)** — proves the auth logic is correct
  regardless of Next dev quirks. Used for: VS2.4, VS2.5, VS2.7, VS2.11.
- **Route-level curl / browser** — proves the HTTP shell, cookies, redirects,
  middleware, and pages. Used for: VS2.2, VS2.3, VS2.6, VS2.8, VS2.9, VS2.10.

Route handlers are thin shells over the data layer; if the data layer passes,
the routes pass (proven by VS2.1/2.2/2.3 atomic E2E).

## Run

```bash
cd packages/data && npm run typecheck   # keep types green
cd ../..
npx tsx tests/auth/vs2-harness.ts        # all harness chunks
```

## Reset helpers (dev/test-only, NOT imported by any production path)

- `resetAuthState()` — clears identity/session/pending/otp/magic-link stores
- `resetAudit()` — clears the audit log
- `rateLimitStore.clear()` — clears rate-limit buckets (throws in production)
- `magicLinkEntries()` / `peekOtp()` / `peekMagicLink()` — dev introspection

HTTP equivalents (all 404 in production):
- `POST /api/dev/reset-rate-limit`
- `POST /api/dev/otp`  (body: `{ email, purpose }`)
- `POST /api/dev/magic-link`  (body: `{ email }`)

## Production safety

Rate-limiting is ALWAYS enforced in production
(`ENFORCE_RATE_LIMIT = NODE_ENV==='production' || VOEQ_RATE_LIMIT_DISABLED!=='true'`).
The `VOEQ_RATE_LIMIT_DISABLED=true` kill switch is honored only in development.
All dev/reset/peek endpoints return 404 before any side effect when
`NODE_ENV==='production'`.

## Chunk → verification map

| Chunk | Harness | Route/curl | Browser |
|-------|---------|-----------|---------|
| VS2.1 data seam | ✓ (smoke + resetAuthState) | — | — |
| VS2.2 signup+OTP | — | ✓ | ✓ |
| VS2.3 login | — | ✓ | ✓ |
| VS2.4 reset (magic link) | ✓ | ✓ | ✓ |
| VS2.5 canonical OTP | ✓ | — | — |
| VS2.6 Google OAuth | ✓ | ✓ | — |
| VS2.7 consent gate | ✓ | — | — |
| VS2.8 campus | ✓ (logic) | ✓ | ✓ |
| VS2.9 ?next+middleware+session | ✓ (logic) | ✓ | ✓ |
| VS2.10 account states | ✓ | ✓ | ✓ |
| VS2.11 rate-limit+audit | ✓ | — | — |

## Added dev endpoints (all 404 in production)

- `POST /api/dev/reset-rate-limit` — clears rate-limit buckets
- `POST /api/dev/reset-identities` — clears identity/session/otp/magic-link stores
- `POST /api/dev/otp` — peeks current registration OTP for an email
- `POST /api/dev/magic-link` — peeks current reset magic-link token for an email

All four refuse to run when `NODE_ENV==='production'` (404 before any side effect).
