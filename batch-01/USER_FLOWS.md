# USER_FLOWS.md — Voeq (as-built recovery, Batch 2)

> Reconstructed user journeys from Batch 1 docs + the authorization code inspected in
> Batch 2 (`routes/auth.ts`, `middleware/auth.ts`, `middleware/admin.ts`,
> `lib/auth-server.ts`, `lib/auth-redirect.ts`, `(main)/layout.tsx`, `VendorChrome.tsx`).
> Every significant Batch 1 feature is represented. Investigation-only. No fixes.

---

## AUTHENTICATION FLOWS

### Flow: Email registration (buyer)
- **Purpose:** Create a buyer account via email + OTP.
- **Start:** `(auth)/signup`.
- **Preconditions:** None (anonymous).
- **Steps:**
  ```
  Submit email+password+name
  ↓
  API: POST /api/auth/signup/password → returns pendingToken
  ↓
  User receives OTP (email via Resend)
  ↓
  Submit OTP + pendingToken on /verify-otp
  ↓
  API: POST /api/auth/verify-otp → verifies pendingToken matches email, creates session cookie
  ↓
  resolvePostAuthDestination → buyer (incomplete) → /shopper/onboarding
  ```
- **Success:** Authenticated buyer; redirected into onboarding gate.
- **Failure:**
  - Invalid/mismatched OTP or expired pendingToken → 401 InvalidOrExpiredToken ("Verification session expired. Please sign up again.").
  - Rate limit (5/15min, lockout after 5) → blocked.
  - Resend requires valid pendingToken (anti-bombing).
- **Data affected:** `User` (created), `AuthToken` (otp), `EventLog` (signup_started/completed).
- **Completion:** Land on `/shopper/onboarding`.

### Flow: Email login
- **Purpose:** Sign in existing email account.
- **Steps:** Submit email+password → `POST /api/auth/signin/password` → session cookie →
  role-based redirect.
- **Failure:** Wrong credentials → 401 InvalidCredentials. Rate-limited.
- **Completion:** Redirected per `resolvePostAuthDestination`.

### Flow: Magic-link login
- **Steps:** `POST /api/auth/magic-link` (email) → email sent → `POST /api/auth/magic-link/consume` (token) → session.
- **Failure:** Invalid/expired token → 401 InvalidOrExpiredToken.

### Flow: Google OAuth (buyer or vendor intent)
- **Purpose:** One-click sign-in/up via Google.
- **Steps:**
  ```
  Click "Sign in with Google" (intent=buyer|vendor)
  ↓
  GET /api/auth/google?intent → 302 to Google with state={intent}
  ↓
  Google consent → GET /api/auth/google/callback?code&state
  ↓
  Exchange code → fetch profile → find-or-create User (role by intent)
  ↓
  (vendor intent) promote buyer→vendor; ensureVendorRow
  ↓
  issueSession → redirect to web /api/auth/google/callback?token&dest
  ↓
  Web sets cookie on its own domain → routes by role
  ```
- **Success:** super_admin/admin → `/admin`; vendor+live → `/vendor/dashboard`;
  vendor+not-live → `/vendor/onboarding/step-1`; buyer → `/home` (or `/shopper/onboarding`
  if prefs incomplete).
- **Failure:**
  - Missing `code` → 400 MissingCode.
  - No access_token → 401 GoogleAuthFailed.
  - No email in profile → 401 GoogleNoEmail.
  - Callback error → redirect `/signin?error=oauth` (no raw error leaked).
- **Edge:** Google user NOT silently consented — `AgreementModal` forces TOS acceptance
  post-auth even though `agreementAcceptedAt` is empty.

### Flow: Password recovery
- **Steps:** `POST /api/auth/password-reset/request` (email) → `POST /api/auth/password-reset/consume` (token+new password) → session cookie.
- **Failure:** Expired/invalid token → 401 InvalidOrExpiredToken. Rate-limited (magic: 3/15min).

### Flow: Logout
- **Steps:** `POST /api/auth/signout` (revoke current session server-side) OR
  `POST /api/auth/logout-all` (revoke ALL sessions — true logout-everywhere).
- **Completion:** Cookie cleared; user returned to `/signin`.

### Flow: Session expiration / revocation
- **Mechanism:** `requireAuth` verifies JWT signature + looks up `Session` row. If the
  session was revoked (signout/logout-all) or expired, API returns 401. Web `getMe()`
  fails → client redirects to `/signin`.
- **Edge:** JWT itself has 30d expiry; revocation is enforced by the server-side
  `Session` lookup (not just cookie deletion).

---

## ONBOARDING FLOWS

### Flow: Shopper onboarding (agreement → campus → feed prefs)
- **Purpose:** Capture consent, campus, and feed preferences.
- **Start:** `(main)/layout.tsx` effect on every `(main)` page load.
- **Preconditions:** Authenticated buyer.
- **Steps:**
  ```
  getMe()
  ↓
  if !agreementAcceptedAt → show AgreementModal (accept → stamps agreementAcceptedAt)
  ↓
  else if !defaultCampusId (and not vendor-in-onboarding) → show CampusSelectModal
  ↓
  else if !feedPrefsSetAt → router.replace('/shopper/onboarding')
  ↓
  otherwise → render requested page
  ```
- **Failure:** User closes modals? Modals are gate-blocking (layout shows loading state
  until resolved). Abandoning returns to same gate on next load.
- **Completion:** `feedPrefsSetAt` set → land on `/shopper/dashboard`.

### Flow: Vendor onboarding (4-step wizard)
- **Purpose:** Take a new vendor from signup to a live storefront.
- **Start:** `/vendor/onboarding/step-1` (redirected by post-auth when `Vendor.status`
  not `live`).
- **Preconditions:** Authenticated vendor (Vendor row exists; status `incomplete`/etc).
- **Steps:**
  ```
  Step 1: Business basics (name, description, WhatsApp, campus, category) — live preview aside (hidden <lg)
  ↓
  Step 2: Photos / first listing (live preview aside hidden <lg)
  ↓
  Step 3: Review
  ↓
  Step 4: Go-live
  ↓
  Vendor.status progresses toward 'live'
  ```
- **Edge:** `VendorChrome` hides sidebar/hamburger during onboarding (distraction-free).
  Vendor-in-onboarding skips CampusSelectModal (campus set at step 2).
- **Completion:** `Vendor.status='live'` → `/vendor/dashboard`.

---

## CORE PRODUCT FLOWS

### Flow: Browse & filter listings
- **Purpose:** Discover listings by campus/category/price/rating.
- **Start:** `/browse` (or `/home`).
- **Preconditions:** None for browse; campus context helps trending/recently-viewed.
- **Steps:**
  ```
  Enter /browse
  ↓
  Type search / tap category pill / choose sort / set price·rating·verified filters
  ↓
  URL params update → GET /api/listings (ListListingsParams)
  ↓
  Listing grid (ListingCard) re-renders; active-filter chips shown
  ```
- **Alternate:** `/search` queries listings + vendors.
- **Failure:** Empty results → empty state (not a stub). API/network fail → error state.
- **Completion:** User opens a listing or vendor.

### Flow: View listing detail & engage
- **Purpose:** Inspect a listing and contact/save/follow its vendor.
- **Start:** `/l/[slug]`.
- **Steps:**
  ```
  Open listing
  ↓
  View gallery, price, description, vendor block
  ↓
  Actions: WhatsApp (opens wa.me), save-listing, message (→ starts conversation),
  share, follow vendor, write review (→ vendor #reviews)
  ↓
  View event logged (listing_view)
  ```
- **Failure:** Listing not found / not active → error/not-found state. Auth required for
  engagement (buttons trigger sign-in).
- **Completion:** Conversation started OR vendor followed/saved OR WhatsApp opened.

### Flow: View vendor profile & engage
- **Purpose:** Inspect a storefront.
- **Start:** `/v/[slug]`.
- **Steps:** save-vendor, follow, message, WhatsApp, share, reviews (respond if owner,
  comment, like), report/dispute, open-now, trust badge. `vendor_view` logged.
- **Completion:** Engagement action taken or return to browse.

### Flow: Messaging / chat
- **Purpose:** Direct buyer↔vendor conversation with realtime.
- **Start:** "Message" button on listing/vendor.
- **Steps:**
  ```
  Click Message → POST /api/conversations {vendorId, listingId?} → returns conversation id
  ↓
  Navigate to /messages/[id]
  ↓
  GET /api/conversations/:id/messages (cursor)
  ↓
  Type + send → POST /api/conversations/:id/messages → socket.io broadcast (recipient sees live)
  ↓
  PATCH /api/conversations/:id/read on view
  ```
- **Realtime:** Verified delivering messages live (this session) via socket.io with
  browser User-Agent (Cloudflare bot-challenge bypassed).
- **Failure:** Vendor not found → 404 VendorNotFound. Unauthorized → 401. Network fail →
  message queued/error state.
- **Completion:** Conversation continues; both sides see messages.

### Flow: Write / respond to review (vendor-scoped)
- **Purpose:** Buyer reviews a vendor; vendor responds.
- **Steps:**
  ```
  Buyer: POST /api/reviews/vendor/:vendorId (rating+text) → unique (userId,vendorId)
  ↓
  Vendor (owner): PATCH /api/reviews/:id/respond → vendorResponse set
  ↓
  Others: POST /:id/comment, POST /:id/like (toggle)
  ↓
  Author: DELETE /:id (cascades comment+like)
  ```
- **Failure:** Not author → delete rejected (author-scoped). Not vendor → respond
  rejected. Duplicate (userId,vendorId) → unique constraint.
- **Completion:** Review visible on vendor profile; rating recomputed.

### Flow: WhatsApp contact
- **Purpose:** Off-platform contact.
- **Steps:** WhatsApp button → `POST /api/whatsapp/generate-message` (template) →
  frontend opens `wa.me` with pre-filled text; click increments `whatsappClickCount`.
- **Failure:** Missing template fields → 400 MissingFields. App does not send message.

### Flow: Save / follow
- **Steps:** `ListingSaveButton`/vendor save → `routes/wishlist.ts`; `FollowButton` →
  `routes/follow.ts`. Toggle persists; `new_follower` notification on follow.

### Flow: Report / dispute
- **Steps:** Report vendor → `routes/reports.ts` (category+text). Dispute →
  `routes/disputes.ts` (reason+details); `GET /disputes/mine` lists own.

### Flow: Notifications
- **Steps:** `NotificationBell` → `GET /api/notifications` → mark read (`PATCH /:id/read`
  or `POST /read-all`).

---

## CRUD FLOWS (vendor-owned)

### Flow: Create listing
- **Start:** `vendor/listings/new`.
- **Steps:** Fill form (title, price range, description, category, photos via
  `/api/upload/image`) → create → `Vendor.status` gating may require live.
- **Failure:** Upload rejected (type/size/moderation) → 400. Unauthorized → 401.

### Flow: Edit / delete listing
- **Start:** `vendor/listings/[id]/edit`. Delete = soft-delete (`deletedAt`).

### Flow: Manage vendor profile / settings / hours
- **Start:** `vendor/profile`, `vendor/settings`. Edit business info, hours, socials.

---

## DISCOVERY FLOWS
Covered above: Browse & filter, Search, Trending on campus (`GET /api/discover/trending`
— 7-day view ranking), Recently viewed (`GET /api/discover/recently-viewed`, auth).

---

## COMMUNICATION FLOWS
Covered: Messaging/chat, Notifications, WhatsApp contact, Share (share button on
listing/vendor), Follow (notification). No invitation system discovered (UNKNOWN).

---

## ACCOUNT MANAGEMENT FLOWS

### Flow: Profile
- **Start:** `/profile`. Edit name/image, view own data.

### Flow: Settings
- **Start:** `/settings`. Preferences (`UserPreference`: email/notification toggles,
  `feedPrefsSetAt`), security (sign out / logout-all), account (UNKNOWN — deletion UI not
  found this pass; schema has `deletedAt` but no self-serve delete flow confirmed).

### Flow: Preferences
- Set during shopper onboarding (feedPrefsSetAt) and editable in settings.

---

## ADMINISTRATIVE FLOWS

### Flow: Admin sign-in & console access
- **Start:** Google OAuth (role already admin/super_admin) → `/admin`.
- **Guard:** `admin/layout.tsx` `requireSuperUserAdmin` (admin/super_admin only).
- **Note:** moderator is excluded from `/admin` web (see Role doc discrepancy).

### Flow: Moderate content (admin/moderator)
- **Screens:** `admin/vendors`, `admin/listings`, `admin/reviews`, `admin/reports`.
- **Steps:** Review queue → suspend/verify/feature vendor, moderate listing, resolve
  report, respond to/hide review. Backed by `PERMISSIONS` capability matrix.

### Flow: Manage users (admin/super_admin)
- **Screen:** `admin/users`. Moderate/ban users; `canActOnUser` prevents acting on staff.

### Flow: Featured placements
- **Screen:** `admin/featured`. Mark vendor featured (sets `isFeatured`, `featuredUntil`).

### Flow: Institutions / campuses / categories
- **Screens:** `admin/institutions`, `admin/campuses`, `admin/categories`.

### Flow: Impersonation (admin/super_admin)
- **Steps:** `POST /api/admin/impersonate/start` {userId, duration, reason≥20} → session
  issued → act as user → `POST /api/admin/impersonate/end`. Cannot target super_admin.

### Flow: Audit / export / emails / press / system / settings / feature flags
- **Screens:** `admin/audit`, `admin/export`, `admin/emails`, `admin/press`,
  `admin/system`, `admin/settings`, `admin` (features). Most write `AuditLog` via
  `logAdminAction`.

---

## ERROR / RECOVERY FLOWS

### Invalid input
- Zod validation in routes → 400 with field errors (e.g. dispute reason 10–100 chars,
  message body 1–4000). Frontend shows inline errors.

### Missing data
- Listing/vendor not found → 404 (e.g. VendorNotFound on conversation create).
- Empty browse/search → empty state.

### Unauthorized
- No session → API 401; web `requireAuth`/`requireVendor`/`requireShopper` → redirect
  `/signin`. Non-buyer hitting `/shopper/*` → redirected to own section.

### Forbidden (staff)
- `resolveActor` → 403 if banned/suspended; `requireSuperAdmin` → 403; `requirePermission`
  → 403 missing capability; impersonate super_admin → 403.

### Server / external failure
- Google OAuth error → `/signin?error=oauth`. Upload moderation fail → 400
  ContentRejected. SightEngine/Cloudinary down → upload error state.

### Expired session
- `requireAuth` session lookup fails → 401 → web redirect `/signin`.

### Abandoned flow
- Onboarding modals gate-blocking; abandoning returns to same gate next load.
- Checkout/payment: N/A (no payments; contact is off-platform WhatsApp).

---

## SYSTEM-DRIVEN FLOWS (no direct user journey)
- **Cron badge sync** (`GET /api/cron/tick` → `syncAllVendorBadges`): automated, no UI
  flow (external trigger assumed — UNKNOWN scheduler).
- **Analytics event logging** (`logEvent`): passive, no user-initiated flow.
- **Email sending** (Resend): triggered by auth (OTP/magic) and admin `email.send`; not a
  user-browsable flow.

---

## CROSS-REFERENCE TO BATCH 1 FEATURES
Every Batch 1 Core/Secondary feature has a flow above or is system-driven (cron,
analytics, email). Deferred stubs (Events/Housing/Waybill) have **no user flow** — they
render "coming soon" only.
