# Operation Money Bag — REAL BUILD PLAN (v2, FULL)
**Status: FOUNDER GO RECEIVED · 2026-09-08 · Founder decisions locked: Featured = Option 1 (admin-curated) · Seeds = YES (S1-S5 conditions) · Google intent fix · Non-campus onboarding in scope**
*[v2] sections updated after GO. §0–§6 from the original plan stand unchanged — restored below in full.*

---

## [v2] SEEDS — the full contract (founder conditions)
**S1. Admin-deletable, permanently.** Seeds get `listings.source="seed"` (new nullable column, default null = real). Admin ListingsPanel gains **Delete-forever** on seeds: hard DELETE child-first (existing adminCleanup cascade pattern), bypassing soft-delete. Real listings keep soft-delete. Staff sees a "SEED" tag; vendors see nothing different.
**S2. Grouped under clearly-named accounts.** Seeds attach to the 5 existing demo vendors (Demo: prefix stays). Staff-only "Seeds" filter groups them per account — David sees seed vs real at a glance.
**S3. Images MUST show, zero mistakes.** Seeds upload through the REAL pipeline (signed → Sightengine → secure_url). Post-insert probe asserts `img.naturalWidth>0` on every seed — zero src-less, zero 404s. Aspect-ratio reserved (no CLS).
**S4. Crowd-flow, not overtake (code, not discipline).** Seeds EXCLUDED from: Fresh drops, Live picks, landing showcase, trending, bought-this badges. Seeds ALLOWED: explore grid floor, category rails — **only backfilling empty slots**. Flow rule: batches render real-first, seeds backfill; `seedCap = max(0, 8 − realCount)` per section per campus; real listings ≥8 on a campus = seeds don't render there. As real vendors grow, seeds auto-recede.
**S5. Retire script.** `retire-seeds.mts` (admin-gated, dry-run default): hard-deletes all source="seed" rows + children, reverts emptied demo vendors to pending_listings, audits. David runs it when the market is real.

## [v2] FEATURED SUPPLY — Option 1 locked
Nightly auto-shortlist (top ratingConfidence per category, ≥5 reviews, seed-excluded) → **Candidates view in admin** → David confirms picks by hand into voeq_live_picks. No picks confirmed = no shelf that day (honest empty state, never auto-filled). `confirmed_by` column is the future switch to full-auto + veto.

## [v2] PHASE DELTAS
- A1 migrations +: `listings.source` nullable ("seed")
- A2 nightly shortlist excludes seeds
- B2/B3/B4: crowd-flow rule in grid/rails/category queries
- D6 = seed builder (`seed-listings.mts`: real-pipeline uploads, source="seed", image probe, dry-run default)
- E3 admin ListingsPanel: SEED tag + Seeds filter + hard-delete
- Surgeon's addendum adds **G9** (seed-image integrity probe, re-run weekly) + **G10** (crowd-flow assertion: 8 real listings on a test campus → seeds stop rendering)

---

## 0. THE ALGORITHM FOR FAIRNESS
**Principle: visibility is earned AND bounded.**
1. **Landing showcase** — nightly composite: `0.35·ratingConfidence(Wilson) + 0.25·engagement30d + 0.2·freshness + 0.2·completeness`; max 14d consecutive slot + 7d cooldown; weekly shuffle among qualifiers.
2. **Fresh drops** — 72h recency FIFO, appears once (freshness window tracked in listing_fairness). Seeds excluded.
3. **Grid** — batches of 8 = [2 featured-eligible rotating + 6 fair-share]; round-robin by vendor; 48h weekly visibility floor per listing.
4. **Voeq Live** — earned (≥5 reviews + confidence), admin-confirmed (Option 1), max 1/vendor/week, never paid, rotates 9am, vendor notified (live_pick type).
**Honesty in code**: sold counts nowhere until orders exist; aggregate rating "—" until ≥50 reviews; deltas need ≥20 events; empty sections collapse; seeds carry no fake stats.

## 1. PAGE ARCHITECTURE
Routes: `/` (showcase home) · `/explore` (floor) · `/explore/live` · `/explore/trending` · `/explore/deals` · `/explore/c/[category]` · `/explore/areas/[area]` · `/listing/[id]` · `/vendor/[id]` · public info pages unchanged. Depth ≤2. Filters drawer on every explore page → URL params (?cat=&min=&max=&verified=&sort=) — shareable, back-safe.
Surfaces: `/` = v7.1 showcase; `/explore` = v1.1 floor (context strip Campus/Areas/All switch, section stack, drawer, NO pills); `/listing` = A2 + Money Bag (gallery counter, Live seal, vendor card w/ socials, share dropdown, comments v3, NO rating pill/sold); `/vendor` = S1 + v1.8 (BrandBanner Option B, identity card, socials+share, honest reviews, no footer).
Footer: landing + public info pages ONLY (SmartFooter allowlist narrowed). Campus 4-state machine: first visit (Set your campus, All-Nigeria default) / returning (voeq:preferred-campus in placeholder + counts) / logged-in (identity chip, badges) / logout-keeps-campus. Search bar never changes shape.

## 2. WIRING
**Schema**: listing_fairness, voeq_live_picks (confirmed_by), vendor_score_snapshot (breakdown jsonb), areas (36+FCT, state→area→subarea), vendors.area_id nullable, listings.source.
**Onboarding (F1)**: vendors without campus pick State→Area(+subarea); storefront shows area chip; proximity line where campus near.
**APIs**: /api/explore (scope/area/price/verified + sections=1 single round-trip), /api/live/today, /api/vendor/[id]/showcase, /api/staff/live-picks (capability listing.moderate), follow-comments endpoint.
**Nightly cron** (cron-nightly.mts, Vercel Cron): scores + windows + live shortlist → snapshots + audit.
**Auth (F2)**: startGoogleOAuth(intent?) embeds intent in state payload + cookie (CSRF intact); signup Google button passes selected intent; login Google passes ?intent=; become-vendor links pass intent=vendor; callback stores intent; **safety net**: intent still null after OTP → one-time "I'm shopping / I'm selling" choice screen — Google never decides. Probe proves vendor-intent Google flow lands /onboarding/vendor.
**Components**: ContextStrip, FilterDrawer (sheet/sidebar), BrandBanner, MobileNavDrawer, LiveSeal, StatBar, ShareBar reuse.
**WhatsApp channel**: code renders only when data exists (prod: none today) — zero work, zero risk.

## 3. BUILD ORDER (each step: plan→build→probe→typecheck→sweep→deploy)
- **A** Foundations: migrations (A1 + source column), nightly cron + algorithm unit tests (A2, seed-excluded), /api/explore extension (A3). Invisible to users.
- **B** Explore: components from mocks (B1), floor rebuild w/ probes updated same-commit + persistence preserved (B2), live/trending/deals (B3), category + area pages + onboarding area field + storefront area rendering (B4), sitemap/robots (B5).
- **C** Landing swap: v7.1 build (C1), showcase reads nightly scores + rotation probe (C2). Needs A data.
- **D** Listing + storefront alignment: listing pass (D1), storefront pass incl. BrandBanner + footer scope (D2), seed builder + image probe (D3).
- **E** Wiring: auth intent fix + google flow probe (E1), mobile drawer + campus machine (E2), whatsapp confirm zero-work (E3), admin SEED tag/filter/hard-delete (E3b), full regression + matrix extension (E4).
- **F** Launch care: 48h canary (?next=mb) → founder walkthrough on prod phones → cutover (F1); phase-isolated deploys (F2); rollback plan (F3).

## 4. RISKS
Probe-contract churn (same-commit test updates, persistence preserved) · algorithm weights versioned in snapshots (tunable, no code) · areas seeded in waves (honest "coming soon") · floor perf (sections=1 single request, lazy images, collapsing sections) · SEO (no route deletions, sitemap incremental).

## 5. SURGEON'S ADDENDUM
**G1** real images, zero CLS, blur-up · **G2** every number = DB COUNT · **G3** campus machine probed (4 sessions) · **G4** prefers-reduced-motion honored · **G5** sweep 320/390/430/768/1024/1440 · **G6** no scroll seizes (scrollY stable 60s) · **G7** 3G LCP<4s on canary · **G8** multi-tab race-safe persistence · **G9** seed-image integrity (weekly while seeds live) · **G10** crowd-flow assertion.
**Surgery rules**: typecheck 0 before Neon mutations · one phase deployed+verified before next · canary before cutover · probes in same commit · old paths live until new pass prod · deviations STOP and report · idempotent additive migrations · honesty enforced in code.
**Scoreboard per phase**: typecheck exit · vitest · raw probe output · sweep · matrix · deploy URL · explicit gap list.
