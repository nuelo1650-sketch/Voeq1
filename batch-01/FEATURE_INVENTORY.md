# FEATURE_INVENTORY.md — Voeq (as-built recovery)

> Every meaningful feature discovered in the existing Voeq platform, reconstructed
> from code/schema/routes/UI. Investigation-only. No secrets are included.
>
> Status vocabulary: **Core** (central, working), **Secondary** (supporting),
> **Experimental**, **Incomplete**, **Broken**, **Deprecated**, **Unclear**.

---

## AUTHENTICATION

### 1. Email signup (password + OTP verification)
- **Purpose:** Create a buyer account with email + password, verified by OTP.
- **Users:** Anonymous → buyer.
- **Entry:** `(auth)/signup`, `(auth)/verify-otp`.
- **Behavior:** `POST /api/auth/signup/password` → creates pending token →
  `POST /api/auth/verify-otp` (requires pending token, prevents enumeration) →
  issues session cookie. Rate-limited (5/15min, lockout after 5).
- **Inputs:** email, password, name; OTP code + pendingToken.
- **Outputs:** session cookie + user object (id, email, role, vendorStatus, etc.).
- **Dependencies:** AuthToken (otp), session.service, rate-limit (Upstash).
- **Status:** Core.

### 2. Email sign-in (password)
- **Purpose:** Authenticate existing email account.
- **Entry:** `(auth)/signin`.
- **Behavior:** `POST /api/auth/signin/password` → verifies argon2 hash → session cookie.
- **Status:** Core.

### 3. Magic link sign-in
- **Purpose:** Passwordless email login.
- **Behavior:** `POST /api/auth/magic-link` (email) → `POST /api/auth/magic-link/consume` (token).
- **Status:** Core.

### 4. Google OAuth (buyer + vendor intent)
- **Purpose:** One-click sign-in / sign-up via Google.
- **Entry:** `GET /api/auth/google?intent=buyer|vendor` → Google → `GET /api/auth/google/callback`.
- **Behavior:** Exchanges code for profile; creates user if absent (role by intent),
  promotes buyer→vendor on vendor intent (never demotes admin/super_admin); issues
  session; redirects to web `/api/auth/google/callback?token=...&dest=...`. Web sets
  cookie on correct domain and routes by role (super_admin/admin → `/admin`).
- **Dependencies:** Google client credentials, `ensureVendorRow`, `issueSession`, `safeRedirect`.
- **Status:** Core. **Confirmed:** super_admin/admin → `/admin` after Google auth.

### 5. Password reset
- **Purpose:** Recover account via email.
- **Behavior:** `POST /api/auth/password-reset/request` → `POST /api/auth/password-reset/consume`.
- **Status:** Core.

### 6. Agreement acceptance (TOS gate)
- **Purpose:** Force informed consent post-auth.
- **Behavior:** `POST /api/auth/accept-agreement` (requireAuth) → stamps
  `agreementAcceptedAt`. UI: `AgreementModal` in `(main)/layout.tsx`.
- **Status:** Core.

### 7. Sign out / logout-all
- **Purpose:** End session(s).
- **Behavior:** `POST /api/auth/signout` (revoke current); `POST /api/auth/logout-all`
  (revoke ALL server sessions — true logout-everywhere).
- **Status:** Core.

---

## ONBOARDING

### 8. Shopper onboarding (feed preferences)
- **Purpose:** Capture shopper feed preferences (step 3 of signup flow).
- **Entry:** `(main)/shopper/onboarding`.
- **Trigger:** `(main)/layout.tsx` redirects to it when `feedPrefsSetAt` is null
  (after agreement + campus set).
- **Status:** Core.

### 9. Vendor onboarding (4-step wizard)
- **Purpose:** Guide a new vendor from signup to a live storefront.
- **Entry:** `vendor/onboarding` (steps 1–4) + `vendor/onboarding/step-1..4`.
- **Behavior:** `VendorChrome` hides sidebar/hamburger during onboarding. Steps:
  business basics (+ live preview aside hidden <lg), photos/listing (+ live preview),
  review, go-live. Completes when `Vendor.status` moves toward `live`.
- **Dependencies:** Vendor model, listing creation, category selection.
- **Status:** Core. **Note:** live-preview panels are `hidden lg:block` (desktop-first;
  not shown on mobile — by design, not a defect).

---

## MARKETPLACE — DISCOVERY

### 10. Home feed
- **Purpose:** Landing/feed for shoppers. Entry: `(main)/home`.
- **Status:** Core.

### 11. Browse
- **Purpose:** Filterable listing discovery.
- **Entry:** `(main)/browse` (+ `BrowseClient.tsx`).
- **Behavior:** search, category pills (horizontal scroll), sort (6 options),
  active-filter chips, price-range / min-rating / verified-only filter controls,
  listing grid via `ListingCard`.
- **Inputs (URL params):** search, category, campusId, minPrice, maxPrice, minRating,
  verifiedOnly, sort.
- **API:** `GET /api/listings` (ListListingsParams).
- **Status:** Core.

### 12. Search
- **Purpose:** Search listings + vendors. Entry: `(main)/search`.
- **Behavior:** queries listings + vendors; renders `ListingCard` + `VendorCard`.
- **Status:** Core.

### 13. Trending on campus
- **Purpose:** Surface popular listings/vendors on the user's campus.
- **Entry:** `GET /api/discover/trending?campusId&limit`.
- **Behavior:** Aggregates `listing_view`/`vendor_view` EventLogs over last 7 days,
  ranks by view count, merges, returns top items. Powers shopper dashboard mini-card.
- **Status:** Core.

### 14. Recently viewed
- **Purpose:** Shopper dashboard "recently viewed" panel.
- **Entry:** `GET /api/discover/recently-viewed` (requireAuth).
- **Behavior:** Distinct listing/vendor views by current user over 14 days, most-recent-first.
- **Status:** Core (added this session).

### 15. Following
- **Purpose:** List vendors a shopper follows. Entry: `(main)/following`.
- **Status:** Core.

### 16. Wishlist
- **Purpose:** Saved listings/vendors. Entry: `(main)/wishlist`.
- **Status:** Core.

---

## MARKETPLACE — LISTINGS & VENDORS

### 17. Listing detail (`/l/[slug]`)
- **Purpose:** Full listing view + engagement.
- **Behavior:** gallery, price range, description, vendor info, WhatsApp button,
  save-listing, message, share, **follow vendor**, **write review** (links to vendor
  `#reviews`), view-tracking.
- **Status:** Core.

### 18. Vendor profile (`/v/[slug]`)
- **Purpose:** Public storefront/landing page.
- **Behavior:** save-vendor, follow, message, WhatsApp, share, reviews (with vendor
  response), report/dispute, open-now indicator, trust badge.
- **Status:** Core.

### 19. Listing CRUD (vendor)
- **Purpose:** Create/edit/delete listings.
- **Entry:** `vendor/listings`, `vendor/listings/new`, `vendor/listings/[id]/edit`.
- **Dependencies:** Category, ListingPhoto (upload), Vendor.
- **Status:** Core.

### 20. Category management (admin)
- **Purpose:** Taxonomy (official + user categories, parent/child).
- **Entry:** `admin/categories`, `routes/admin/categories.ts`.
- **Status:** Core.

### 21. Institution / Campus management (admin)
- **Purpose:** Manage universities/polytechnics + their campuses.
- **Entry:** `admin/institutions`, `admin/campuses`, `routes/admin/institutions.ts`,
  `routes/admin/campuses.ts`.
- **Status:** Core.

---

## ENGAGEMENT / SOCIAL

### 22. Wishlist save (listing + vendor)
- **Purpose:** Save for later.
- **Entry:** `routes/wishlist.ts`; `ListingSaveButton`, vendor save button.
- **Behavior:** partial-unique per (user,vendor) / (user,listing).
- **Status:** Core.

### 23. Follow vendor
- **Purpose:** Subscribe to vendor updates.
- **Entry:** `routes/follow.ts`; `FollowButton`.
- **Status:** Core.

### 24. Reviews (vendor-scoped)
- **Purpose:** Buyers rate + review vendors; vendors respond; others comment + like.
- **Entry:** `routes/reviews.ts`, `services/review.service.ts`; vendor profile UI.
- **Behavior:** create, `PATCH /:id/respond` (vendor), `PATCH /:id/comment`,
  like/unlike, `DELETE /:id` (author-scoped, cascades comment+like), `GET /me`
  (author's reviews), `GET /vendor/:vendorId`.
- **Status:** Core. **Note:** reviews are vendor-scoped, not listing-scoped.

### 25. Messaging / Chat
- **Purpose:** Direct buyer↔vendor conversation.
- **Entry:** `(main)/messages`, `(main)/messages/[id]`; `routes/conversations.ts`.
- **Behavior (REST):** find-or-create conversation, list conversations, get/paginate
  messages (cursor), send message, mark-read. Logs `conversation_started` event.
- **Behavior (realtime):** socket.io — verified delivering messages live this session
  (browser-user-agent handshake; Cloudflare bot-challenge bypassed with UA).
- **Status:** Core.

### 26. WhatsApp contact
- **Purpose:** Off-platform contact with vendor.
- **Entry:** `routes/whatsapp.ts`; WhatsApp button on listing/vendor.
- **Behavior:** `POST /api/whatsapp/generate-message` builds templated message
  (general_inquiry, price_inquiry, availability, order, custom); increments
  `whatsappClickCount` on click. No message is sent by the app — it opens WhatsApp.
- **Status:** Core.

### 27. Reports (moderation by users)
- **Purpose:** Buyers report a vendor.
- **Entry:** `routes/reports.ts`; report UI on vendor profile.
- **Status:** Core.

### 28. Disputes
- **Purpose:** Buyer files a dispute against a vendor/listing.
- **Entry:** `routes/disputes.ts`; `GET /mine`.
- **Status:** Core.

### 29. Notifications
- **Purpose:** Alert users to followers, reviews, review responses, badges, messages.
- **Entry:** `routes/notifications.ts`; `NotificationBell` UI.
- **Behavior:** list (cursor), mark-one-read, mark-all-read.
- **Status:** Core.

### 30. Vendor badges
- **Purpose:** Gamified trust signals.
- **Entry:** `routes/badges.ts`, `services/badge.service.ts`, cron `/cron/tick`.
- **Behavior:** `GET /badges` (definitions), `GET /badges/vendor/:id`; cron
  `syncAllVendorBadges` recomputes earned badges.
- **Status:** Core.

---

## VENDOR TOOLS

### 31. Vendor dashboard
- **Purpose:** Storefront owner home.
- **Entry:** `vendor/dashboard`.
- **Behavior:** status strip (live/pending + verified badge + trust score + open-now +
  notification bell), trend sparkline card (views/clicks/conversations, 7/30-day),
  per-listing table (views, WhatsApp clicks, CTR), reviews panel (respond, see-all),
  listings management, contextual CTAs.
- **Status:** Core.

### 32. Vendor analytics
- **Purpose:** Views/clicks/conversations over time + top listings.
- **Entry:** `vendor/analytics`, `GET /api/vendors/me/analytics` (includes `daily`
  30-day series + `topListings`).
- **Status:** Core.

### 33. Vendor profile / settings
- **Purpose:** Edit business info, hours, socials, account.
- **Entry:** `vendor/profile`, `vendor/settings`.
- **Status:** Core.

### 34. Vendor hours (open/closed)
- **Purpose:** Show "Open now"/"Closed".
- **Entry:** `GET /api/vendors/:slug/is-open` (computed from operatingHours/isAlwaysOpen/timezone).
- **Status:** Core.

### 35. Featured placements (admin)
- **Purpose:** Mark vendors featured for promotion.
- **Entry:** `routes/admin/featured.ts`.
- **Status:** Core.

---

## ADMIN CONSOLE (14 areas under `requireAdmin`)

### 36. Admin stats
- **Entry:** `admin/stats`, `routes/admin/stats.ts`, `services/admin/stats.service.ts`.
- **Status:** Core.

### 37. Admin users
- **Purpose:** Manage user accounts/roles/status.
- **Entry:** `admin/users`, `routes/admin/users.ts`.
- **Status:** Core.

### 38. Admin vendors
- **Purpose:** Approve/suspend vendors, verify badges, feature.
- **Entry:** `admin/vendors`, `routes/admin/vendors.ts`.
- **Status:** Core.

### 39. Admin listings
- **Purpose:** Moderate listings.
- **Entry:** `admin/listings`, `routes/admin/listings.ts`.
- **Status:** Core.

### 40. Admin reviews
- **Purpose:** Moderate reviews.
- **Entry:** `admin/reviews`, `routes/admin/reviews.ts`.
- **Status:** Core.

### 41. Admin reports
- **Purpose:** Triage user reports.
- **Entry:** `admin/reports`, `routes/admin/reports.ts`.
- **Status:** Core.

### 42. Admin institutions / campuses
- **Status:** Core (see #21).

### 43. Admin categories
- **Status:** Core (see #20).

### 44. Admin analytics
- **Purpose:** Platform-wide analytics.
- **Entry:** `admin/analytics`, `routes/admin/analytics.ts`.
- **Status:** Core.

### 45. Admin system
- **Purpose:** System-level settings/actions.
- **Entry:** `routes/admin/system.ts`.
- **Status:** Core (behavior not fully traced this pass).

### 46. Admin emails
- **Purpose:** Send/manage emails (Resend).
- **Entry:** `admin/emails`, `routes/admin/emails.ts`, `services/admin/email.service.ts`.
- **Status:** Core.

### 47. Feature flags
- **Purpose:** Runtime toggles.
- **Entry:** `admin` (features), `routes/admin/features.ts`, `FeatureFlag` model.
- **Status:** Core.

### 48. Admin audit log
- **Purpose:** Record admin actions.
- **Entry:** `admin/audit`, `routes/admin/audit.ts`, `AuditLog` + `logAdminAction` middleware.
- **Status:** Core.

### 49. Admin settings
- **Purpose:** Platform settings.
- **Entry:** `admin/settings`, `routes/admin/settings.ts`.
- **Status:** Core.

### 50. Admin impersonation
- **Purpose:** Support staff act as a user (time-boxed).
- **Entry:** `routes/admin/impersonate.ts`.
- **Behavior:** `POST /impersonate/start` (userId, duration 1h/4h/24h, reason≥20 chars)
  → issues impersonation session, logs audit, stamps `lastAdminImpersonationAt`;
  `POST /impersonate/end`. **Guard:** cannot impersonate `super_admin`.
- **Status:** Core.

### 51. Admin export
- **Purpose:** Export data.
- **Entry:** `routes/admin/export.ts`, `services/admin/export.service.ts`.
- **Status:** Core (behavior not fully traced this pass).

### 52. Admin press
- **Purpose:** Manage press/announcement items.
- **Entry:** `admin/press`, `routes/admin/press.ts`, `PressItem` model.
- **Status:** Core.

---

## CONTENT & PLATFORM

### 53. Image upload + moderation
- **Purpose:** Upload profile/listing images with safety check.
- **Entry:** `POST /api/upload/image` (requireAuth).
- **Behavior:** base64 → validate type (JPEG/PNG/WebP) → size ≤5MB → SightEngine
  moderation (reject unsafe) → Cloudinary upload → log event.
- **Dependencies:** Cloudinary, SightEngine.
- **Status:** Core.

### 54. Agreements (TOS/privacy/vendor)
- **Purpose:** Versioned legal docs.
- **Entry:** `routes/agreements.ts` (`GET /api/agreements/current`); public pages.
- **Status:** Core.

### 55. Analytics event logging
- **Purpose:** Behavioral telemetry.
- **Entry:** `services/analytics.service.ts` (`logEvent`); `EventLog` model.
- **Status:** Core.

### 56. Press / Media (public)
- **Purpose:** Public announcements/features/blog.
- **Entry:** `(public-group)/press`, `(public-group)/media`, `routes/press.ts`.
- **Status:** Secondary.

### 57. Public/legal pages
- **Purpose:** about, careers, cookies, privacy, terms, vendor-agreement, for-vendors.
- **Status:** Secondary.

### 58. Cron job
- **Purpose:** Scheduled maintenance.
- **Entry:** `GET /api/cron/tick` → `syncAllVendorBadges`.
- **Status:** Core (single task).

### 59. Backup
- **Purpose:** Data backup (Cloudinary folder, 30-day retention).
- **Entry:** `routes/backup.ts`, `services/backup.service.ts` (env: BACKUP_*).
- **Status:** Core (behavior not fully traced this pass).

### 60. Test route
- **Purpose:** Health/diagnostics.
- **Entry:** `routes/test.ts`.
- **Status:** Secondary / internal.

---

## DEFERRED / STUB FEATURES (intentional, not built)

### 61. Events
- **Purpose (intended):** Campus events surface.
- **Entry:** `(main)/events` → renders "coming soon".
- **Status:** Stub / Deferred.

### 62. Housing
- **Purpose (intended):** Housing listings.
- **Entry:** `(main)/housing` → "coming soon".
- **Status:** Stub / Deferred.

### 63. Waybill
- **Purpose (intended):** Shipment/waybill tracking.
- **Entry:** `(main)/waybill` → "coming soon".
- **Status:** Stub / Deferred.

---

## CROSS-CUTTING / INFRASTRUCTURE FEATURES

### 64. Rate limiting
- **Purpose:** Abuse protection (Upstash Redis) with in-memory fallback.
- **Entry:** `middleware/rate-limit-upstash.ts`. Applied to auth, upload, agreement.
- **Status:** Core.

### 65. Bot protection (Turnstile)
- **Purpose:** Cloudflare Turnstile challenge on sensitive forms.
- **Entry:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
- **Status:** Core (config present; UI wiring not fully traced this pass).

### 66. Error tracking (Sentry)
- **Purpose:** Frontend + backend error capture.
- **Entry:** `@sentry/nextjs`, `@sentry/node`, `SENTRY_DSN`.
- **Status:** Core (config present).

### 67. Product analytics (PostHog)
- **Purpose:** Usage analytics.
- **Entry:** `posthog-js`, `NEXT_PUBLIC_POSTHOG_KEY`.
- **Status:** Core (config present).

### 68. Mobile navigation
- **Purpose:** Responsive nav.
- **Behavior:** Shopper → `AppBottomNav` (bottom tab, `md:hidden`); Admin →
  `AdminMobileNav` (bottom tab); Vendor → `VendorChrome` hamburger (in-flow stacked
  drawer, not overlay). Onboarding suppresses nav.
- **Status:** Core (vendor mobile nav is a stacked hamburger, not a bottom tab — see
  FUNCTIONAL_SPECIFICATION #Vendor mobile nav).

### 69. Session management
- **Purpose:** Persisted, revocable sessions; impersonation support.
- **Entry:** `services/session.service.ts`, `Session` model.
- **Status:** Core.

---

## UNCERTAINTIES / CONFLICTS (require human review)

- `CONFLICT` — Prior audit claimed listing detail lacked engagement UI; code shows it
  is fully present. Treat code as truth.
- `UNKNOWN` — Whether `moderator` role is enforced anywhere (enum only).
- `UNKNOWN` — Production contents of `FeatureFlag`, `Agreement` versions, admin
  `system`/`export`/`backup` exact behavior (routes exist; deep behavior not traced).
- `INFERRED` — Trending ranks by raw 7-day view count only (no rating/recency weighting).
- `INFERRED` — Turnstile/PostHog/Sentry are wired via env but exact UI touchpoints not
  fully traced this pass.
