# MONEY BAG — VISUAL INTEGRITY AUDIT (2026-09-11)
*Founder verdict: "this was not what was showed to me in mock data." Audit only — zero fixes applied.*
*Method: mock CSS extracted from money-bag/mocks/*.html vs live measurements of voeq.ng?next=mb at 390px AND 1280px (Playwright geometry probe, Temp/_geo2.mts + _mb-geo-audit.mts).*

## THE ROOT CAUSE (one sentence)
The mocks carry a **760px breakpoint** that turns every 2-column mobile layout into a 4-column desktop layout with scroll-rails; the build has **almost no desktop breakpoint at all** (mb-explore.css's only layout media query is the 820px nav) — so every grid froze at its mobile shape and stretched to fill 1200px.

## PAGE-BY-PAGE: MOCK CONTRACT vs BUILT REALITY

### 1. Explore floor (/explore?next=mb)
| Element | Mock (explore-v1.html) | Built (measured) | Verdict |
|---|---|---|---|
| Main grid | 2-col ≤760 · **4-col ≥760**, gap 13→16 | **2-col at ALL widths** — card 177px@390 / **578px@1280** | ❌ cards 2.2× too big on desktop |
| Card image | **square** 1:1.02 | **4:3 landscape** (1.33) | ❌ |
| Trending / Under₦5k rails | horizontal **scroll track**, cards `flex 0 0 44%` mobile / `calc((100%-48px)/4.15)` desktop, scroll-snap | **2-col grid, overflowX: visible** — no scroll, giant cards | ❌ wrong pattern |
| Fresh drops | bigcard 82% mobile / **2.16-up desktop**, aspect 4:4.5 | 84% at ALL widths, aspect 4:3 | ⚠️ no desktop state, wrong aspect |
| Live shelf | stage-card aspect 16:10 → **16:8.4 desktop** | 16:9 single column, no desktop state | ⚠️ |
| Section order | Fresh · Live · Food · Fashion · Trending · Under₦5k · Grid | Fresh · Live · Trending · Under₦5k · Grid (category sections absent) | ⚠️ trimmed |

### 2. Landing (/?next=mb)
| Element | Mock (home-v7) | Built | Verdict |
|---|---|---|---|
| Grid | 2-col → **4-col ≥760** | 2-col, card **578px** @1280 | ❌ |
| Hero | **2-col split** ≥760 (text 1.02fr + collage 1fr) | stacked; polaroid **561px wide** @1280 (mock collage ≈ 280px) | ❌ |
| Vendor spotlight | stage 4:3.8 mobile → **16:7.4 desktop** | 4:4.4 portrait, **1392px tall** @1280 | ❌ |
| ExploreDoor | multi-col ≥760 | `1fr` always — 1122px single column | ❌ |

### 3. Live page (/explore/live?next=mb)
| Element | Mock (live-page) | Built | Verdict |
|---|---|---|---|
| Pick | stacked mobile → **1.15fr/1fr side-by-side ≥760, min-height 340** | `1fr` always — full-width stacked on desktop | ❌ |
| Cross-sell rail | gcard 46% → **4.15-up scroll** | 2-col grid | ❌ |
| Category grid | 6-col desktop | 2-col | ❌ |

### 4. Trending page (/explore/trending?next=mb)
| Element | Mock (trending-page) | Built | Verdict |
|---|---|---|---|
| Hero stage | hs-card 42% mobile → **3-up desktop**, aspect 3:3.6 | 1/1 square thumbs in rows | ❌ |
| Rank rows | tcard **112px/150px** thumb + content | `44px 76px 1fr` — close but thumb 76 vs 150 desktop | ⚠️ |

### 5. Listing detail (/listing/[id])
| Element | Mock (listing-v1) | Built | Verdict |
|---|---|---|---|
| Layout | 1-col mobile → **1.35fr/1fr two-col ≥760** | `1fr 1fr` at ALL widths; globals.css:174 forces `1fr !important` **≤768** | ✅ actually matches (A2 shipped this) |
| More-from rail | 4.15-up scroll | 2-col grid | ❌ |

### 6. Storefront
| Element | Mock (storefront-v1) | Built | Verdict |
|---|---|---|---|
| Listings grid | 2 → 3 → 4 col | `.vs-grid` 2→3→4 (globals.css:5722) | ✅ matches |
| Banner | 16:5.2 | BrandBanner | ✅ |

## WHAT PASSED (for honesty)
Colors/fonts/tokens, card DNA (LIVE/NEW tags, ▹1/N counter, serif price), storefront grid, listing 2-col desktop, nav variant B, honesty rules, section ORDER on explore (minus the two category sections).

## WHY THE GATES MISSED IT
Every probe asserted BEHAVIOR (tag exists, counter syncs, no overflow). None asserted GEOMETRY (card width, column count, aspect ratio at 390/760/1280). G5 checked overflow, not mock-match. A structurally wrong page passed 100% green.

## FIX PLAN (awaiting founder GO — nothing started)
1. **Port the mock CSS verbatim** into mb-explore.css (one stylesheet, mock numbers as source of truth): `.mb-grid` 2→4 @760, `.mb-rail` scroll track 44%→4.15-up, square card image 1:1.02, fresh-drops 82%→2.16-up, spotlight 16:7.4 desktop, hero split ≥760, door multi-col, live pick 1.15fr/1fr, category grid 6-col.
2. **Restore the two category sections** (Food & Drinks / Fashion rails) on the floor — mock had them.
3. **NEW GATE — geometry contract**: probe asserts card width ±5% and column count at 390/760/1280 against the mock table above; screenshot diff (mock vs build) at both widths attached to the PR for founder eyes BEFORE any deploy.
4. Re-run full battery + canary re-render; founder walks again; only then cut-over talk.
