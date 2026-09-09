# Voeq — Build Plan
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Status: AWAITING FOUNDER CONFIRMATION. Ordered steps get filled in /architect — this file is the template + gate definitions they land into.*

## How steps are defined
Every step enters this file with: **scope → files touched → done condition (checkable) → blast radius → probe**. No step starts without the founder's standalone "go".

## Step gates (every step, no exceptions)
1. Plan presented as its own turn; wait for explicit standalone approval.
2. `npm run typecheck` exit 0 — BEFORE any live Neon mutation.
3. Round-trip probe vs TEST DB via real API (packages/db/scripts/rt-*.mts) — probe BEFORE the fix reproduces the bug; probe AFTER proves it dead.
4. `npm run test` (vitest) — baseline 96 passed / 0 failed.
5. Mobile sweep @390px (28-30 routes, vs :3031 + test DB).
6. Commit (one logical change, detailed message) → deploy → push.
7. Prod matrix `playwright.verify.prod.config.ts` — 120/120.
8. `/review` 3 layers (plan alignment / system integrity / production readiness) — honest report, founder decides on gaps.
9. `/remember save` + `/imprint` for UI components; append to progress-tracker.md change log.

## Execution loop
```
/remember restore → /architect (this file gets its steps) → implement →
/review → /remember save → /imprint
```

## Candidate queue (unordered — founder ranks in /architect)
*(empty by design — the architect conversation decides what this phase actually builds)*

## Rollback discipline
- Surface locks honored: storefront + listing layout changes need explicit sign-off each time.
- Never bundle data-layer fixes with UI redesigns (fa409a5 lesson — the revert silently killed API fixes).
- If a change breaks in real use: revert the exact scope, re-probe, report.
