# Voeq — Architecture
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Status: AWAITING FOUNDER CONFIRMATION.*

## System shape (verified)
Next.js App Router monorepo, pnpm:

```
voeq/
├── apps/web/                 # Next.js app (all routes, API, components)
├── packages/
│   ├── data/                 # repos, domain logic, explore-view taxonomy
│   │   └── src/index.ts      # client-safe barrel (NO db imports reachable)
│   │   └── src/server.ts     # server-only barrel (+media, images, email)
│   │   └── src/explore-view.ts # canonical category taxonomy (slug↔id↔name)
│   ├── db/                   # Drizzle schema + scripts (probes, migrations)
│   │   └── src/schema.ts     # THE schema (identities, vendors, listings,
│   │                         #   sessions, staff_cases, comments, reviews…)
│   ├── design-tokens/        # tokens.css — single source of visual truth
│   ├── ui/                   # shared UI primitives
│   └── contour/              # CampusFingerprint SVG component
└── docs/project-blueprint/   # original build spec (00-12)
```

## Data flow
Client components → Next API routes (`apps/web/app/api/**`) → `@voeq/data` repos (mock* facades that switch to real Neon repos when DATABASE_URL present) → Drizzle → Neon Postgres.

**HARD RULE (bundle fix, bdb337c)**: client components must NEVER import runtime values from `@voeq/data` root — root index statically reaches `@voeq/db` (drizzle + neon ASN.1 crypto leaked 2,242KiB of unused JS). Pure data (categories, slug maps) comes from `@voeq/data/explore-view`; client-safe helpers from `@voeq/data/client`.

**Taxonomy seam (chips)**: server-side resolver merges seed ∪ DB (DB wins name/isActive; deactivated excluded from public taxonomy; NEVER throws — falls back to seed; `@voeq/db` dynamic import). No in-process cache. Threaded via props. Static `CATEGORIES` export stays as fallback.

**Visibility**: public surfaces filter at REPO layer via `list({publicOnly})` — published+active listings owned by LIVE vendors only.

## Pages in scope — current composition (verified 2026-09-08)

### Landing `/` (apps/web/app/page.tsx)
```
<LandingNav/>
<LandingHero/>        # emotional hero, single CTA, search → /explore
<TrendingRail/>       # REAL listings via /api/explore (tabs: popular/new/top/trending)
<CategoryGrid/>       # 5 category chips → /explore?category=
<HowItWorks/>
<TrustPillars/>
<LandingFAQ/>         # restored 38884e1 (was deleted as dead code)
<ForVendorsCTA/>      # landing.jpg (monogram retired)
+ SmartFooter (allowlist: public pages only)
```
Landing components dir: 18 files (BrandLogo, CampusContext, CampusSelector, CategoryGrid, ContourSignature, ForVendorsCTA, HowItWorks, LandingCategories, LandingFAQ, LandingFooter, LandingHero, LandingHowItWorks, LandingNav, LandingProofRow, LandingSearch, TrendingRail, TrustPillars, TrustStrip).

### Explore `/explore` (locked design v4.1)
- Topbar: BrandLogo(94) LEFT + full-width search. NO university dropdown up top.
- Hero: ONE line "Find it. Chat it. Get it."
- University field lives inside Filters sheet (first field).
- Price = manual ₦ Min/Max inputs ONLY (sliders rejected twice).
- Filters sheet: University/Category/Sort/Verified + manual price.
- NO Featured carousel, NO TrendingRail at top, NO Campus Pulse.
- Empty state: "Your campus is waking up" + "Be the first to post…" CTA.
- Card grid: 2-up mobile (166px @390px) / 3 / 4 desktop.
- Category chips scrollable with mask-fade.
- Filter state persists per-tab via sessionStorage `voeq:explore-filters` (9eb5b1a).
- Testid contract (probe surface): explore, explore-back, explore-card-link, explore-contour-anchor, explore-empty(+browse/vendor), explore-error, explore-filters-close/sheet/toggle, explore-grid, …

### Related pages
- `/listing/[id]` — A2 "Soft editorial" detail (catline eyebrow → serif title → byline → price/rating → Message CTA → storefront CTA → About → facts 2×2; lightbox scroll-sheet reusing track w_900 URLs).
- `/vendor/[id]` — S1 "Goods first" storefront (identity header w/ category pills by name, 3-cell statbar, listings right after header, hero Contact single entry, slim share bar, social icon chips; staff-view bypass w/ banner for non-live).
- `/c/[slug]` — campus pages (in sitemap).
- `/saved`, `/how-it-works`, `/for-vendors`, `/become-vendor`, `/help` (FAQ fixed).

## Deployment topology (live-tested 2026-09-04)
- **Vercel serves voeq.ng AND executes /api/* DIRECTLY against Neon** (Server: Vercel, X-Vercel-Id present; no proxying). Vercel env must carry EVERY server secret.
- **Render** service `Voeq1` (voeq1.onrender.com, free, oregon, rootDir apps/web) runs the same app env-complete — redundant twin, not the traffic path.
- **DB**: Neon Postgres. Prod + test twins (`/neondb?` vs `/neondb_test?` — query-string anchored derivation from .env.local).
- Deploys: `cd /c/Users/Legacy/Documents/voeq && npx vercel deploy --prod --yes` (output unfiltered; recover URL via `npx vercel ls`). Env changes need redeploy.

## Release gates (non-negotiable)
1. `npm run typecheck` exit 0 — BEFORE any live Neon mutation.
2. `npm run test` (vitest) — 96 passed baseline.
3. Round-trip probes vs TEST DB via real API (rt-*.mts pattern in packages/db/scripts).
4. Mobile sweep @390px (apps/web/scripts/mobile-sweep.mts vs :3031 + test DB).
5. Prod matrix: `npx playwright test --config=playwright.verify.prod.config.ts` — 120/120.
6. One dev server at a time (:3031 mine, :3030 David's) — kill before verifying.
