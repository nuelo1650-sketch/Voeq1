# MONEY BAG — FIX PLAN (audit response, 2026-09-10)
*Founder approved fixes; the audit verdict is the source. One batch, gated, then deploy conversation.*

## Context
The hostile self-audit found the build ~90% true to the ledger, with real gaps: 1 security-class, 2 founder-rule violations, several D2 leftovers. Everything below traces to a finding you've seen. Nothing here redesigns — all fixes are alignment with the locked plan.

## FIX BATCH (in execution order, each verified before the next)

### F-1. JSON-LD script-tag breakout — SECURITY (audit finding 1)
`apps/web/lib/seo.tsx` — `JsonLd` renderer: escape `<`, `>`, `&`, U+2028/2029 in the JSON string before injecting:
`JSON.stringify(data).replace(/</g, "\\u003c")` etc. (standard pattern; keeps JSON valid for parsers).
- Probe: extend `rt-seo-jsonld.mts` — fixture listing titled `</script><script>alert(1)</script>`; assert no `</script>` appears raw inside the JSON-LD body and the page renders with no dialog.

### F-2. BrandLogo everywhere — A24 VIOLATION (finding 2)
Replace the inline text wordmark (`voeq<span>.</span>`) with the real `<BrandLogo />` component in: LandingNavMB (nav + drawer), ExploreMB, LivePageMB, TrendingPageMB, AreaPageMB, CategoryPageMB (6 files). Verify BrandLogo's expected width prop (94px standard).
- Probe: rt-mb-floor asserts `[data-testid] img` wordmark presence; grep proves zero `voeq<span` remain in mb/ components.

### F-3. B6 first-visit campus chip (finding 3)
ContextStrip: when `localStorage voeq:preferred-campus` is absent → render the "Set your campus" chip (opens the existing campus selector / filter drawer location section). Returning visitors see the campus name as today. Logout keeps device memory (already true).
- Probe: new check in rt-mb-floor — clear localStorage → chip visible; set campus → chip replaced by campus name.

### F-4. D2 leftovers (finding 4a)
- StorefrontHero: add "On Voeq since {year}" line under the description, derived from `agreementAcceptedAt` (real data; omit when null).
- Category pills fallback: when `categoryIds` is empty, compute pills from the vendor's active listings' categorySlugs (StorefrontHero already receives listings via view model — verify and wire).
- Cron dedupe (finding 4b): cron-nightly live-pick upsert gets a vendor-day guard — DELETE existing unconfirmed candidates for (vendor, today) before INSERT, so max 1 candidate/vendor/day regardless of best-listing flips.
- Vercel cron registration: add `crons` entry to vercel.json (0 6 * * * → /api/cron/nightly) + create the route (GET, gated by CRON_SECRET header check, calls the same logic — refactor cron-nightly core into an importable module).

### F-5. Ride-along P2s (same batch, cheap)
- middleware.ts: send NO ACAO header for unknown origins (drop the allowlist[0] fallback).
- "All 36 states" → "All 37 states & areas"? DECISION: copy stays "All 36 states" (founder phrasing) but ExploreDoor `areas={37}` becomes derived from the seed count constant; fix the number mismatch by standardizing on "36 states & FCT" phrasing — flag to founder in report.
- Polaroid captions: restore campus caption from vendor data (mock v7 promised campus; vendor campus is available in the payload via vendorName lookup — if per-listing campus isn't in the payload, show it when available, else keep "verified"; NO fabrication).
- Nav drawer a11y: role="dialog" aria-modal, Esc-to-close, focus moves into drawer on open, returns on close.
- Spotlight interval: deps array fix ([paused] only; idx accessed via ref).
- A19 wording: "scores unlock after 50 reviews" → "scores unlock at 50 reviews" (matches >=50 behavior).

### F-6. Seed safety scripts (pre-seed must-builds, S5)
- `packages/db/scripts/seed-listings.mts`: founder-commissioned seed builder — reads a JSON spec (vendor handle, title, category, price, image URLs), runs images through the REAL pipeline check (Cloudinary URL validation), inserts with source='seed', dry-run default.
- `packages/db/scripts/retire-seeds.mts`: admin-gated (STAFF token env), dry-run default, hard-deletes ALL source='seed' rows via adminCleanup cascade, reverts demo vendors left with 0 real listings to pending_listings, prints full audit.
- These are BUILT but NOT RUN — seeds only enter prod after you review the spec + say go.

## NOT IN THIS BATCH
- Nightly cron SCHEDULING is included (F-4) but the cron's first prod run happens only after deploy.
- Ledger A22 footer v2 full redesign — DEFERRED with note (current footer is honest + functional; full v2 is a separate design pass if you want it).
- B8 polaroid CAMPUS caption needs per-listing campus in payload — doing vendor-campus fallback if trivially available, else flagged as gap.

## GATES (all must pass before we talk deploy)
- typecheck 0
- vitest full suite green (96+fairness 28)
- rt-seo-jsonld.mts EXTENDED with the escape check — ALL PASS
- rt-mb-floor + rt-mb-d EXTENDED with chip + banner regression — ALL PASS
- all other probes (l2/b3/sections/landing/e3b/a2-detail/ux-batch) still ALL PASS
- grep: zero `voeq<span` in mb/; zero scrollIntoView in carousels; zero raw `<` in JSON-LD output
- commit(s) reference ledger IDs; branch push; master/prod untouched

## THEN
Deploy conversation: canary `?next=mb` to prod for your phone walkthrough (F-1..F-5 verified first). Seeds remain a separate decision entirely.
