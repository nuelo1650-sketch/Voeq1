# Voeq — Code Standards
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Status: AWAITING FOUNDER CONFIRMATION.*

## TypeScript
- Strict mode; full-project `npm run typecheck` exit 0 is the hard gate before ANY live Neon mutation.
- Cross-package drizzle in apps/web routes causes type-mismatches (two drizzle-orm installs) — DB helpers live in packages/db, apps/web imports from @voeq/data facades.
- Interfaces live in packages/data/src/interfaces.ts — append-only evolution; prefer deleting duplicate interfaces over widening (tsc-enforced repo parity).

## Patterns
- Repos: `mock*Repo` facades in packages/data switch to real Neon implementations when DATABASE_URL is present. All data access through repos — never raw SQL in components (probes/migrations are the exception, in packages/db/scripts).
- API routes: validate body explicitly, return precise error codes (`title_min_3`, `price_invalid`), audit via `logAudit("<event>", identityId, {...})`.
- Ownership: every vendor-scoped route checks `identity.vendorId` against the resource. Comments: author-scoped at REPO layer (`WHERE id AND author_id`).
- Notifications: `NotificationType` union is append-only. `type: "system"` + refId so clicks route somewhere useful.
- Zero `dangerouslySetInnerHTML`. XSS-safe by construction.

## Naming + files
- Server/client barrels: `@voeq/data` (client-safe) vs `@voeq/data/server` (server-only — media/images/email). NEVER import server barrel from a client component (build fails on node:crypto).
- Pure data for client: `@voeq/data/explore-view` (taxonomy), `@voeq/data/client` (isOpenNow, agreement constants).
- Testids: kebab-case, page-prefixed (`explore-grid`, `listing-detail-title`, `vs-statbar`). They are the probe contract — keep stable, add not rename.
- CSS: tokens from `@voeq/design-tokens/tokens.css` via `var(--...)`. NEVER hardcode colors/spacing in components. Component-scoped prefixes (`.vs-*` storefront, `.landing-*` landing, `.explore-*`) to avoid cross-page cascade collisions.
- **CSS laundry rule**: grep globals.css for legacy `[data-testid=...]` + `!important` rules BEFORE blaming the design system — legacy blocks have beaten new CSS in 6 rounds.

## Process (non-negotiable)
- Plan-gate: refined plan as its own turn → explicit standalone founder "go" before ANY mutating tool call.
- One commit per logical change, detailed message (root cause, fix, proof, gates).
- Probe before fix, probe after fix (rt-*.mts in packages/db/scripts — round-trip vs TEST DB via real API).
- Isolated verification: typecheck + vitest + relevant probe per commit. "Should be fine" is disqualifying.
- Deletes: only via tested cascade (adminCleanup pattern). Temp/ is TRACKED — `git rm` not `rm -rf`.
- Dev servers: ONE at a time. Mine on :3031, David's on :3030 — never touch his. Kill mine before claiming anything renders.
- Never ship on a stale probe: re-run the suite that failed before concluding (server-kill races produce fake FAILs).
- Honest gap-listing: "I did NOT verify X" beats claimed completion. No fabricated timings/viewport claims — real tool output or nothing.
