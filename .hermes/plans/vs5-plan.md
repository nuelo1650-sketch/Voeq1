# VS5 — Vendor Builder (Plan, approved-brief + disk reconciliation)

PROCESS: read docs (01,02,03,04,05,06,07,08,09,13) + audit disk. Output plan. STOP for Go.

## GROUND-TRUTH CORRECTIONS (brief vs actual disk — these change the plan)
1. **Photo routes are NOT duplicates.** `app/api/vendor/photo/route.ts` = DELETE (clear +
   enforceVisibilityAfterMutation). `app/api/vendor/upload-photo/route.ts` = POST (upload + moderate).
   They are complementary. Brief's VS5.5 "delete upload-photo as dead duplicate" is WRONG — deleting it
   breaks upload. Plan: consolidate POST+DELETE into ONE `photo/route.ts`, then delete `upload-photo/`.
   (Must move the POST body in, not just delete.)
2. **Listing visibility = `isPublished` + `Vendor.status==='live'`, not listing `status`.** `Listing.status`
   is `'active'|'removed'`; `isPublished:boolean` is the real driver. `enforceVisibilityAfterMutation`
   already reverts vendor→`pending_listings` when `canGoLive(vendor).ok` is false (no listings OR no
   photo). So VS5.8 "delete last listing → revert" already works. No new revert logic needed.
3. **Live preview must build `VendorStorefrontView`** (extends Vendor + listings/rating/reviews), NOT a raw
   `Vendor`. `StorefrontHero` consumes `VendorStorefrontView`. VS5.4 preview = assemble a draft
   `VendorStorefrontView` from the vendor record + form draft + existing listings.
4. **`FollowRepo.listByVendor` missing** — add to interface + mock (currently only `toggle`+`list(followerId)`).
5. **`ListingsRepo.update` missing from interface** — mock has `patch` (line 165) but interface only declares
   `list/getById/create/remove`. Add `update(id, patch)` to interface.
6. **`Review.response` missing** — add `response?: { body; createdAt; editedAt: string|null }` to `Review`.
7. **Suspended**: `Vendor.status` currently `'pending_listings'|'live'`. Add `'suspended'` (per brief).
   Note `Identity.accountStatus` ALSO has `'suspended'` (auth-level, §9.5). For dashboard gating we use
   `Vendor.status==='suspended'` (per brief) and flag the overlap.
8. **`VendorStorefrontView` already carries `ratingAvg/ratingCount/reviews/listingCount`** — analytics counts
   (VS5.11) can reuse this; no separate heavy query needed for counts.

## DATA CONTRACT EXTENSIONS (extend-only, LOCKED files)
- `interfaces.ts`:
  - `Vendor.status`: `'pending_listings' | 'live' | 'suspended'`
  - `Vendor.socials?`: `{ phone?; instagram?; twitter?; tiktok? }`
  - `Vendor.hours?`: `{ open: string; close: string; days: Day[] }`
  - `Review`: `+ response?: { body: string; createdAt: string; editedAt: string | null }`
  - `ListingsRepo`: `+ update(id, patch): Promise<Listing|null>`
  - `FollowRepo`: `+ listByVendor(vendorId): Promise<Follow[]>`
  - `ReviewRepo`: `+ respond(reviewId, vendorId, body): Promise<Review|null>`
- NEW type: `VendorAnalytics { vendorId; listingCount; reviewCount; followerCount; saveCount; openNow: boolean|null }`
- `vendor.ts` or `shopper.ts`: impls for `mockListingsRepo.update`, `mockFollowRepo.listByVendor`,
  `mockReviewRepo.respond` (24h window: later of review.createdAt OR response.createdAt + 24h; one response).
- NEW `analytics.ts`: `computeVendorAnalytics(vendorId)` — derives from listings/reviews/follows/saves repos.
  openNow derived from `Vendor.hours` + current time (null if hours unset). NO impression log.
- `index.ts`: export new pieces. `resetVendorState()` dev helper.

## CHUNK PLAN (15 chunks, in order, verify after each)
VS5.1 Data contracts (interfaces+repos+analytics helper). tsc both pkgs; 24h window unit-check.
VS5.2 Storefront identity edit — `api/vendor/identity` PATCH + `StorefrontIdentityForm` (name/desc/category/subArea).
VS5.3 Hours + socials — `api/vendor/hours`, `api/vendor/socials` PATCH + `StorefrontHoursForm`,
       `StorefrontSocialsForm`, `OpenNowBadge`. StorefrontHero renders hours badge + socials.
VS5.4 Live preview — `StorefrontPreview` (renders Hero/Grid/Trust with draft `VendorStorefrontView`).
VS5.5 Photo reconcile — consolidate POST+DELETE into `photo/route.ts`; delete `upload-photo/`; `PhotoUploadSection`.
VS5.6 Create listing — `api/listings` POST (exists) extend; `CreateListingForm` (multi-photo via photo pipeline).
VS5.7 Edit listing — `api/listings/[id]` ADD PATCH (ownership check); `EditListingForm` inline.
VS5.8 Delete listing — `api/listings/[id]` DELETE (exists) verify + ownership; `DeleteListingButton` confirm.
VS5.9 View own reviews — `ReviewsManagementList` (reuses `api/reviews/[vendorId]`).
VS5.10 Respond to reviews — `api/reviews/[id]/respond` POST+PATCH (24h window server-side); `ReviewResponseForm`.
VS5.11 Analytics — `api/vendor/analytics` GET (computeVendorAnalytics); `AnalyticsCards` (counts only).
VS5.12 See followers — `api/follow/[vendorId]` GET (listByVendor + names); `FollowersList`.
VS5.13 Agreement re-consent — `api/vendor/agreement` PATCH; `AgreementReconsentGate` (hard gate on dashboard).
VS5.14 Suspended — `SuspendedBanner` (status==='suspended' → banner + disable edit forms).
VS5.15 Cleanup + E2E walk-through — kill `upload-photo`, grep guards, full E2E per brief step 3.

## SECURITY (§9.7/§9.10) — applied every chunk
- Every vendor mutation: auth + ownership (`vendor.id === identity.vendorId`).
- Review respond: vendor owns review's vendorId; 24h window enforced server-side (not just UI).
- One response per review (respond returns 403 on existing response).
- PII-free logs (identityId refs only). No client-supplied createdAt trusted.
- Shipper caps preserved: dashboard shows shopper sections (saved/following) above vendor sections.

## ANTI-PATTERN ENFORCEMENT (per brief)
No fake views/impressions (counts only, real repos). No fake "always open" (badge only if hours set).
No WhatsApp (phone/IG/Twitter/TikTok only). No stored isPublic (visibility derived). No "Coming soon".
No modal edit (inline). No tabs (single scroll). No orphan CTAs.

## GREP GUARDS (run after VS5.15)
`upload-photo`→0 (consolidated) · `setGated`→0 · `/browse`→0 · `isPublic`→0 · `unsplash`→0 ·
`onboardingInterests`→0 · `whatsapp`→0 (messaging ctx) · dead vendor routes removed.

## VERIFICATION
Per chunk: tsc both pkgs clean + affected route 200 + API curl check.
Global: full E2E walk-through (brief §VS5.15.3) + no VS2/3/4 regressions + grep guards clean.
