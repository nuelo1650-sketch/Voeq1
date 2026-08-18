# BUSINESS_RULES.md — Voeq (as-built recovery, Batch 3)

> Reconstructed business rules from the code inspected across Batches 1–3:
> `schema.prisma`, `routes/auth.ts`, `middleware/auth.ts`, `middleware/admin.ts`,
> `lib/auth-server.ts`, `lib/auth-redirect.ts`, `services/vendor.service.ts`,
> `services/review.service.ts`, `services/listings.service.ts`,
> `services/trust-score.service.ts`, `routes/*`. Investigation-only. No modifications.
> No secrets.

Each rule follows the requested format. **Confidence** tags used: Confirmed / Strongly
inferred / Uncertain / Conflicting.

---

## 1. ACCOUNT RULES

### Rule: Account requires email identity
- **Requirement:** Every account is identified by a unique email.
- **Applies to:** All users.
- **Condition:** On creation (email signup or Google).
- **Behavior:** Email must be unique; Google users get `emailVerified` stamped.
- **Exceptions:** None.
- **Evidence:** `User.email @unique`; `routes/auth.ts` Google create sets `emailVerified`.
- **Confidence:** Confirmed.

### Rule: Email verification via OTP / magic link
- **Requirement:** Email-based accounts are verified through OTP or magic-link, not
  password-only.
- **Applies to:** Email signup/login.
- **Condition:** Signup → verify-otp; or magic-link flow.
- **Behavior:** OTP requires a valid pending token (anti-enumeration). Magic link
  consumed via token.
- **Exceptions:** Google users are pre-verified.
- **Evidence:** `routes/auth.ts` signup/verify-otp/magic-link.
- **Confidence:** Confirmed.

### Rule: Agreement acceptance is forced post-auth (not pre-consented)
- **Requirement:** A user cannot use the shopper app until they accept the TOS.
- **Applies to:** All authenticated users lacking `agreementAcceptedAt`.
- **Condition:** `(main)/layout.tsx` effect: `!agreementAcceptedAt` → AgreementModal.
- **Behavior:** Modal is gate-blocking; the layout shows a loading state until resolved.
  Google users are NOT silently consented even though the field is empty.
- **Exceptions:** Admin/moderator console may not enforce this (UNKNOWN — not traced).
- **Evidence:** `(main)/layout.tsx`; `routes/auth.ts` comment.
- **Confidence:** Confirmed.

### Rule: Campus selection required for shoppers (except vendor-in-onboarding)
- **Requirement:** A shopper must pick a default campus before using the app.
- **Applies to:** Authenticated users lacking `defaultCampusId`.
- **Condition:** After agreement, `!defaultCampusId` (and not vendor-in-onboarding) →
  CampusSelectModal.
- **Behavior:** Gate-blocking; campus stored as `defaultCampusId`.
- **Exceptions:** Vendor in onboarding sets campus at step 2 (skips double prompt).
- **Evidence:** `(main)/layout.tsx`.
- **Confidence:** Confirmed.

### Rule: Account status — active / suspended / banned
- **Requirement:** Accounts have a status controlling access.
- **Applies to:** All users.
- **Condition:** `UserStatus` enum: active | suspended | banned.
- **Behavior:** `resolveActor` (admin middleware) returns 403 if status is
  suspended/banned when accessing admin routes.
- **Exceptions:** `requireAuth` (normal app) does NOT check `UserStatus` — impact on
  normal usage UNKNOWN.
- **Evidence:** `middleware/admin.ts`; `schema.prisma`.
- **Confidence:** Confirmed (admin scope); Uncertain (normal-app scope).

### Rule: Session revocation invalidates token immediately
- **Requirement:** Sign-out / logout-all must instantly disable the session everywhere.
- **Applies to:** All sessions.
- **Condition:** `POST /api/auth/signout` (current) or `/logout-all` (all).
- **Behavior:** Server deletes `Session` row; `requireAuth` re-checks the row, so a
  revoked JWT fails 401 even before its 30-day expiry.
- **Evidence:** `routes/auth.ts`; `middleware/auth.ts` (lookupSession).
- **Confidence:** Confirmed.

### Rule: Account deletion is soft (logical)
- **Requirement:** Deletion must not physically destroy rows referenced elsewhere.
- **Applies to:** User, Vendor, Listing.
- **Behavior:** `User.deletedAt`, `Vendor.deletedAt`, `Listing.deletedAt` are nullable
  timestamp fields; queries filter `deletedAt: null`.
- **Evidence:** schema; `listings.service` deleteListing sets `deletedAt`.
- **Confidence:** Confirmed (listing/vendor); Uncertain (user self-serve delete UI).

---

## 2. ROLE RULES

### Rule: Five roles, default buyer
- **Requirement:** New accounts are buyers unless explicitly elevated.
- **Applies to:** All users.
- **Behavior:** `UserRole @default(buyer)`.
- **Evidence:** schema.
- **Confidence:** Confirmed.

### Rule: Becoming a vendor (one-way promotion)
- **Requirement:** A buyer becomes a vendor via Google intent=vendor or become-vendor.
- **Applies to:** buyers.
- **Behavior:** `ensureVendorRow` flips role→vendor and creates Vendor row (idempotent
  upsert). A vendor is NEVER demoted to buyer by the promotion logic.
- **Exceptions:** Demotion path UNKNOWN (no code found).
- **Evidence:** `vendor.service.ensureVendorRow`; `routes/auth.ts` promote.
- **Confidence:** Confirmed (promotion); Uncertain (demotion).

### Rule: Staff roles obtained by assignment only
- **Requirement:** moderator/admin/super_admin are not self-serve.
- **Applies to:** staff.
- **Behavior:** No invite/self-serve UI found; assumed DB/seed assignment.
- **Evidence:** `middleware/admin.ts` (no creation route); Batch 2.
- **Confidence:** Uncertain (mechanism unconfirmed).

### Rule: Staff hierarchy (canActOnUser)
- **Requirement:** Higher-ranked staff cannot be acted on by lower-ranked staff.
- **Applies to:** admin/moderator/super_admin.
- **Behavior:** super_admin can act on anyone; admin can act on anyone except
  admin/super_admin; moderator cannot act on admin/super_admin/moderator.
- **Evidence:** `middleware/admin.ts` `canActOnUser`.
- **Confidence:** Confirmed.

### Rule: Moderator capability set (backend-enforced, web-invisible)
- **Requirement:** Moderators have scoped content moderation only.
- **Applies to:** moderator role.
- **Behavior:** `PERMISSIONS.moderator` = user.moderate, user.ban, vendor.moderate,
  vendor.verify, listing.moderate, report.moderate, review.moderate. Backend
  `requireAdmin`/`requireModerator` accept moderator (in `STAFF_ROLES`). However, the
  web app has ZERO moderator references; `admin/layout.tsx` uses `requireSuperUserAdmin`
  (excludes moderator) and there is no moderator UI.
- **Exceptions/Conflict:** A moderator could call admin API routes but has no web
  console; excluded from `/admin` pages.
- **Evidence:** `middleware/admin.ts`; `admin/layout.tsx`; web grep (empty).
- **Confidence:** Confirmed (backend); **Conflicting** (web vs API).

### Rule: Post-auth destination by role + completion
- **Requirement:** After auth, land the user in the correct section.
- **Applies to:** all roles.
- **Behavior:** super_admin/admin → `/admin`; vendor+live → `/vendor/dashboard`;
  vendor+not-live → `/vendor/onboarding/step-1`; buyer+complete → `/shopper/dashboard`;
  buyer+incomplete → `/shopper/onboarding`. An explicit safe `next` wins if same-origin.
- **Evidence:** `lib/auth-redirect.ts`; `routes/auth.ts`.
- **Confidence:** Confirmed.

---

## 3. AUTHORIZATION RULES

### Rule: Resource ownership gates mutations
- **Requirement:** Mutating a resource requires owning it (or staff permission).
- **Applies to:** listings, reviews, conversations, notifications.
- **Behavior (example — review delete):**
  ```
  request delete review
   ↓
  is requester the review author? ── no → 401 Unauthorized
   ↓ yes
  delete + cascade comments/likes + recompute rating
  ```
- **Evidence:** `review.service.deleteReview` (userId check); `listings.service`
  (vendorId match on update/delete); `conversations.service` (participant check).
- **Confidence:** Confirmed.

### Rule: Vendor responds only to own reviews
- **Requirement:** A vendor can respond only to reviews on their own vendor.
- **Applies to:** vendors.
- **Behavior:** `addVendorResponse` checks `review.vendorId === vendorId`; one response
  only; editable within 24h.
- **Evidence:** `review.service.addVendorResponse/updateVendorResponse`.
- **Confidence:** Confirmed.

### Rule: Capability-gated admin actions
- **Requirement:** Specific admin powers require specific permissions.
- **Applies to:** staff.
- **Behavior:** `requirePermission('user.ban')` etc.; `hasPermission` checks the
  `PERMISSIONS` matrix; super_admin has `'*'`.
- **Evidence:** `middleware/admin.ts`.
- **Confidence:** Confirmed (matrix exists); Uncertain (whether every admin route
  applies a specific `requirePermission` or relies on blanket `requireAdmin`).

---

## 4. VENDOR RULES

### Rule: Vendor go-live requires completeness
- **Requirement:** A vendor cannot go live until minimum requirements are met.
- **Applies to:** vendors.
- **Condition (all required):** businessName present; whatsappNumber present;
  profilePhotoPublicId present; ≥1 active listing; agreementAcceptedAt present.
- **Behavior:** `canGoLive` returns `{canGoLive:false, reason}` if any missing; otherwise
  live.
- **Evidence:** `vendor.service.canGoLive`.
- **Confidence:** Confirmed.

### Rule: Onboarding progress is a derived 0–100 score
- **Requirement:** Track how complete a vendor's setup is.
- **Applies to:** vendors.
- **Behavior:** `calculateOnboardingProgress` = 20% each for (name+owner+desc≥50 chars),
  (whatsapp+institution+campus), (profilePhoto), (has active listing),
  (agreement + status=live).
- **Evidence:** `vendor.service.calculateOnboardingProgress`.
- **Confidence:** Confirmed.

### Rule: Vendor slug uniqueness + stability
- **Requirement:** Each vendor has a unique, human-readable slug.
- **Applies to:** vendors.
- **Behavior:** `generateUniqueVendorSlug` appends `-N` on collision; slug is the public
  URL key (`/v/[slug]`).
- **Evidence:** `vendor.service.generateUniqueVendorSlug`.
- **Confidence:** Confirmed.

### Rule: Vendor verification is a boolean badge
- **Requirement:** A vendor can be marked verified by staff.
- **Applies to:** vendors (verifiedBadge), staff (vendor.verify permission).
- **Behavior:** `verifiedBadge` boolean; contributes +5 to trust score.
- **Evidence:** schema; `trust-score.service`; `PERMISSIONS.vendor.verify`.
- **Confidence:** Confirmed.

### Rule: Vendor trust score is derived (0–100)
- **Requirement:** A trust signal summarizing vendor health.
- **Applies to:** vendors.
- **Behavior:** base 50; +2 per active badge; +floor(reviewCount/5); +5 if verified;
  +min(monthsActive,12); −10 per open report; −20 if suspended; clamped 0–100.
- **Evidence:** `trust-score.service.calculateTrustScore`.
- **Confidence:** Confirmed.

### Rule: Vendor open/closed status is computed, not stored as a simple flag
- **Requirement:** Show whether a vendor is currently open.
- **Applies to:** vendors.
- **Behavior:** `GET /api/vendors/:slug/is-open` computes from operatingHours /
  isAlwaysOpen / timezone.
- **Evidence:** `routes/vendor-hours.ts` (referenced); `VendorChrome` OpenNowIndicator.
- **Confidence:** Confirmed.

### Rule: Featured vendors have a time limit
- **Requirement:** Featured placement expires.
- **Applies to:** vendors.
- **Behavior:** `isFeatured` boolean + `featuredUntil` timestamp; admin sets via
  `vendor.feature` permission.
- **Evidence:** schema; `PERMISSIONS.vendor.feature`.
- **Confidence:** Confirmed.

---

## 5. BUYER/SHOPPER RULES

### Rule: Shoppers cannot access vendor/admin sections
- **Requirement:** Role isolation between sections.
- **Applies to:** buyers.
- **Behavior:** `requireShopper` redirects non-buyers to their section; `requireVendor`
  redirects non-vendors/non-staff to `/shopper/dashboard`; `requireSuperUserAdmin`
  redirects non-staff to `/home`.
- **Evidence:** `lib/auth-server.ts`.
- **Confidence:** Confirmed.

### Rule: Messaging requires authentication
- **Requirement:** Only signed-in users can message.
- **Applies to:** shoppers/vendors.
- **Behavior:** `conversations` routes `requireAuth`.
- **Evidence:** `routes/conversations.ts`.
- **Confidence:** Confirmed.

### Rule: Reviews require a vendor (not a listing)
- **Requirement:** A review targets a vendor; a listing may be referenced but is optional.
- **Applies to:** buyers.
- **Behavior:** `createReview(vendorId, userId, {rating, text, listingId?})`.
- **Evidence:** `review.service.createReview`; schema `Review.listingId` nullable.
- **Confidence:** Confirmed.

### Rule: Save/follow are per-target unique
- **Requirement:** A user cannot save/follow the same target twice.
- **Applies to:** buyers.
- **Behavior:** `WishlistItem` has partial-uniques `(userId,vendorId)` and
  `(userId,listingId)`; `Follow` unique `(userId,vendorId)`.
- **Evidence:** schema; Batch 1.
- **Confidence:** Confirmed.

### Rule: Reporting a vendor
- **Requirement:** Buyers can report a vendor with a category + optional text.
- **Applies to:** buyers.
- **Behavior:** `POST /api/reports` → `Report` (status open).
- **Evidence:** `routes/reports.ts`; schema.
- **Confidence:** Confirmed.

---

## 6. LISTING/PRODUCT RULES

### Rule: Listing visibility requires a LIVE vendor
- **Requirement:** A listing is publicly browsable only if its vendor is live.
- **Applies to:** listings.
- **Behavior:** `listListings` and `getListingBySlug` filter `status:'active'`,
  `deletedAt:null`, AND `vendor.status:'live'`.
- **Evidence:** `listings.service.listListings` / `getListingBySlug`.
- **Confidence:** Confirmed.

### Rule: Listing has a price RANGE
- **Requirement:** Listings express a min (required) and optional max price.
- **Applies to:** listings.
- **Behavior:** `priceMin` required; `priceMax` nullable.
- **Evidence:** schema; `createListing`.
- **Confidence:** Confirmed.

### Rule: Listing creation defaults to active (not draft)
- **Requirement:** Vendor-created listings go live immediately.
- **Applies to:** listings.
- **Behavior:** `createListing` sets `status:'active'` (the `ListingStatus.draft` enum
  value exists but vendor create does not use it).
- **Evidence:** `listings.service.createListing`.
- **Confidence:** Confirmed. **Note:** `ListingStatus` includes `draft`/`paused`/
  `archived` — these states exist in the enum but their transition usage is UNKNOWN
  this pass (potential legacy/partially-used states).

### Rule: Listing ownership enforced on edit/delete
- **Requirement:** Only the owning vendor may modify/delete a listing.
- **Applies to:** vendors.
- **Behavior:** `updateListing`/`deleteListing` match `vendorId`; else return null.
- **Evidence:** `listings.service`.
- **Confidence:** Confirmed.

### Rule: Listing deletion is soft
- **Requirement:** Deleting a listing is logical, not physical.
- **Applies to:** listings.
- **Behavior:** `deleteListing` sets `deletedAt`.
- **Evidence:** `listings.service.deleteListing`.
- **Confidence:** Confirmed.

### Rule: Viewing a listing increments its view count
- **Requirement:** Track popularity.
- **Applies to:** listings.
- **Behavior:** `getListingBySlug` does `viewCount: { increment: 1 }` on each view; also
  logs `listing_view` EventLog (with campus).
- **Evidence:** `listings.service.getListingBySlug`.
- **Confidence:** Confirmed.

### Rule: Listings support multiple categories (primary + secondary)
- **Requirement:** A listing can be filed under several categories.
- **Applies to:** listings.
- **Behavior:** `ListingCategory` join; first is `isPrimary`. Browse filter uses primary
  `category.slug`.
- **Evidence:** schema; `createListing` maps `categoryIds`.
- **Confidence:** Confirmed.

### Rule: Browse/search/sort/filter behavior
- **Requirement:** Discovery must support search, category, campus, price, rating,
  verified, featured, and sort.
- **Applies to:** discovery.
- **Behavior:** search matches title/description/vendor name (insensitive); sort ∈
  {newest, oldest, price_asc, price_desc, rating (vendor ratingAvg), popular
  (viewCount)}; filters: campusId, categorySlug, minPrice/maxPrice, minRating,
  verifiedOnly, featured; returns facets (categories + price range).
- **Evidence:** `listings.service.listListings`.
- **Confidence:** Confirmed.

### Rule: Image upload constraints + moderation
- **Requirement:** Uploaded images must be safe and within limits.
- **Applies to:** profile/listing images.
- **Behavior:** type ∈ {JPEG,PNG,WebP}; size ≤5MB; SightEngine moderation (reject unsafe)
  → Cloudinary. Rate-limited 50/hr.
- **Evidence:** `routes/upload.ts`.
- **Confidence:** Confirmed.

---

## 7. REVIEW RULES

### Rule: One review per (buyer, vendor)
- **Requirement:** A buyer may review a given vendor only once.
- **Applies to:** buyers.
- **Behavior:** `createReview` throws if `(userId,vendorId)` exists ("Edit it instead").
  Unique constraint enforced.
- **Evidence:** `review.service.createReview`; schema `@@unique([userId, vendorId])`.
- **Confidence:** Confirmed.

### Rule: Review editable within 24 hours only
- **Requirement:** Reviews (and vendor responses) can be edited briefly after posting.
- **Applies to:** review authors / vendors.
- **Behavior:** `EDIT_WINDOW_MS = 24h`; `updateReview` rejects if older or non-visible;
  `updateVendorResponse` rejects if older than 24h since response.
- **Evidence:** `review.service.updateReview` / `updateVendorResponse`.
- **Confidence:** Confirmed.

### Rule: Single vendor response per review
- **Requirement:** A vendor may respond once (then edit within window).
- **Applies to:** vendors.
- **Behavior:** `addVendorResponse` throws if `vendorResponse` already set.
- **Evidence:** `review.service.addVendorResponse`.
- **Confidence:** Confirmed.

### Rule: Review deletion cascades and recomputes rating
- **Requirement:** Deleting a review must clean up its children and update vendor rating.
- **Applies to:** review authors.
- **Behavior:** `deleteReview` removes comments + likes (transaction) then review; calls
  `updateVendorRating`.
- **Evidence:** `review.service.deleteReview`.
- **Confidence:** Confirmed.

### Rule: Vendor rating is derived from visible reviews
- **Requirement:** Displayed rating reflects only visible reviews.
- **Applies to:** vendors.
- **Behavior:** `updateVendorRating` averages `rating` over `status:'visible'` reviews;
  count = number; 0 if none. Recomputed on create/update/delete.
- **Evidence:** `review.service.updateVendorRating`.
- **Confidence:** Confirmed.

### Rule: "Verified purchase" is derived from WhatsApp contact
- **Requirement:** A review can be flagged as verified-purchase.
- **Applies to:** reviews.
- **Behavior:** `isVerifiedPurchase = true` if the reviewer clicked WhatsApp to that
  vendor within the last 30 days (eventLog whatsapp_click).
- **Evidence:** `review.service.createReview`.
- **Confidence:** Confirmed. **INFERRED** — this is the only signal; no order/payment
  system exists to verify purchases (contact is off-platform).

### Rule: Only visible reviews are listed publicly
- **Requirement:** Hidden/deleted reviews are excluded from public listing.
- **Applies to:** review display.
- **Behavior:** `listVendorReviews` filters `status:'visible'`.
- **Evidence:** `review.service.listVendorReviews`.
- **Confidence:** Confirmed.

---

## 8. MESSAGING RULES

### Rule: Conversation is unique per (shopper, vendor)
- **Requirement:** One conversation thread per shopper–vendor pair.
- **Applies to:** conversations.
- **Behavior:** `upsertConversation` keyed on `(shopperId, vendorId)`; `@@unique`.
- **Evidence:** schema; `conversation.service`.
- **Confidence:** Confirmed.

### Rule: Conversation access is participant-only
- **Requirement:** Only the shopper or the vendor in a conversation may read/post.
- **Applies to:** conversations.
- **Behavior:** Service checks membership before returning messages / accepting posts.
- **Evidence:** `routes/conversations.ts`; `conversation.service`.
- **Confidence:** Confirmed.

### Rule: conversation_started event logged once
- **Requirement:** Contact signal logged only on first creation.
- **Applies to:** conversations.
- **Behavior:** Logs `conversation_started` only if created within last 2s; campusId from
  shopper default or vendor campus.
- **Evidence:** `routes/conversations.ts`.
- **Confidence:** Confirmed.

### Rule: Messages are read on view
- **Requirement:** Track read state.
- **Applies to:** messages.
- **Behavior:** `PATCH /:id/read` sets `readAt` for recipient; `Message.readAt` nullable.
- **Evidence:** `routes/conversations.ts`.
- **Confidence:** Confirmed.

### Rule: Realtime delivery via socket.io
- **Requirement:** Sent messages appear live to the recipient.
- **Applies to:** messages.
- **Behavior:** socket.io broadcast verified delivering live this session; requires a
  browser-like User-Agent to pass Cloudflare bot challenge.
- **Evidence:** session socket smoke test.
- **Confidence:** Confirmed.

### Rule: No attachments / no edit-delete of messages (observed)
- **Requirement:** Messages are text-only; no edit/delete endpoints observed.
- **Applies to:** messages.
- **Behavior:** `sendMessage` takes `body` (1–4000 chars); no attachment field; no
  update/delete message routes in `conversations.ts`.
- **Evidence:** `routes/conversations.ts`.
- **Confidence:** Confirmed (no such routes found); Uncertain (future intent).

---

## 9. SOCIAL / ENGAGEMENT RULES

### Rule: Follow generates a notification
- **Requirement:** Vendors are notified of new followers.
- **Applies to:** follow.
- **Behavior:** `NotificationType.new_follower` triggered on follow.
- **Evidence:** schema NotificationType; Batch 1.
- **Confidence:** Confirmed.

### Rule: Notifications are read-on-action
- **Requirement:** Users can mark notifications read individually or all.
- **Applies to:** notifications.
- **Behavior:** `PATCH /:id/read`, `POST /read-all`; `readAt` nullable.
- **Evidence:** `routes/notifications.ts`.
- **Confidence:** Confirmed.

### Rule: Sharing is client-side
- **Requirement:** Users can share listings/vendors.
- **Applies to:** share buttons.
- **Behavior:** Share button constructs a shareable URL/client share; no server state.
- **Evidence:** Batch 1 (ShareButton).
- **Confidence:** Confirmed.

---

## 10. NOTIFICATION RULES

| Trigger | Recipient | Content | Read state | Persistence |
|---|---|---|---|---|
| new_follower | vendor | follower identity | readAt nullable; mark read | stored |
| new_review | vendor | review summary | same | stored |
| review_response | buyer (reviewer) | vendor response | same | stored |
| badge_earned | vendor | badge info | same | stored |
| new_message | conversation participant | message preview | same | stored |

- **Trigger:** system/event-driven (follow, review create, vendor respond, badge sync,
  message send).
- **Recipient:** the affected party (vendor or buyer).
- **Content/context:** minimal payload (Json) — identity/summary, not full objects.
- **Read state:** `readAt` set on view/mark; list shows unread.
- **Persistence:** rows persist; not auto-expired (UNKNOWN retention).
- **Evidence:** schema `NotificationType`; `routes/notifications.ts`;
  `services/notification.service.ts`.

---

## 11. REPORT / DISPUTE / MODERATION RULES

### Rule: Buyers report vendors (not listings directly)
- **Requirement:** Reports target a vendor.
- **Applies to:** buyers.
- **Behavior:** `POST /api/reports` {targetId=vendorId, category, text?}; status open.
- **Evidence:** `routes/reports.ts`; schema `Report.targetId → Vendor`.
- **Confidence:** Confirmed.

### Rule: Disputes reference optional listing
- **Requirement:** A buyer can file a dispute against a vendor, optionally a listing.
- **Applies to:** buyers.
- **Behavior:** `POST /api/disputes` {vendorId, listingId?, reason(10–100), details?};
  status open; `GET /disputes/mine`.
- **Evidence:** `routes/disputes.ts`.
- **Confidence:** Confirmed.

### Rule: Moderation is capability-scoped
- **Requirement:** Only permitted staff act on reports/content.
- **Applies to:** staff.
- **Behavior:** moderator: user/vendor/listing/review/report moderate + user.ban.
  admin: + verify/feature/institution/campus/category/featured/press/email/settings/
  analytics/audit/impersonate. super_admin: all (`'*'`).
- **Evidence:** `middleware/admin.ts` PERMISSIONS.
- **Confidence:** Confirmed.

### Rule: Report/dispute resolution by staff
- **Requirement:** Open items are resolved by staff.
- **Applies to:** staff.
- **Behavior:** `ReportStatus` open→investigating→resolved/dismissed; `Dispute.status`
  open→resolved (with resolution text, resolvedBy, resolvedAt). Exact transition
  endpoints not fully traced this pass.
- **Evidence:** schema enums; `routes/admin/reports.ts` (exists).
- **Confidence:** Confirmed (states); Uncertain (exact route transitions).

### **CONFLICT — moderator API vs web console**
- The API accepts `moderator` for admin routes (`STAFF_ROLES` includes moderator;
  `PERMISSIONS.moderator` grants content moderation) and the web has **no moderator UI**
  (`requireSuperUserAdmin` excludes moderator from `/admin`). Net: moderators can call
  admin API moderation routes but cannot reach them via the web app. Documented, not
  resolved. See `USER_ROLES_AND_PERMISSIONS.md`.

---

## 12. ADMINISTRATIVE RULES

### Rule: Staff hierarchy for acting on users
- **Requirement:** Protect staff from lower-ranked actors.
- **Applies to:** staff.
- **Behavior:** `canActOnUser` (see Role rules).
- **Evidence:** `middleware/admin.ts`.
- **Confidence:** Confirmed.

### Rule: Impersonation is time-boxed + audited + super_admin-protected
- **Requirement:** Staff may act as a user only temporarily and with reason.
- **Applies to:** admin/super_admin.
- **Behavior:** `POST /impersonate/start` {userId, duration 1h/4h/24h, reason≥20 chars}
  → issues session, logs audit, stamps `lastAdminImpersonationAt`. Cannot target
  super_admin (403). `POST /impersonate/end` clears.
- **Evidence:** `routes/admin/impersonate.ts`.
- **Confidence:** Confirmed.

### Rule: All admin mutations are audited
- **Requirement:** Admin actions are logged.
- **Applies to:** staff.
- **Behavior:** `logAdminAction` middleware writes `AuditLog` on admin access + mutations
  (feature flags, impersonation, etc.).
- **Evidence:** `middleware/audit.ts`; `routes/admin/*`.
- **Confidence:** Confirmed.

### Rule: Feature flags are runtime-toggleable
- **Requirement:** Platform behavior can be toggled without deploy.
- **Applies to:** staff + runtime.
- **Behavior:** `FeatureFlag` key/value(JSON); `PATCH /admin/features/:key` updates +
  logs; `GET /admin/features` lists.
- **Evidence:** `routes/admin/features.ts`; schema.
- **Confidence:** Confirmed.

### Rule: Export / backup capabilities exist
- **Requirement:** Data can be exported/backed up.
- **Applies to:** staff.
- **Behavior:** `routes/admin/export.ts`, `routes/backup.ts` (Cloudinary folder, 30-day
  retention). Internals not fully traced.
- **Evidence:** route files exist.
- **Confidence:** Confirmed (exist); Uncertain (exact behavior).

---

## 13. STATE MACHINES

### State machine: Vendor status
```
incomplete ──(complete go-live requirements)──▶ live
incomplete ──(submit for review)──▶ pending_review ──(approve)──▶ live
pending_review ──(reject)──▶ (rejected)
live ──(suspend)──▶ suspended ──(unsuspend)──▶ live
any ──(soft-delete)──▶ deleted (via deletedAt)
```
- **Triggers:** `canGoLive` gate; staff approval/suspension.
- **Side effects:** live → dashboard access; suspended → trust −20, admin 403.
- **Terminal:** deleted (logical).
- **Confidence:** Confirmed (states + canGoLive); Uncertain (pending_review/rejected
  transition endpoints — enum exists, exact routing UNKNOWN).

### State machine: Listing status
```
active (created) ──(pause)──▶ paused ──(resume)──▶ active
active ──(archive)──▶ archived ──(unarchive?)──▶ active
active ──(soft-delete)──▶ deleted (deletedAt)
draft ──(publish?)──▶ active   [draft state exists but vendor create uses active]
```
- **Triggers:** vendor actions; staff moderation.
- **Note:** `draft`/`paused`/`archived` enum values exist but their transition usage by
  the app is UNKNOWN this pass — potential legacy/partially-used states.
- **Confidence:** Confirmed (active + soft-delete); Uncertain (draft/paused/archived
  usage).

### State machine: Review status
```
visible ──(hide by staff)──▶ hidden
visible ──(delete by author)──▶ (row removed; status 'deleted' enum exists)
hidden ──(unhide?)──▶ visible
```
- **Triggers:** author delete (cascade); staff moderation (hidden).
- **Side effects:** rating recomputed from visible only.
- **Confidence:** Confirmed (visible + delete + hidden enum).

### State machine: Report / Dispute
```
open ──(triage)──▶ investigating ──(resolve)──▶ resolved
open ──(dismiss)──▶ dismissed
investigating ──(dismiss)──▶ dismissed
```
- **Confidence:** Confirmed (states); Uncertain (exact route transitions).

### State machine: User status
```
active ──(suspend)──▶ suspended ──(reinstate)──▶ active
active ──(ban)──▶ banned
```
- **Confidence:** Confirmed (states + admin 403 on suspended/banned).

### State machine: Auth token / session
```
pending (otp/magic issued) ──(consume)──▶ consumed (consumedAt)
pending ──(expire)──▶ expired
session issued ──(revoke signout/logout-all)──▶ revoked
session ──(30d expiry)──▶ expired
```
- **Confidence:** Confirmed.

### State machine: Agreement
```
(version created) ──(effectiveAt)──▶ current
new version ──▶ supersedes prior (latest by effectiveAt returned)
```
- **Confidence:** Confirmed.

---

## 14. AUTOMATIC / SYSTEM RULES

### Rule: Badge synchronization (cron)
- **Requirement:** Vendor badges are recomputed periodically.
- **Applies to:** vendors.
- **Behavior:** `GET /api/cron/tick` → `syncAllVendorBadges()`. Trigger mechanism
  (external scheduler) UNKNOWN.
- **Evidence:** `routes/cron.ts`; `services/badge.service.ts`.
- **Confidence:** Confirmed (logic); Uncertain (schedule).

### Rule: Event logging is passive
- **Requirement:** User behavior is recorded for analytics/trending.
- **Applies to:** all significant actions.
- **Behavior:** `logEvent` writes `EventLog` (page_view, search, listing_view,
  vendor_view, whatsapp_click, signup*, vendor_go_live, listing_created,
  review_submitted, report_submitted, badge_earned, conversation_started).
- **Evidence:** `services/analytics.service.ts`; routes.
- **Confidence:** Confirmed.

### Rule: Trending is computed from 7-day view events
- **Requirement:** Campus trending reflects recent popularity.
- **Applies to:** discovery.
- **Behavior:** `discover/trending` ranks listings/vendors by `listing_view`/
  `vendor_view` counts over last 7 days; **raw count only, no rating/recency
  weighting (INFERRED)**.
- **Evidence:** `routes/discover.ts`.
- **Confidence:** Confirmed (mechanism); INFERRED (no weighting).

### Rule: Recently-viewed derived from event log
- **Requirement:** Show a shopper what they recently looked at.
- **Applies to:** shoppers.
- **Behavior:** `discover/recently-viewed` distinct listing/vendor views (14d),
  most-recent-first, capped 12.
- **Evidence:** `routes/discover.ts`.
- **Confidence:** Confirmed.

### Rule: Notifications fire on lifecycle events
- **Requirement:** Users are alerted to relevant changes.
- **Applies to:** followers, reviewers, vendors, buyers.
- **Behavior:** new_follower / new_review / review_response / badge_earned /
  new_message triggers (see Notification rules).
- **Evidence:** schema; services.
- **Confidence:** Confirmed.

### Rule: Rate limiting (abuse protection)
- **Requirement:** Sensitive endpoints are throttled.
- **Applies to:** auth, upload, agreement.
- **Behavior:** Upstash Redis with in-memory fallback; e.g. OTP 5/15min lockout,
  magic 3/15min, upload 50/hr.
- **Evidence:** `middleware/rate-limit-upstash.ts`; routes.
- **Confidence:** Confirmed.

### Rule: Bot protection (Turnstile) + observability (Sentry/PostHog)
- **Requirement:** Protect forms; capture errors/usage.
- **Applies to:** frontend.
- **Behavior:** env-provided (TURNSTILE_*, SENTRY_*, POSTHOG_*). UI touchpoints not
  fully traced.
- **Evidence:** `.env.example`; packages.
- **Confidence:** Confirmed (config); Uncertain (UI wiring depth).

---

## CROSS-DOCUMENT NOTES
- All rules above are consistent with Batch 1 (`FEATURE_INVENTORY.md`,
  `FUNCTIONAL_SPECIFICATION.md`) and Batch 2 (`USER_ROLES_AND_PERMISSIONS.md`,
  `USER_FLOWS.md`, `PAGE_AND_SCREEN_INVENTORY.md`).
- The **moderator conflict** is the single most important unresolved rule discrepancy
  (API-enforced, web-invisible).
- Several `ListingStatus` / `VendorStatus` enum values (`draft`, `paused`, `archived`,
  `pending_review`, `rejected`) exist but their app-driven transitions are only
  partially confirmed — flagged as Uncertain, not assumed active.
