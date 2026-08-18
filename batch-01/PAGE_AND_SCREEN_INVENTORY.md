# PAGE_AND_SCREEN_INVENTORY.md — Voeq (as-built recovery, Batch 2)

> Every meaningful page/route/screen/modal/drawer discovered in the existing app,
> reconstructed from `apps/web/src/app/**` route tree + Batch 1 evidence. Each screen
> follows the required structure. Investigation-only. No secrets.

---

## SCREEN INVENTORIES

### Screen: Landing / Home
- **Route:** `/` (root, static) and `(main)/home`.
- **Purpose:** Marketing entry + shopper feed.
- **Accessible by:** Public (home); `(main)/home` requires auth (buyer).
- **Entry:** root, nav. **Exit:** signin, signup, browse, become-vendor.
- **Displays:** hero, CTAs, campus-aware content.
- **Actions:** navigate to auth/browse/become-vendor.
- **Responsive:** desktop hero; mobile single-column.

### Screen: Sign In
- **Route:** `(auth)/signin`.
- **Purpose:** Authenticate existing user.
- **Accessible by:** Anonymous (redirects away if already authed — UNKNOWN exact behavior).
- **Actions:** email/password login; Google login (intent=buyer); magic-link; forgot
  password; link to signup.
- **Results:** session cookie → role-based redirect.
- **Loading/Error:** inline errors (InvalidCredentials, rate-limit).
- **Responsive:** `px-6 md:px-8`.

### Screen: Sign Up
- **Route:** `(auth)/signup`.
- **Purpose:** Create buyer account (email+OTP).
- **Actions:** submit email/password/name → OTP sent.
- **Exit:** → verify-otp.

### Screen: Verify OTP
- **Route:** `(auth)/verify-otp`.
- **Purpose:** Confirm email via OTP.
- **Actions:** enter OTP + pendingToken → verified → onboarding.
- **Failure:** 401 InvalidOrExpiredToken.

### Screen: Forgot / Reset Password
- **Routes:** `(auth)/forgot-password`, `(auth)/reset-password`.
- **Purpose:** Recover account. **Reset** has OTP-style inputs (`h-14 w-12`, touch-sized).

### Screen: Auth Callback (Google)
- **Routes:** `(auth)/auth-callback`, `/api/auth/google/callback` (web sets cookie,
  redirects to `dest`).
- **Purpose:** Complete OAuth handoff.

### Screen: Agreement Modal
- **Location:** Overlay in `(main)/layout.tsx`.
- **Purpose:** Force TOS consent post-auth.
- **Accessible by:** Any authenticated user lacking `agreementAcceptedAt`.
- **State:** Gate-blocking (layout shows loading until resolved).

### Screen: Campus Select Modal
- **Location:** Overlay in `(main)/layout.tsx`.
- **Purpose:** Pick default campus.
- **State:** Gate-blocking for users lacking `defaultCampusId` (except vendor-in-onboarding).

### Screen: Shopper Onboarding
- **Route:** `(main)/shopper/onboarding`.
- **Purpose:** Capture feed preferences (step 3).

### Screen: Shopper Dashboard
- **Route:** `(main)/shopper/dashboard`.
- **Purpose:** Shopper home.
- **Displays:** saved/following/TrendingMiniCard row, recently-viewed + my-reviews 2-col,
  MessagesPreview card, Sell CTA.
- **Actions:** navigate to browse/wishlist/following/messages/reviews; follow/save.
- **Responsive:** `lg:grid-cols-2` collapses; bottom nav `AppBottomNav` on mobile.

### Screen: Vendor Onboarding (steps 1–4)
- **Routes:** `vendor/onboarding`, `vendor/onboarding/step-1..4`.
- **Purpose:** Wizard to live storefront.
- **State:** `VendorChrome` hides nav during onboarding. Live-preview aside hidden <lg.

### Screen: Vendor Dashboard
- **Route:** `vendor/dashboard`.
- **Displays:** status strip (live/pending + verified badge + trust score + open-now +
  NotificationBell), trend sparkline card (recharts, 7/30-day), per-listing table, reviews
  panel, listings management, contextual CTAs.
- **Actions:** view analytics, respond to reviews, manage listings, edit profile.
- **Responsive:** two-column grids collapse at `lg`; mobile uses `VendorChrome`
  hamburger (stacked drawer).

### Screen: Vendor Listings
- **Routes:** `vendor/listings`, `vendor/listings/new`, `vendor/listings/[id]/edit`.
- **Purpose:** CRUD listings (photos via upload).
- **Responsive:** forms single-column on mobile.

### Screen: Vendor Profile / Settings
- **Routes:** `vendor/profile`, `vendor/settings`.
- **Purpose:** Edit business info, hours, socials, account.

### Screen: Browse
- **Route:** `(main)/browse` (+ `BrowseClient.tsx`).
- **Displays:** search, category pills (horizontal scroll), sort (6), active-filter chips,
  price/rating/verified filter controls, listing grid.
- **Actions:** filter/sort/search → URL param → `GET /api/listings`.
- **Empty:** empty state when no results. **Responsive:** pills `overflow-x-auto`.

### Screen: Search
- **Route:** `(main)/search`.
- **Displays:** listing + vendor results.

### Screen: Listing Detail
- **Route:** `(main)/l/[slug]`.
- **Displays:** gallery, price, description, vendor block; engagement (WhatsApp, save,
  message, share, follow vendor, write review).
- **Responsive:** `md:grid-cols-2` gallery+info.

### Screen: Vendor Profile (public)
- **Route:** `(main)/v/[slug]`.
- **Displays:** save/follow/message/WhatsApp/share, reviews (+respond/comment/like),
  report/dispute, open-now, trust badge.

### Screen: Wishlist
- **Route:** `(main)/wishlist`. Saved listings/vendors.

### Screen: Following
- **Route:** `(main)/following`. Vendors the shopper follows.

### Screen: Messages (list)
- **Route:** `(main)/messages`. Conversation list (`GET /api/conversations`).

### Screen: Message Thread
- **Route:** `(main)/messages/[id]`.
- **Displays:** message history (`h-[calc(100vh-4rem)]`), input row.
- **Actions:** send (REST + socket.io realtime), mark read.
- **Responsive:** full-width; `max-w-[75%]` bubbles.

### Screen: Profile
- **Route:** `(main)/profile`. Own profile edit.

### Screen: Settings
- **Route:** `(main)/settings`. Preferences, security (sign out/logout-all).

### Screen: Select Campus
- **Route:** `(main)/select-campus`. Campus selection (also modal-gated in layout).

### Screen: Become Vendor
- **Route:** `(main)/become-vendor`. Entry to vendor conversion.

### Screen: Public / Legal
- **Routes:** `(public-group)/` about, careers, cookies, privacy, terms,
  vendor-agreement, for-vendors, media, press. Informational.

### Screen: Events / Housing / Waybill (STUBS)
- **Routes:** `(main)/events`, `(main)/housing`, `(main)/waybill`.
- **Purpose (intended):** future features.
- **State:** render "coming soon". No backend.

### Screen: Admin Console (14 areas)
- **Routes:** `admin` (index/stats), `admin/analytics`, `admin/audit`, `admin/categories`,
  `admin/emails`, `admin/institutions`, `admin/listings`, `admin/press`, `admin/reports`,
  `admin/reviews`, `admin/settings`, `admin/users`, `admin/vendors`, `admin/impersonate`,
  `admin/export`, `admin/featured`, `admin/system`.
- **Accessible by:** admin/super_admin (web `requireSuperUserAdmin`). moderator excluded.
- **Displays:** per-area tables/forms; `AdminPage` shell (ThreadSeam, cream/forest,
  AdminTable, badges). Mobile: `AdminMobileNav` bottom tab.
- **Actions:** moderate/verify/feature/ban/users/export/impersonate per `PERMISSIONS`.

### Screen: Notification Bell (component)
- **Location:** header (shopper sidebar, vendor chrome, admin).
- **Actions:** open notifications, mark read.

### Screen: Bottom Navigations (mobile)
- **Shopper:** `AppBottomNav` (4 primaries + Alerts + More), `md:hidden`.
- **Admin:** `AdminMobileNav` (6-col grid), `md:hidden`.
- **Vendor:** `VendorChrome` hamburger → stacked in-flow drawer (NOT bottom tab).

### Screen: Error / Not-found
- **Routes:** `/_not-found` (185 B, shared). Auth/API errors surface as inline messages or
  redirects (`/signin?error=oauth`).

---

## INTERACTIVE ELEMENTS OF NOTE
- **ListingCard:** links to `/l/[slug]`; has save button.
- **FollowButton** (vendorId), **ListingSaveButton**, **MessageButton**, **ShareButton**,
  **WhatsAppButton**: engagement on detail pages.
- **VendorTrendCard:** recharts sparkline, 7/30-day toggle.
- **PerListingTable:** sortable (views, WhatsApp clicks, CTR).
- **ReviewsPanel:** respond/see-all.
- **Filter `details` (browse):** price/rating/verified controls.
- **AgreementModal / CampusSelectModal:** gate-blocking overlays.
- **Hamburger (VendorChrome):** mobile nav toggle.

---

## NAVIGATION MAP

```text
/ (landing)
│
├── /signin ─────────────┐ (email, magic-link, Google intent=buyer)
│     └─→ role redirect  │
├── /signup ─→ /verify-otp ─┐
│                         │
├── /become-vendor ──────┤ (Google intent=vendor)
│                         │
└── (main)/home ◄────────┘  (buyer, post-auth)
      │
      ├── AgreementModal (gate) ──┐
      ├── CampusSelectModal (gate)├─ blocks until resolved
      └── /shopper/onboarding ────┘ (if feedPrefsSetAt unset)
              │
              ▼
      /shopper/dashboard
      ├── /browse ─→ /l/[slug] ─→ /v/[slug]
      ├── /search
      ├── /wishlist
      ├── /following
      ├── /messages ─→ /messages/[id]
      ├── /profile
      └── /settings

Google (vendor intent) ─→ /vendor/onboarding/step-1
      │  (VendorChrome hides nav during onboarding)
      ▼
/vendor/dashboard
      ├── /vendor/listings ─→ /vendor/listings/new  /vendor/listings/[id]/edit
      ├── /vendor/profile
      ├── /vendor/settings
      └── /vendor/analytics (via dashboard)

Google (admin/super_admin) ─→ /admin (requireSuperUserAdmin)
      ├── /admin/stats, /admin/analytics, /admin/audit
      ├── /admin/users, /admin/vendors, /admin/listings, /admin/reviews, /admin/reports
      ├── /admin/categories, /admin/institutions, /admin/campuses
      ├── /admin/featured, /admin/press, /admin/emails
      ├── /admin/settings, /admin/system, /admin/features, /admin/impersonate, /admin/export

Public/legal: /about /careers /cookies /privacy /terms /vendor-agreement /for-vendors /media /press
Stubs: /events /housing /waybill  ("coming soon")

Mobile nav:
  Shopper  → AppBottomNav (bottom tab)
  Admin    → AdminMobileNav (bottom tab)
  Vendor   → VendorChrome hamburger (stacked drawer, NOT bottom tab)
```

---

## CROSS-DOCUMENT CONSISTENCY (vs Batch 1)

| Item | Batch 1 | Batch 2 | Verdict |
|---|---|---|---|
| moderator role | UNKNOWN (enum only) | Backend-enforced via `PERMISSIONS`+`STAFF_ROLES`; web-invisible | **CONFLICT resolved** — moderator is real on API, missing on web (documented discrepancy) |
| super_admin→/admin | inferred | confirmed in `auth.ts` + `auth-redirect.ts` | Consistent |
| Vendor mobile nav | "stacked hamburger" | confirmed `VendorChrome` in-flow drawer, not overlay | Consistent |
| Listing detail engagement | "zero UI" (stale) | full UI present | Consistent with code; prior claim stale |
| 14 admin areas | listed | all mapped to screens | Consistent |
| Events/Housing/Waybill | stubs | "coming soon" only, no flow | Consistent |
| recharts on vendor dashboard | noted | confirmed (vendor/dashboard 259 kB First Load) | Consistent |

### Contradictions / uncertainties (documented, not hidden)
- **CONFLICT — moderator backend vs web.** API grants + accepts moderator; web has no
  moderator UI and `requireSuperUserAdmin` excludes it from `/admin`. (See Role doc.)
- **UNKNOWN — account deletion UI.** Schema has `User.deletedAt` but no self-serve delete
  flow confirmed this pass.
- **UNKNOWN — moderator/admin/super_admin creation.** No invite/self-serve path found;
  assumed DB/seed.
- **UNKNOWN — cron scheduler.** `syncAllVendorBadges` exists; trigger mechanism not in repo.
- **INFERRED — suspended/banned non-staff blocking.** Only admin middleware checks
  `UserStatus`; normal app impact UNKNOWN.
- **INFERRED — Turnstile/PostHog/Sentry UI touchpoints** present via env; not fully traced.
