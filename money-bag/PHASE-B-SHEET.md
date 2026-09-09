# MONEY BAG — PHASE B EXECUTION SHEET (explore system)
*Started 2026-09-09 after Phase A shipped (prod voeq-q6frt1hb8, matrix 120/120). This file is the phase's working contract — build order, acceptance checks, honest gaps. Ledger IDs referenced per commit.*

## B-PHASE SHAPE (from BUILD-PLAN-REAL §1.1 + explore mocks)

**Components (new, under apps/web/components/explore/mb/):**
1. `ContextStrip.tsx` — 📍 campus · live count · Campus/Areas/All-Nigeria segmented · Filters button w/ count badge; sticky (A11)
2. `MbFilterDrawer.tsx` — bottom sheet <768px / LEFT SIDEBAR ≥768px; Location, Category multi, Price manual ₦ min/max (NO sliders), Trust checkboxes, Sort; Apply w/ count + Clear all; URL-param sync (A12)
3. `FreshDrops.tsx` — forest band, live pill, big cards (84% mobile / 2+peek desktop), 9s auto-advance rail-local, pause-on-touch 12s, dots sync (A6, B1, B3, B4)
4. `LiveShelf.tsx` — stage cards w/ gold ✦ Voeq Live seal, rank numerals; reads sections.live (A13 data)
5. `MbCategoryRails.tsx` — Food/Fashion rails (server-computed category slices)
6. `TrendingWeek.tsx` + `Under5k.tsx` — honest rails (B7: deltas need ≥20 real events else hidden)
7. `GridToday.tsx` — crowd-flow grid w/ staggered reveal 100ms (A8, C5/G10)
8. `AreasBand.tsx` — slim directory band (A20 note: full treatment goes to LANDING, phase C)
9. `ExploreMB.tsx` — the composed floor: ContextStrip → FreshDrops → LiveShelf → category rails → Trending → Under5k → GridToday → AreasBand. Empty sections COLLAPSE (B7).

**Pages:**
- `/explore` — reads `?next=mb` canary: present → ExploreMB, absent → existing Explore (D8)
- `/explore/live`, `/explore/trending` — L2 pages (phase B2, after floor passes)
- `/explore/c/[slug]`, `/explore/areas/[slug]` — B3

**Data:** useExploreData gains `sections` passthrough (D3 done server-side in A3; client hook must return it).

**Wiring rules (locked):**
- Campus state machine B6: voeq:preferred-campus drives ContextStrip; first visit = "Set your campus" chip
- Filters persistence B5: voeq:explore-filters + URL params both; do NOT break existing testids
- Honest data B7: every count from real payload; no rating stars unless listing has real reviews; NO sold counts
- No emoji (A23); BrandLogo 94px (A24); footer stays OFF explore (SmartFooter already handles)
- prefers-reduced-motion everywhere (B2); no scrollIntoView (B3)

## ACCEPTANCE (before canary deploy)
- [ ] typecheck 0
- [ ] vitest all green (96 + fairness 28)
- [ ] rt-mb-floor.mts probe: sections render, drops real-only, crowd-flow grid order, empty-collapse, reduced-motion
- [ ] sweep @390px clean on canary route
- [ ] prod matrix 120/120 (old explore untouched)
- [ ] canary route 200 + old route 200 side by side

## HONEST GAPS LOG (live)
- (none yet)
