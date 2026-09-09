# MONEY BAG — PHASE C PLAN (landing swap) — FOR FOUNDER REVIEW, NO CODE YET
*2026-09-10 · Branch-only (money-bag-build), nothing on prod until you say so.*

## THE JOB (your locked brief)
`/` becomes the **advertisement**: biggest vendors + listings showcase, areas band, footer.
`/explore` stays the **real market** (done in B1–B3). All old landing CTAs scrapped.
Mock = **home-v7.html** (approved). Landing keeps: logo, signin/signup, footer. 

## C1 — THE NEW LANDING (one canary route, additive)
New server component `LandingMB` + components under `components/landing/mb/`:
1. **Nav v7**: two rows — row1 = BrandLogo(94) + filled forest search pill (submits to /explore?next=mb&q=) + Saved/Messages icons + signin/signup; row2 = category links (→ /explore/c/[slug]) + ✦ Voeq Live (→ /explore/live) + Sell pill. Mobile = logo + signin/signup + burger ONLY; drawer = search + Saved + Messages (A1/A2).
2. **Hero**: eyebrow "The student market" + serif "Find it. / Chat it. / Get it." (amber italic on Get it.) + sub "The trusted voice of your campus market…" + ONE CTA "Explore the market →" (real `<a>` to /explore?next=mb — crawlable, B4 lesson) + "or sell on Voeq ›" → /become-vendor.
3. **Polaroid collage**: 3 REAL listings (name + ₦ + campus + gold live dot), swipeable 390px, gentle rotate ±2.4°, hover-straighten. Data: /api/explore (real photos or contour monogram — never stock).
4. **Sand trust band**: Campus verified / Chat before you buy / Meet-on-campus safe + "Market open — [campus]" gold-pulse pill (REAL time-based, A5).
5. **Fresh drops** (forest band): big cards 84%/2+peek, 9s auto-advance, touch-pause, dots — REUSES the B1 FreshDrops component unchanged (same data, sections.freshDrops).
6. **Vendor Spotlight**: rotating vendor stage (crossfade 1.8s, ‹› arrows, pause on touch), "Today's pick" frosted bar + Visit storefront. Vendor = highest vendorScore in snapshot (A2 nightly cron output); fair-note "every vendor gets a turn". Empty data → section collapses (B7).
7. **On the grid today**: fair-share round-robin 8 cards (A2 algorithm), staggered reveal 100ms, LIVE/NEW tags + ▹ counters (MbCard reuse).
8. **What is Voeq?** sand band: 01 Find it / 02 Chat it / 03 Get it + vendor panel ("Your stall opens in minutes", 3 steps, "No listing fees · no commission on meet-up sales · you set your prices") → /become-vendor.
9. **Areas band**: "Beyond the campus gates" — state chips → /explore/areas/[slug] (real pages from B3).
10. **Explore door**: dashed pill "The full market — filters, categories, everything →".
11. **Footer v2** (existing SmartFooter/LandingFooter stays; market-open pill + tagline polish only if cheap).

**Honesty (B7/B10)**: no stats band numbers, no sold counts, ratings only when real (★ n from vendorRatingAvg, else nothing), "biggest vendors" = the spotlight by score — copy says "a rotating light on our vendors", never claims size we don't have. Empty sections collapse. No emoji. prefers-reduced-motion everywhere (B2). No scrollIntoView (B3).

## C2 — CANARY WIRING (D8)
- `/` reads `?next=mb` → LandingMB; absent → CURRENT landing untouched. Same additive pattern as /explore.
- No sitemap/metadata changes yet (noindex meta only on the canary render if needed). Zero route deletions.

## C3 — SPOTLIGHT DATA (small, honest)
- Reads vendor_score_snapshot (Phase A table). If the nightly cron hasn't run, spotlight falls back to featured-live vendors from /api/explore — and the section collapses if there's nothing real. No fake rotation.

## ACCEPTANCE GATES (same as B)
typecheck 0 · vitest 96/0 + fairness 28/0 · NEW probe rt-mb-landing.mts (canary renders MB landing, old landing intact without param, collage shows REAL listings, no sold/claims scan, spotlight honest, areas links real, crawlable <a> CTAs) · floor/L2/B3 probes still ALL PASS · sweep @390px.

## NOT IN THIS PHASE (explicitly)
- Nightly cron scheduling (Vercel Cron) — C3 reads snapshots; the cron script itself ships in E.
- Seeds on the landing (crowd-flow forbids it; D6 later).
- Footer redesign beyond polish (A22 full version = E-phase SmartFooter work).
- Cutover to the real `/` (F1, after your phone walkthrough).

## RISKS (honest)
- Spotlight with ~0 scored vendors will usually collapse on prod → the landing may look thinner than the mock until cron runs. Accepted: honesty > fullness.
- LandingHero/TrendingRail/CategoryGrid etc. stay in the codebase untouched (old landing still renders) — dead-code sweep happens at cutover, not now.

**YOUR CALL**: approve as written, or adjust before I write a line.
