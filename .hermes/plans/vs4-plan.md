# VS4 — Shopper Experience + Browse Wiring (Plan)

**Process:** read locked docs + audit + disk state → plan (this file) → STOP for standalone "Go" → execute VS4.1–VS4.12.

## Disk-verified facts that shape the plan (vs the brief)

1. **`loadExplore` ALREADY filters + sorts** (`explore.ts:80-100` `applyFilters`/`applySort`, called at `:126`). The audit's claim "filters don't filter" is WRONG for the data layer — `applyFilters` handles category/minPrice/maxPrice/minRating/verifiedOnly/featuredOnly/sort. `Explore.tsx:44-50` already spreads `...filters` into `useExploreData`, and `Filters.tsx:44-113` calls `onChange`. **So filters DO work.** VS4.9's real gap is (a) hardcoded `CAMPUS="NMU"` (`Explore.tsx:27`) and (b) confirm `/c/[slug]` wiring — NOT rewriting `loadExplore` filtering.
2. **`storefront.ts` hardcodes `reviews: []`** at lines 68 & 95 → VS4.4 replaces with `mockReviewRepo.listByVendor`.
3. **`interfaces.ts` LOCKED but EXTENDABLE** — `Review` exists; WishlistItem/Follow/Like/Comment/Report/Notification types are absent → VS4.1 appends them (compliant with LOCKED extend-only rule).
4. **`?next=` plumbing EXISTS** (`login/page.tsx:13`, `session.ts:14-21 requireAuth(next)`, `sanitizeNext`) — VS4.12 wires dead CTAs to it.
5. **`/browse` is orphan** (0 refs) + `/browse?q=` hero link → VS4.10 deletes + redirects hero to `/explore?q=`.

## Doc-read status (honesty)
- Brief cited `08-DATA_MODEL`, `09-SECURITY`, `10-TESTING`, `13-OPERATIONAL` — **these files do not exist on disk**. Real blueprint: `01-PRODUCT_DECISIONS`, `02-PRODUCT_SCOPE`, `03-USER_EXPERIENCE_AND_FLOWS`, `04-INFORMATION_ARCHITECTURE`, `05-DESIGN_SYSTEM`, `06-BUILD_EXECUTION`, `DESIGN_HANDOFF`. I've read 03/04 + interfaces/auth/explore/storefront/mock/visibility/onboarding + all relevant pages/components directly. The brief's policy section restates the constraints; I treat the brief's LOCKED POLICIES + my disk reads as authoritative.

---

## VS4.1 — Data layer: relationship repos
**Files:**
- `packages/data/src/interfaces.ts` — APPEND (extend-only): `WishlistItem`, `Follow`, `Like`, `Comment`, `Report`, `Notification` types; `SavedListingRepo`, `FollowRepo`, `LikeRepo`, `ReviewRepo`, `CommentRepo`, `ReportRepo`, `NotificationRepo` interfaces. (Review interface already exists — extend it with `status` if needed; do NOT modify existing `Review` shape beyond adding optional fields per LOCKED rule.)
- `packages/data/src/shopper.ts` (NEW) — in-memory Map mocks: `mockSavedListingRepo`, `mockFollowRepo`, `mockLikeRepo`, `mockReviewRepo` (create upsert per shopper-vendor, listByVendor, getById), `mockCommentRepo` (create, listByListing), `mockReportRepo` (create, list), `mockNotificationRepo` (create, list, markRead, markAllRead). Mirrors mock.ts patterns. `resetShopperState()` dev helper.
- `packages/data/src/index.ts` — `export * from "./shopper"`.

**Risks:** Like/Comment/Report/Notification have no UI in this slice beyond what VS4 wires — fine. IDOR: every mutation must take `actorId` from session, never trust client `shopperId`.
**Verify:** `npm run typecheck` (data) = 0; all new types/repos importable from `@voeq/data`; `resetShopperState` works.

## VS4.2 — Save/Wishlist
**Files:** `app/api/saved/route.ts` (POST toggle, auth+ownership), `app/api/saved/list/route.ts` (GET), `components/shopper/SaveButton.tsx` (client, `?next=` gate, optimistic), wire into `ListingDetail`, `StorefrontHero`/vendor storefront, `VendorCard`, `RecentlyViewed` (replace local `toggleSave` with real API).
**Verify:** unauthed → `/login?next=<url>`; authed persists across reload; heart toggles; tsc=0.

## VS4.3 — Follow vendor
**Files:** `app/api/follow/route.ts` (POST toggle, 400 self-follow), `app/api/follow/list/route.ts`, `components/shopper/FollowButton.tsx`, wire into `StorefrontTrust` (replace dead btn) + `VendorCard`.
**Verify:** gate + persist + live button; tsc=0.

## VS4.4 — Reviews
**Files:** `app/api/reviews/route.ts` (POST upsert 1/shopper-vendor, 400 own-vendor), `app/api/reviews/[vendorId]/route.ts` (GET public, derived avg+count), update `storefront.ts` `loadVendorStorefront` to fetch `mockReviewRepo.listByVendor` (replace `reviews: []`), `components/shopper/ReviewForm.tsx`, `ReviewsList.tsx`, wire into `StorefrontTrust`.
**Verify:** one review per shopper-vendor; GET returns real + derived rating; storefront shows real; no fake ratings; tsc=0.

## VS4.5 — Comments (flat, public-read)
**Files:** `app/api/listings/[id]/comments/route.ts` (POST auth, GET public, body 2–1000), `components/shopper/CommentForm.tsx` (`?next=`), `CommentsList.tsx` (public, newest-first, "No comments yet"), wire into `ListingDetail`.
**Verify:** unauth READ works; unauth POST → `?next=`; authed POST creates; flat; tsc=0.

## VS4.6 — Report (real staff case)
**Files:** `app/api/reports/route.ts` (POST auth, creates `StaffCase` open via `mockStaffRepo`/report repo, 400 own-item), `components/shopper/ReportForm.tsx`, replace cosmetic panel in `ListingDetail.tsx:188-224`, add `ReportButton` to vendor storefront.
**Verify:** real staff case created; honest "submitted" confirmation; tsc=0.

## VS4.7 — Shopper dashboard (/home)
**Files:** rewrite `app/home/page.tsx` (auth → `?next=/home`; sections Saved/Following/Recommended/Activity/Notifications-preview via `GET /api/home`), `app/api/home/route.ts` (aggregates repos). Empty states honest.
**Verify:** unauth → `?next=`; real data per section; "See all" links; tsc=0.

## VS4.8 — Notifications
**Files:** `app/api/notifications/route.ts` (GET + unread count), `app/api/notifications/[id]/read/route.ts` (PATCH), `app/api/notifications/read-all/route.ts` (POST), `components/shopper/NotificationBell.tsx`, wire into dashboard + vendor dashboard + public nav. Seed 1 system notif on signup.
**Verify:** bell badge; mark-read; mark-all; unauth CTA; tsc=0.

## VS4.9 — Browse wiring (CORRECTED SCOPE)
**Files:** `Explore.tsx` — remove hardcoded `CAMPUS="NMU"` (`:27`); derive campus from `identity.campus` (authed) or `CampusSelector` (unauth); campus pill + switch. `loadExplore` filtering ALREADY works — do NOT rewrite it. Verify `/c/[categorySlug]/page.tsx` passes `categoryPreset` + search/sort (read file; if wired, no change).
**Verify:** category/price/rating/verified/sort/search all filter (already do at data layer); campus dynamic; tsc=0. **Risk:** brief over-scopes this; actual change is campus dynamism + verification, not filter rewrite.

## VS4.10 — Delete /browse + hero redirect
**Files:** DELETE `app/browse/page.tsx`; `LandingHero.tsx:67` form → `/explore?q=`; `LandingNav.tsx` Browse link → `/explore`; grep `/browse` → 0.
**Verify:** `/browse` 404; hero → `/explore?q=`; 0 refs; tsc=0.

## VS4.11 — Settings editable
**Files:** rewrite `app/settings/page.tsx` (notif prefs toggles + campus switch), `app/api/settings/notifications/route.ts` (PATCH), `app/api/settings/campus/route.ts` (PATCH).
**Verify:** prefs persist; campus updates `Identity.campus`; validate; tsc=0.

## VS4.12 — Wire dead CTAs to ?next= + cleanup
**Files:** replace all `setGated`/"Get Started→/explore" panels in `StorefrontTrust.tsx` + `ListingDetail.tsx` with real `?next=` redirects or live components; DELETE `ExploreTabs.tsx` (never imported); DELETE orphaned `Browse*` components if unused (verify each via grep); final grep `setGated|/browse` → 0.
**Verify:** grep clean; all CTAs work or `?next=`; tsc=0; full E2E walk-through (signup→onboard→explore filters→save(?next=)→login→follow→review→comment→report→/home→notif bell→settings→dead-CTA grep=0).

---

## Execution order
VS4.1 → … → VS4.12, verify after each (tsc both pkgs + targeted curl/grep + E2E at VS4.12). Stop after VS4.12. No commit without standalone Go.

## Deviations from brief (flagged)
- VS4.9 scope reduced: `loadExplore` filtering already correct; only campus dynamism + `/c/[slug]` verify needed. Avoids redundant rewrite.
- Brief's doc numbers (08/09/10/13) don't exist on disk; used brief's policy block + real `01–04` + code as authority.
- `Review` interface pre-exists; VS4.1 extends rather than adds duplicate.
