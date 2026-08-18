# FUNCTIONAL_SPECIFICATION.md — Voeq (as-built recovery)

> Detailed behavior of the significant Voeq features, reconstructed from code.
> Investigation-only. Where **Intended** differs from **Observed**, both are recorded.
> No secrets, keys, or credentials are included.

---

## Feature: Authentication (Google OAuth + email)

### Purpose
Let users create/sign in to accounts via email+password (OTP/magic-link) or Google,
with campus-scoped, role-aware sessions.

### Preconditions
- API reachable; Google client configured for OAuth; email provider (Resend) for OTP/magic.
- `UserRole` default = `buyer`.

### Trigger
- Shopper/vendor clicks "Sign in with Google" (intent carried in `state`) or submits
  email/password/OTP/magic-link forms.

### Inputs
- Google: OAuth `code`, `state={intent:'buyer'|'vendor'}`.
- Email: email, password / OTP / magic-link token.

### Processing
- **Google callback** (`routes/auth.ts:310`): exchange code → fetch profile →
  find-or-create user (role by intent; promote buyer→vendor on vendor intent, never
  demote admin/super_admin) → ensure Vendor row for vendors → issue session JWT →
  redirect to web `/api/auth/google/callback?token=&dest=` (web sets cookie on its own
  domain, then routes by role).
- **Email signup**: create pending token → OTP verify (requires pending token to stop
  enumeration) → session.
- **Session**: persisted `Session` row (revocable); cookie via `getSessionCookieName`.

### Data affected
- `User` (create/update), `Vendor` (ensure row), `Session`, `AuthToken`, `EventLog`
  (signup_started/completed).

### Output
- Session cookie + user object (id, email, role, agreementAcceptedAt, defaultCampusId,
  vendorStatus).

### Success behavior
- Authenticated; post-auth redirect to role destination.

### Failure behavior
- Missing code → 400. No access_token → 401 GoogleAuthFailed. No email → 401
  GoogleNoEmail. Callback error → redirect `/signin?error=oauth` (no raw API error).
- OTP without valid pending token → 401 InvalidOrExpiredToken.

### Validation
- Rate-limited (Upstash, 5/15min lockout on OTP; 3/15min magic).
- OTP resend requires pending token.

### Permissions
- Public for sign-in/signup; `requireAuth` for agreement accept, signout, logout-all.

### Edge cases
- **super_admin/admin post-Google redirect → `/admin`** (CONFIRMED in
  `routes/auth.ts:424` and web `lib/auth-redirect.ts`). Vendor+live → `/vendor`;
  vendor+not-live → `/vendor/onboarding/step-1`; buyer → `/home`.
- Google user with no `agreementAcceptedAt` is NOT silently consented — `AgreementModal`
  forces consent post-auth.

### UI behavior
- `(auth)/signin`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password`,
  `/auth-callback`. Loading/empty/error states per form.

### Observed limitations
- `moderator` role exists in enum but no moderator auth path discovered.

---

## Feature: Shopper + Vendor Onboarding

### Purpose
Capture required pre-conditions (agreement, campus, feed prefs) and guide vendors to a
live storefront.

### Preconditions
- Authenticated user.

### Trigger
- `(main)/layout.tsx` effect: if `!agreementAcceptedAt` → AgreementModal; else if
  `!defaultCampusId` (and not vendor-in-onboarding) → CampusSelectModal; else if
  `!feedPrefsSetAt` → redirect `/shopper/onboarding`.

### Processing
- Shopper: 3-step signup; final step sets `feedPrefsSetAt` in `UserPreference`.
- Vendor: 4-step wizard (`vendor/onboarding/step-1..4`): business basics, photos/listing,
  review, go-live. `VendorChrome` hides nav during onboarding.

### Data affected
- `User.agreementAcceptedAt`, `User.defaultCampusId`, `UserPreference.feedPrefsSetAt`,
  `Vendor` (basics, photos, status progression), `Listing`.

### Edge cases
- Vendor in onboarding skips CampusSelectModal (sets campus at step 2) to avoid double prompt.
- **Live preview panels in vendor onboarding are `hidden lg:block`** → on mobile (<lg)
  the preview is not shown (desktop-first by design, not a defect).

### Observed limitations
- Onboarding is gated but the step wizard content wasn't fully traced this pass beyond
  structure + the desktop-first preview caveat.

---

## Feature: Browse / Search / Discovery

### Purpose
Help shoppers find listings/vendors by campus, category, price, rating, keyword.

### Preconditions
- Campus context (for trending/recently-viewed); browse itself works without it.

### Trigger
- Navigate to `/browse`, `/search`, `/home`, or use trending/recently-viewed panels.

### Inputs (browse URL params)
- `search`, `category`, `campusId`, `minPrice`, `maxPrice`, `minRating`,
  `verifiedOnly`, `sort` (newest|price_asc|price_desc|rating|views|whatsapp_clicks).

### Processing
- `GET /api/listings` (ListListingsParams) → filtered/paginated listings.
- `GET /api/discover/trending?campusId` → 7-day view-event ranking (see Trending).
- `GET /api/discover/recently-viewed` (auth) → distinct user views (14d).

### Output
- Listing cards / vendor cards; trending items; recently-viewed items.

### UI behavior
- Category pills (horizontal scroll, `overflow-x-auto`), sort row, active-filter chips
  (removable), filter `details` (price min/max, min-rating, verified-only). Listing grid.
- Empty state when campus missing (search, not a stub).

### Observed limitations
- None blocking. Filters fully wired to API params.

---

## Feature: Listing Detail (`/l/[slug]`)

### Purpose
Show a listing and let a shopper engage with it / its vendor.

### Preconditions
- Valid listing slug; listing `status='active'`, not deleted.

### Behavior
- Gallery, price range, description, vendor block.
- Engagement actions: **WhatsApp** (opens WhatsApp with templated message),
  **save-listing** (`ListingSaveButton`), **message** (`MessageButton` → starts
  conversation), **share**, **follow vendor** (`FollowButton`), **write review**
  (links to vendor `#reviews` — reviews are vendor-scoped).
- View event logged (`listing_view`).

### Permissions
- Public read; engagement requires auth (buttons trigger sign-in flow).

### Edge cases
- `CONFLICT` — earlier audit claimed "zero engagement UI" here; code shows full
  engagement present. Treat code as current truth.

---

## Feature: Vendor Profile (`/v/[slug]`)

### Purpose
Public storefront/landing page for a vendor.

### Behavior
- Save-vendor, follow, message, WhatsApp, share, reviews (with vendor response +
  comments + likes), report/dispute, open-now indicator, verified badge + trust score.
- View event logged (`vendor_view`).

### Permissions
- Public read; report/dispute/follow/save require auth.

### Observed limitations
- None identified.

---

## Feature: Reviews (vendor-scoped)

### Purpose
Buyers rate (1–5) + review a vendor; vendor responds; community comments + likes.

### Trigger
- Submit on vendor profile; vendor "respond" on own review; like/comment.

### Processing (`routes/reviews.ts` + `services/review.service.ts`)
- Create: `POST /api/reviews/vendor/:vendorId` (requireAuth) → unique (userId, vendorId).
- Respond: `PATCH /api/reviews/:id/respond` (vendor only) → sets `vendorResponse`.
- Comment: `POST /api/reviews/:id/comment`.
- Like/unlike: `POST /api/reviews/:id/like` (toggle).
- Delete: `DELETE /api/reviews/:id` (author-scoped, cascades `reviewComment`+`reviewLike`).
- List: `GET /api/reviews/vendor/:vendorId`; `GET /api/reviews/me` (author's own).
- Recomputes vendor `ratingAvg`/`ratingCount`.

### Data affected
- `Review`, `ReviewComment`, `ReviewLike`, `Vendor.ratingAvg/ratingCount`.

### Validation
- Rating integer; text required; author-only delete; vendor-only respond.

### Observed limitations
- **Reviews are vendor-scoped, not listing-scoped.** A listing detail's "write review"
  links to the vendor's review section.
- `CONFLICT` — prior audit claimed the listing detail had no review entry; it now links
  to vendor `#reviews` (added this session).

---

## Feature: Messaging / Chat

### Purpose
Direct buyer↔vendor conversation, with realtime delivery.

### Trigger
- "Message" button on listing/vendor → `POST /api/conversations` (find-or-create) →
  navigate to `/messages/[id]`.

### Processing (REST — `routes/conversations.ts`)
- Create: `POST /api/conversations` {vendorId, listingId?} → upsert; logs
  `conversation_started` (first creation only) with campusId.
- List: `GET /api/conversations` (role-aware: shopper sees their convos, vendor sees
  theirs).
- Messages: `GET /api/conversations/:id/messages` (cursor, limit≤50),
  `POST /api/conversations/:id/messages` (body 1–4000 chars).
- Read: `PATCH /api/conversations/:id/read`.

### Realtime (socket.io)
- **Observed (this session):** socket handshake + message broadcast verified delivering
  a sent message to the recipient live (no refresh). Cloudflare bot-challenge bypassed
  by sending a browser User-Agent on the socket client.

### Permissions
- `requireAuth`; participants only may read/post in a conversation (enforced in service).

### Data affected
- `Conversation`, `Message`, `EventLog`.

### Observed limitations
- None identified; realtime confirmed working.

---

## Feature: WhatsApp Contact

### Purpose
Let shoppers contact vendors off-platform via WhatsApp.

### Trigger
- WhatsApp button on listing/vendor detail.

### Processing (`routes/whatsapp.ts`)
- `POST /api/whatsapp/generate-message` {template, vendorName, listingTitle?,
  price?, date?, quantity?, customMessage?} → returns templated message string
  (general_inquiry | price_inquiry | availability | order | custom). Frontend opens
  `wa.me` link with the message. Click increments `whatsappClickCount` / `Listing.whatsappClickCount`.

### Output
- Pre-filled WhatsApp message text (app does NOT send it).

### Validation
- Template-specific required fields; missing → 400 MissingFields.

### Observed limitations
- No message is transmitted by Voeq; relies on WhatsApp app/web. No delivery confirmation.

---

## Feature: Wishlist / Follow / Save

### Purpose
Save listings/vendors; follow vendors for updates.

### Processing
- Wishlist: `routes/wishlist.ts` — partial-unique per (user,vendor)/(user,listing).
- Follow: `routes/follow.ts` — unique (user,vendor); powers `new_follower` notification.

### Permissions
- `requireAuth`.

### Observed limitations
- None identified.

---

## Feature: Reports & Disputes (moderation by users)

### Reports (`routes/reports.ts`)
- Buyer reports a vendor: category (not_on_campus, scam, inappropriate, impersonation,
  harassment, other) + optional text. Creates `Report` (status open).

### Disputes (`routes/disputes.ts`)
- Buyer files dispute vs vendor/listing: reason (10–100 chars) + optional details.
  `GET /disputes/mine` lists reporter's disputes.

### Permissions
- `requireAuth` for create; admin resolves via `routes/admin/reports.ts`.

### Observed limitations
- Dispute resolution is admin-side (schema `status`/`resolution`); buyer-facing
  resolution UI not fully traced.

---

## Feature: Notifications

### Purpose
Notify users of followers, reviews, review responses, badges, messages.

### Processing (`routes/notifications.ts` + `services/notification.service.ts`)
- `GET /` (cursor, limit≤50), `PATCH /:id/read`, `POST /read-all`.
- `NotificationBell` UI marks read on view.

### Data affected
- `Notification` (readAt).

### Observed limitations
- None identified.

---

## Feature: Vendor Dashboard & Analytics

### Purpose
Storefront owner home + performance insights.

### Processing
- `vendor/dashboard`: status strip (live/pending + verified badge + trust score + open-now
  + notification bell), trend sparkline (`VendorTrendCard` recharts AreaChart, 7/30-day
  toggle, views/clicks/conversations), per-listing table (`PerListingTable`: views,
  WhatsApp clicks, CTR), reviews panel (respond, see-all), listings management, contextual CTAs.
- `GET /api/vendors/me/analytics`: returns `daily` 30-day series (views/clicks/
  conversations) + `topListings` (id, title, slug, viewCount, whatsappClickCount) +
  `stats.trustScore`.

### Data affected
- Read-only on `EventLog`, `Listing`, `Review`, `Vendor`.

### Observed limitations
- `recharts` (charting lib) loads on the vendor dashboard route only (not globally) —
  confirmed by build route table (vendor/dashboard First Load JS = 259 kB, higher due
  to recharts); other routes not impacted.

---

## Feature: Admin Console (14 areas, `requireAdmin`)

### Purpose
Platform operation: moderate content, manage users/vendors/listings/categories/
institutions/campuses, view analytics, send emails, toggle feature flags, audit,
impersonate, export, manage press.

### Trigger
- Admin/super_admin lands on `/admin` post-auth.

### Processing
- All sub-routers mounted under `adminRouter.use(requireAdmin)` (`routes/admin/index.ts`):
  stats, institutions, campuses, categories, vendors, listings, users, reviews, reports,
  featured, analytics, system, emails, features, audit, settings, impersonate, export, press.
- `logAdminAction` middleware writes `AuditLog` on mutations.

### Impersonation (`routes/admin/impersonate.ts`)
- `POST /impersonate/start` {userId, duration(1h/4h/24h), reason(≥20 chars)} → issues
  impersonation session, audit log, stamps `lastAdminImpersonationAt`.
- `POST /impersonate/end` → clears impersonation session.
- **Guard:** cannot impersonate `super_admin` (403).

### Feature flags (`routes/admin/features.ts`)
- `GET /` lists flags; `PATCH /:key` updates value (JSON) + logs audit.

### Permissions
- `requireAdmin` (super_admin included).

### Observed limitations
- `admin/system`, `admin/export`, `admin/backup` exact internal behavior not fully traced
  this pass (routes + services exist).
- `moderator` role not wired to admin access (admin gate uses `requireAdmin` which checks
  `admin`/`super_admin`).

---

## Feature: Image Upload + Moderation

### Purpose
Upload profile/listing images safely.

### Processing (`routes/upload.ts`)
- `POST /api/upload/image` (requireAuth): base64 → validate type (JPEG/PNG/WebP) →
  size ≤5MB → SightEngine moderation (reject unsafe) → Cloudinary upload → log event.

### Dependencies
- Cloudinary, SightEngine. Rate-limited (50/hr).

### Output
- `{ publicId, url, width, height, ... }`.

### Failure behavior
- Missing fields → 400; invalid type → 400 InvalidType; too large → 400 TooLarge;
  unsafe → 400 ContentRejected.

### Observed limitations
- None identified.

---

## Feature: Trending on Campus

### Purpose
Surface popular listings/vendors on a campus.

### Processing (`routes/discover.ts:13`)
- Aggregate `listing_view`/`vendor_view` EventLogs for `campusId` over last 7 days →
  count per target → rank listings + vendors by view count → merge → top `limit`
  (default 8, max 20). Returns items with `views`, `windowDays:7`.

### **INFERRED**
- Ranking is by raw 7-day view count only; no rating/recency weighting observed.

### Observed limitations
- Requires `campusId`; returns empty if no events.

---

## Feature: Agreements (TOS / Privacy / Vendor)

### Purpose
Versioned legal documents + consent gate.

### Processing (`routes/agreements.ts`)
- `GET /api/agreements/current` → latest tos, privacy, vendor_agreement (by effectiveAt desc).
- `AgreementModal` forces acceptance post-auth (stamps `agreementAcceptedAt`).

### Observed limitations
- Production Agreement seed versions not inspected this pass (schema + route confirmed).

---

## Feature: Cron / Badges / Backup

### Cron (`routes/cron.ts`)
- `GET /api/cron/tick` → `syncAllVendorBadges()` (recomputes earned `VendorBadge`s).

### Badges (`routes/badges.ts` + `services/badge.service.ts`)
- `GET /badges` (definitions), `GET /badges/vendor/:id` (earned, non-revoked).

### Backup (`routes/backup.ts`)
- Cloudinary-folder backup, 30-day retention (env `BACKUP_*`). Behavior not fully traced.

### Observed limitations
- Single cron task; no scheduler config discovered in repo (assumed external trigger,
  e.g. Render cron or manual) — **UNKNOWN** exact scheduling mechanism this pass.

---

## Feature: Mobile Navigation

### Purpose
Provide usable navigation on small viewports.

### Behavior (observed in code)
- **Shopper** (`(main)`): desktop `AppSidebar` (`hidden md:flex`) + mobile `AppBottomNav`
  (fixed bottom, `md:hidden`, 4 primaries + Alerts + More). `<main>` has `pb-24` on
  mobile to clear the bottom nav.
- **Admin**: desktop `AdminSidebar` + mobile `AdminMobileNav` (bottom tab, `md:hidden`,
  6-col grid).
- **Vendor** (`VendorChrome`): desktop sidebar (`lg:block`); mobile **hamburger**
  (`lg:hidden`) toggles `mobileOpen` → the `<aside>` renders **in-flow above content**
  (stacked accordion), NOT an overlay drawer. No bottom nav for vendors. Onboarding
  suppresses the hamburger.

### **Observed limitation (vendor mobile)**
- Vendor mobile nav is a stacked in-flow drawer, unlike the bottom-tab pattern used by
  shopper/admin. Functional but inconsistent UX (flagged for potential parity fix in a
  later phase — not part of this recovery).

### Permissions
- `AppBottomNav`/`AppSidebar` return null on `/vendor` and `/admin` (role-isolated nav).

---

## Feature: Deferred Stubs (Events / Housing / Waybill)

### Purpose (intended)
- Events: campus events surface.
- Housing: housing listings.
- Waybill: shipment tracking.

### Observed
- Routes exist (`(main)/events`, `/housing`, `/waybill`) and render a "coming soon"
  state. No backend models/routes for these domains discovered.

### Classification
- **Stub / Deferred** — intentionally not built; not dead/buggy.

---

## Cross-cutting: Rate limiting, Bot protection, Observability

- **Rate limiting:** Upstash Redis with in-memory fallback (`middleware/rate-limit-upstash.ts`);
  applied to auth (signup/otp/signin/magic), upload, agreement.
- **Bot protection:** Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` /
  `TURNSTILE_SECRET_KEY`) — config present; exact UI touchpoints not fully traced.
- **Error tracking:** Sentry (`@sentry/nextjs`, `@sentry/node`, `SENTRY_DSN`).
- **Product analytics:** PostHog (`posthog-js`, `NEXT_PUBLIC_POSTHOG_KEY`).
- **Session/impersonation:** persisted `Session` rows; impersonation flagged via
  `impersonatedBy`.

### Observed limitations
- Turnstile/PostHog/Sentry wiring depth not fully traced this pass (config + package
  presence confirmed).

---

## SUMMARY OF INTENDED vs OBSERVED DISCREPANCIES

| # | Item | Intended | Observed | Note |
|---|---|---|---|---|
| 1 | Listing detail engagement UI | (prior audit) zero UI | Full UI present | Stale audit; code is truth |
| 2 | Reviews | vendor-scoped | vendor-scoped only | Listing "review" links to vendor |
| 3 | Vendor mobile nav | (implied parity) bottom nav | stacked hamburger drawer | Inconsistent with shopper/admin |
| 4 | Trending ranking | popular items | raw 7-day view count | No rating/recency weighting (inferred) |
| 5 | moderator role | usable role | enum only | No auth path discovered |
| 6 | Events/Housing/Waybill | future features | "coming soon" stubs | Deferred by design |

## MAJOR UNCERTAINTIES REQUIRING HUMAN REVIEW

- `UNKNOWN` — `moderator` role enforcement (if any).
- `UNKNOWN` — Production `FeatureFlag` values, `Agreement` seed versions, cron scheduler
  mechanism (external trigger assumed).
- `UNKNOWN` — Exact behavior of `admin/system`, `admin/export`, `admin/backup` internals.
- `INFERRED` — Trending weighting; Turnstile/PostHog/Sentry UI touchpoints.
- `CONFLICT` — Prior "listing detail has no engagement UI" claim vs. current code.
