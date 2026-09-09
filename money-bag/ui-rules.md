# Voeq — UI Rules
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Status: AWAITING FOUNDER CONFIRMATION.*

## The one design law
**"Same vibe, unique as the landing page."** The whole product rhymes with the landing: forest `#0F2A1D` / gold-amber `#E8A33D` / cream, Fraunces display + Inter UI. Premium $100k feel. Emotional architecture over feature dashboards.

## Brand
- `<BrandLogo>` component (recolored PNG wordmark, width={94}, source 240×159) EVERYWHERE — landing nav, footer (cream on dark forest), AppShell/dashboards. NEVER a text "voeq" wordmark.
- Dark theme is DEAD (founder call). No exceptions.

## Landing rules (emotional architecture)
- Hero's job: make you FEEL something, click ONE button. Serif headline + massive whitespace + single CTA + subtle trust signals + visual anchor.
- Search bars, filters, multiple CTAs belong on Explore or below the fold — NOT in the hero.
- Reference class: travel/wellness/SaaS pages that sell feelings (calm, aspiration, trust), not features.
- Landing CTAs + category chips are real crawlable `<a>` links (SEO fix d14abc9) — keep them that way; search form keeps router.push.
- content-visibility:auto + contain-intrinsic-size on 6 below-fold sections (perf) — preserve.

## Explore rules (locked design v4.1 — do not redesign without founder sign-off)
- Topbar: BrandLogo(94) left + free full-width search. NO university dropdown up top.
- University field lives in the Filters sheet (first field). Price = manual ₦ Min/Max ONLY (sliders rejected TWICE — never reintroduce).
- NO Featured carousel, NO top TrendingRail, NO Campus Pulse.
- Empty state: "Your campus is waking up" + "Be the first to post…" (no "Browse other campuses").
- Card grid: 2-up mobile (166px each @390px) / 3 / 4 desktop.
- Category chips: horizontally scrollable with mask-fade (by design; matrix has a scrollable-rail exemption).
- Grid CSS trap: mobile blocks must use `repeat(2, minmax(0,1fr))` — plain `1fr` = minmax(auto,1fr) and card min-content forces overflow.

## Shared card anatomy (C1)
- One shared ListingCard everywhere (Explore, storefront grid, rails, cross-sells). Self-links by default (`link` prop; wrappers that supply their own Link pass `link={false}` — nested `<a>` is invalid).
- StorefrontGrid hides the vendor row (`onVendor={false}`).
- ListingCard filters falsy image URLs; swipeable image track (scroll-snap + dots) for multi-image — hover-only was mobile-dead.
- Fallback: initial + category tint when no image (never broken image).

## Storefront (S1 "Goods first" — locked)
- Identity header → listings IMMEDIATELY after. About card RETIRED (description lives in header once, `.vs-desc`).
- Statbar 3 cells: listings / rating ('—' until real) / reviews. No fabricated metrics.
- Category pills show NAMES not raw ids (client-safe map, unknown→id fallback).
- Hero Contact = single entry point (duplicate Message GONE; Follow in hero CTA row; Trust keeps quiet Like+Report).
- Slim share bar bottom (ShareButtons compact: Copy+WhatsApp). Socials as icon chips.
- Related redesigns need EXPLICIT founder sign-off each time ("leave storefront the way it is").

## Listing detail (A2 "Soft editorial" — locked)
- Eyebrow catline (CATEGORY · hairline · FEATURED) → serif title (clamp 1.35–1.75rem) → quiet vendor byline (links to storefront + verified dot) → serif price/rating → floating full-width Message CTA → storefront CTA below → About card → facts 2×2.
- Lightbox: scrollable sheet, body scroll-lock, Esc, reuses the track's w_900 URL (cache-hit; a different URL = fresh download per open).

## Footer
- ONLY on public pages (/, how-it-works, for-vendors, become-vendor, terms, privacy, about, contact, faq, help) via SmartFooter allowlist. NEVER on dashboards, onboarding, explore, admin, messages, auth.

## Responsive + a11y
- 390px is the design floor (David's phone). Global 16px input floor <820px. Inputs blur on submit (keypad closes).
- Buttons/pills ≥40px touch targets. Tables get overflowX or stack to cards <768px.
- Icons: lucide-react only; verify names exist in the .d.ts before use.
- Stars (reviews): 34px outlined Star icons, amber fill on hover/select, live "n / 5" label.
- Honest data everywhere: trend % shows "—" until real data exists. No fabricated analytics, ever.

## Process hooks
- Every new UI component → `/imprint` captures the pattern to ui-registry.md.
- Design iteration: static mock in Temp/ first → founder picks (v1→v4.1 style) → explicit GO → implement.
- Visual proof: real screenshot or DOM probe output — never "should look fine".
