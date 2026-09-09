# Voeq — UI Pattern Registry
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Status: AWAITING FOUNDER CONFIRMATION. Maintained by /imprint after every UI component.*

## Existing patterns (verified live on prod 2026-09-08)

### Cards
- **C1 ListingCard** (`apps/web/components/explore/ListingCard.tsx`) — THE card, used by Explore, storefront grid, landing rail, cross-sells, saved. Anatomy: image (swipe track scroll-snap + dots for multi-image), title, price, vendor row (hidden on storefront via onVendor={false}), LIVE pulse pill, Top badge, verified dot. Self-links (`listing-card-link`, link prop default true). Filters falsy image URLs; fallback initial + category tint.

### Identity headers
- **S1 StorefrontHero** (`components/storefront/StorefrontHero.tsx`) — vendor name + verified dot, category pills with NAMES, full description once (.vs-desc), 3-cell statbar (listings/rating '—' until real/reviews), hero CTA row (Contact single entry + Follow), social icon chips.

### Detail pages
- **A2 Soft editorial** (`components/listing/ListingDetail.tsx`) — eyebrow catline → serif title (clamp 1.35–1.75rem) → byline (vendor name → storefront + verified dot + category) → serif price/rating/New pill/availability → full-width floating Message CTA → outlined storefront CTA → About card → facts 2×2. Lightbox: scroll sheet, body lock, Esc, track-URL reuse.

### Landing sections
- **LandingHero** — serif headline, single CTA, search → /explore, keypad blur on submit.
- **TrendingRail** — tabs (Popular/New/Top rated/Trending) feeding real /api/explore listings through the shared ListingCard.
- **CategoryGrid** — 5 crawlable category chips.
- **LandingFAQ** — restored accordion (.landing-faq scoped).
- **ForVendorsCTA** — landing.jpg visual anchor.

### Trust surfaces
- **Review stars v2** — 34px outlined Star icons, amber fill on hover/select, live "n / 5".
- **Verified pill/dot** — vendor trust marker, consistent across storefront/byline/messages.

### Empty states
- **Explore** — "Your campus is waking up" + "Be the first to post…" CTA (no cross-campus browse).
- **Verifications queue** — "queue is clear" state.

### Administrative (context only — out of scope)
- Stacked cards <768px for moderation tables; useIsMobile matchMedia hook pattern.

## Registering a new pattern
After every UI component ships: `/imprint` appends here — name, file, anatomy, testids, mobile behavior. Patterns are the vocabulary; before building anything new, check if one of these fits.
