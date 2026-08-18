# DATA_REQUIREMENTS.md — Voeq (as-built recovery, Batch 3)

> The information the product needs to store, relate, and manage — independent of the
> old database implementation. The Prisma schema was used as **evidence only**; it is
> NOT reproduced here, and no SQL/types/ORM are recommended. Investigation-only.
> No secrets are included; categories below are product-level, not credential values.

---

## DATA ENTITY DISCOVERY

Entities below are conceptual product concepts derived from evidence across Batches
1–3. Each is what the product *needs*, not how it was stored.

---

## Entity: Account (Person)

### Purpose
Represents a human using the platform (buyer, vendor, or staff).

### Why it exists
Every other entity relates to a person: they browse, save, follow, message, review,
moderate, or administer.

### Core information
- Identity: unique email; display name; profile image (optional).
- Role: one of buyer / vendor / moderator / admin / super_admin.
- Status: active / suspended / banned.
- Authentication: whether email-verified; whether has password; whether has Google;
  last sign-in time.
- Consent: agreement version accepted + when + IP + user-agent; campus-selected flag;
  one-time welcome-seen flag; feed-preferences-set flag.
- Association: default campus.

### Required information
- Email (unique); Role (default buyer); Status (default active).

### Optional information
- Name, image, password hash, Google linkage, campus, consent timestamps.

### Relationships
- A person **owns** a Vendor storefront (at most one).
- A person **authors** reviews, **files** reports/disputes, **starts** conversations,
  **has** wishlist items, **follows** vendors, **receives** notifications, **has**
  preferences, **holds** sessions.

### Ownership
- The person themselves (self-service); staff for moderation.

### Access
- Self (private fields); public profile subset; staff for moderation.

### Modification
- Self (profile/preferences/consent); staff (status/role for moderation).

### Lifecycle
- Created on signup/OAuth. Soft-deletable (logical deletion flag). UNKNOWN whether a
  self-serve delete UI exists.

### Data sensitivity
- **Sensitive:** email, auth markers, IP/UA on consent, status. **Private** to the user;
  **staff-only** for moderation.

---

## Entity: Vendor Storefront

### Purpose
A campus business owned by a person; the seller side of the marketplace.

### Why it exists
Vendors publish listings, receive messages/reviews, earn trust, and get analytics.

### Core information
- Business name; owner name; description (≥50 chars expected for completeness).
- Unique slug (public URL key).
- WhatsApp number (required for go-live + contact).
- Public phone (optional).
- Association: institution (school) + campus.
- Location: city/state (optional).
- Status: incomplete / pending_review / live / suspended (+ logical deletion).
- Verification: verified badge (boolean) + when/by whom.
- Featured: boolean + expiry.
- Derived signals: trust score; rating average; rating count; view count; WhatsApp
  click count.
- Operating hours / always-open / timezone.
- Social handles (instagram, tiktok, twitter, facebook, linkedin, website).
- Onboarding progress (0–100); last draft saved.

### Required information
- Owner (person); business name; slug; owner name; WhatsApp number; status.

### Optional information
- Description, photos, institution/campus, verification, socials, hours, featured.

### Relationships
- Owned by one person.
- Has many Listings.
- Receives many Reviews; has many Followers; has many Wishlist-saves.
- Has many Conversations; many Reports (as target); many Disputes (as target).
- Earns many Badges.

### Ownership
- The owning person (vendor). Staff can verify/feature/suspend.

### Access
- Public storefront (profile, listings, reviews, trust). Staff for moderation.

### Modification
- Owner (profile/listings/settings). Staff (verify/feature/suspend/delete logically).

### Lifecycle
- Created when a buyer becomes a vendor (incomplete). → live via go-live gate. →
  suspended (staff). → logically deleted.

### Data sensitivity
- **Public:** name, description, WhatsApp, socials, location, trust/rating.
- **Staff-only:** verification actor, suspension reason.

---

## Entity: Listing (Product/Service)

### Purpose
An offer published by a vendor.

### Why it exists
The core browseable unit of the marketplace.

### Core information
- Title; description.
- Unique slug (within vendor).
- Price: minimum (required) + maximum (optional) — a range.
- Section/category assignment (primary + optionally secondary categories).
- Status: active (default on create) / paused / archived / draft (states exist; usage
  partially confirmed).
- Visibility: logically deletable (deletedAt).
- Derived: view count; WhatsApp click count; flash-deal flag + expiry.
- Photos (ordered, with alt text).

### Required information
- Vendor (owner); title; description; price min; slug; status.

### Optional information
- Price max, secondary categories, photos, flash deal, section.

### Relationships
- Owned by one Vendor.
- Filed under one or more Categories.
- Has many Photos.
- Receives Reviews (optionally referenced).
- Has many Wishlist-saves; many Conversations (optionally referenced).
- Generates EventLog entries (views/clicks).

### Ownership
- The owning vendor. Staff for moderation.

### Access
- Public only if vendor is **live** AND listing is **active** AND not logically deleted.

### Modification
- Owner (create/edit/soft-delete). Staff (moderate).

### Lifecycle
- Created (active). → paused/archived (optional, transitions UNKNOWN). → logically
  deleted.

### Data sensitivity
- **Public** (when visible).

---

## Entity: Category

### Purpose
Taxonomy for classifying listings.

### Why it exists
Drives browse filters and listing organization.

### Core information
- Name; unique slug; description (optional); icon; image.
- Display order; active flag; official flag.
- Parent (supports a category tree).

### Required information
- Name; slug.

### Optional information
- Description, icon, image, parent, ordering.

### Relationships
- Has many Listings (via category assignment).
- May have a parent category and child categories.

### Ownership
- Platform (staff-managed).

### Access
- Public (for browsing).

### Modification
- Staff only (`category.moderate`).

### Lifecycle
- Created/updated by staff; active flag controls visibility.

### Data sensitivity
- **Public.**

---

## Entity: Institution & Campus

### Purpose
Schools (university/polytechnic/college) and their campuses; the geographic scope of
the marketplace.

### Why it exists
Discovery, trending, and onboarding are campus-scoped.

### Core information (Institution)
- Name; unique slug; type; logo; city/state/country; source (seed/user-submitted);
  status (pending/approved/rejected); verification; approval metadata.
- Requested-by email (for user submissions).

### Core information (Campus)
- Name; slug; primary flag; active flag; association to institution.

### Required information
- Institution: name; slug; type. Campus: name; slug; institution.

### Optional information
- Logo, location, verification, status.

### Relationships
- Institution has many Campuses.
- Campus has many Vendors (as their campus); many Users (as default campus).
- Institution has many Vendors.

### Ownership
- Platform (staff). Users may submit institutions (pending approval).

### Access
- Public (for selection/discovery).

### Modification
- Staff (`institution.moderate`, `campus.moderate`).

### Lifecycle
- Seed or user-submitted → pending → approved/rejected.

### Data sensitivity
- **Public.**

---

## Entity: Review

### Purpose
A buyer's rating + written assessment of a vendor.

### Why it exists
Trust signal for shoppers; affects vendor rating/trust.

### Core information
- Rating (integer, presumably 1–5); text.
- Target: a Vendor (required). Optional reference to a Listing.
- Status: visible / hidden / deleted.
- Vendor response (single text) + when.
- Verified-purchase flag (derived from WhatsApp contact).
- Author (person).

### Required information
- Vendor (target); author; rating; text.

### Optional information
- Listing reference; vendor response; verified-purchase flag.

### Relationships
- Authored by one Person.
- Targets one Vendor.
- May reference one Listing.
- Has many Comments; many Likes.

### Ownership
- The author (can edit within 24h, delete). The vendor (can respond once, edit within
  24h). Staff (hide/moderate).

### Access
- Public (visible reviews only).

### Modification
- Author (edit ≤24h, delete); Vendor (respond ≤once, edit ≤24h); Staff (hide).

### Lifecycle
- Created (visible). → hidden (staff). → deleted (author; cascades comments+likes).

### Data sensitivity
- **Public** (when visible). Author identity shown.

---

## Entity: Review Comment & Review Like

### Purpose
Community discussion and appreciation on a review.

### Why it exists
Engagement around reviews.

### Core information (Comment)
- Content (text); author; review.

### Core information (Like)
- Person; review (unique per person per review).

### Relationships
- Both belong to a Review; cascade-deleted when the review is deleted.

### Ownership
- Comment author; Like author.

### Access
- Public (with the review).

### Modification
- Author (comment); author toggles like; Staff.

### Lifecycle
- Created; removed with review (cascade) or by author.

### Data sensitivity
- **Public.**

---

## Entity: Wishlist Save

### Purpose
A buyer's saved vendor or listing for later.

### Why it exists
Quick re-access to interesting stores/listings.

### Core information
- Person; exactly one of: vendor OR listing (mutually exclusive per row).
- Created time.

### Required information
- Person; either vendor or listing.

### Relationships
- Belongs to a Person; references a Vendor or a Listing.

### Ownership
- The person.

### Access
- Private to the person.

### Modification
- Person (add/remove). Unique per (person, target).

### Lifecycle
- Created; removed by user.

### Data sensitivity
- **Private** to user.

---

## Entity: Follow

### Purpose
A buyer subscribing to a vendor's updates.

### Why it exists
Engagement; triggers new_follower notification.

### Core information
- Person; Vendor; created time.

### Required information
- Person; Vendor.

### Relationships
- Person follows Vendor (unique pair).

### Ownership
- The person.

### Access
- Private to the person; vendor sees follower count.

### Modification
- Person (follow/unfollow).

### Lifecycle
- Created; removed by user.

### Data sensitivity
- **Private** to user; aggregate count public.

---

## Entity: Conversation & Message

### Purpose
Direct buyer↔vendor messaging.

### Why it exists
Primary in-app communication channel (realtime).

### Core information (Conversation)
- Shopper (person); Vendor; optional referenced Listing; created/last-message times.
- Unique per (shopper, vendor).

### Core information (Message)
- Conversation; sender (person); body (text, ≤4000); created time; read time.

### Required information
- Conversation: shopper + vendor. Message: conversation + sender + body.

### Optional information
- Listing reference; read time.

### Relationships
- Conversation links a Person (shopper) and a Vendor; may reference a Listing.
- Has many Messages (ordered by time).

### Ownership
- The two participants.

### Access
- Participant-only (shopper or vendor).

### Modification
- Participants (send). No edit/delete endpoints observed.

### Lifecycle
- Created on first message; messages appended; read-state tracked.

### Data sensitivity
- **Private** (participants only). **Staff-only** for moderation/impersonation.

---

## Entity: Notification

### Purpose
Alert a user to relevant events.

### Why it exists
Keep users engaged with followers, reviews, responses, badges, messages.

### Core information
- Recipient (person); type (new_follower / new_review / review_response / badge_earned
  / new_message); payload (Json context); read time; created time.

### Required information
- Recipient; type.

### Relationships
- Belongs to a Person.

### Ownership
- The recipient.

### Access
- Private to recipient.

### Modification
- System-created; recipient marks read (single or all).

### Lifecycle
- Created; marked read; persists (retention UNKNOWN).

### Data sensitivity
- **Private** to recipient.

---

## Entity: Report

### Purpose
A buyer reports a vendor for a policy violation.

### Why it exists
Community moderation signal.

### Core information
- Submitter (person); target (Vendor); category (not_on_campus / scam / inappropriate /
  impersonation / harassment / other); text (optional); status (open / investigating /
  resolved / dismissed); resolution metadata.

### Required information
- Submitter; target (vendor); category.

### Relationships
- Submitted by a Person; targets a Vendor.

### Ownership
- Platform (staff review).

### Access
- Submitter (own); Staff (all). **Private** to staff + submitter.

### Modification
- Submitter (create); Staff (resolve/dismiss/moderate).

### Lifecycle
- Created (open) → investigating → resolved/dismissed.

### Data sensitivity
- **Staff-only / private** (contains allegations).

---

## Entity: Dispute

### Purpose
A buyer files a dispute against a vendor/listing.

### Why it exists
Post-contact conflict resolution channel.

### Core information
- Reporter (person); vendor; optional listing; reason (10–100 chars); details
  (optional); status (open/resolved, free-text status field); resolution;
  resolved-by; resolved-at.

### Required information
- Reporter; vendor; reason.

### Relationships
- Reported by a Person; against a Vendor (optionally a Listing).

### Ownership
- Platform (staff review).

### Access
- Reporter (own); Staff. **Private.**

### Modification
- Reporter (create); Staff (resolve).

### Lifecycle
- Created (open) → resolved (with resolution).

### Data sensitivity
- **Private / staff-only.**

---

## Entity: Vendor Badge

### Purpose
Gamified/earned trust signal on a vendor.

### Why it exists
Encourages good behavior; feeds trust score.

### Core information
- Vendor; badge key (newcomer / active_seller / verified_presence / quick_responder /
  rising_star / top_rated / multi_talented / community_pillar); earned time; revoked
  time/reason (optional).

### Required information
- Vendor; badge key.

### Relationships
- Belongs to a Vendor. Unique per (vendor, badge key).

### Ownership
- Platform (computed via cron).

### Access
- Public (earned badges).

### Modification
- System (syncAllVendorBadges); Staff (revoke).

### Lifecycle
- Earned → optionally revoked.

### Data sensitivity
- **Public** (earned).

---

## Entity: Event Log (Analytics)

### Purpose
Record behavioral/telemetry events.

### Why it exists
Powers trending, recently-viewed, and analytics.

### Core information
- Event type (page_view / search / category_filter / listing_view / vendor_view /
  whatsapp_click / signup_started / signup_completed / vendor_go_live /
  listing_created / review_submitted / report_submitted / request_submitted /
  badge_earned / conversation_started); actor (person, optional); vendor/listing/
  category/campus references; metadata (Json); IP; user-agent; time.

### Required information
- Event type; time.

### Relationships
- Optionally references User/Vendor/Listing/Category/Campus.

### Ownership
- Platform.

### Access
- **Staff-only** (analytics); aggregates surfaced publicly (trending).

### Modification
- System-written (append-only).

### Lifecycle
- Appended; retention UNKNOWN.

### Data sensitivity
- **Staff-only**; may contain IP/UA (privacy-relevant).

---

## Entity: Agreement

### Purpose
Versioned legal documents (TOS / privacy / vendor agreement).

### Why it exists
Consent gating.

### Core information
- Type (tos / privacy / vendor_agreement); version; title; content; effective time.

### Required information
- Type; version; content.

### Relationships
- None direct (referenced by Account consent fields).

### Ownership
- Platform.

### Access
- Public (current version).

### Modification
- Staff (create new version).

### Lifecycle
- New version supersedes prior (latest by effectiveAt).

### Data sensitivity
- **Public** (legal text).

---

## Entity: Audit Log

### Purpose
Record staff actions.

### Why it exists
Accountability / forensic trail.

### Core information
- Actor (staff person); action; target type/id; metadata (Json); IP; user-agent; time.

### Required information
- Actor; action.

### Relationships
- References the acting staff Person.

### Ownership
- Platform.

### Access
- **Staff-only** (admin/audit).

### Modification
- System-written on admin actions.

### Lifecycle
- Append-only.

### Data sensitivity
- **Staff-only** (contains actor IP/UA).

---

## Entity: Feature Flag

### Purpose
Runtime toggles for platform behavior.

### Why it exists
Change behavior without redeploy.

### Core information
- Key (unique); value (Json); description; updated-by; times.

### Required information
- Key; value.

### Ownership
- Platform (staff).

### Access
- **Staff-only.**

### Modification
- Staff (`settings.manage` / features).

### Lifecycle
- Created/updated; no deletion observed.

### Data sensitivity
- **Staff-only.**

---

## Entity: Press Item

### Purpose
Announcements / features / press / blog.

### Why it exists
Public relations / content surface.

### Core information
- Kind (announcement / feature / press-release / blog); title; summary; body;
  publish date; published flag.

### Required information
- Kind; title.

### Ownership
- Platform (staff).

### Access
- Public (published items).

### Modification
- Staff.

### Lifecycle
- Created; published/unpublished.

### Data sensitivity
- **Public.**

---

## Entity: Session (Auth)

### Purpose
Persisted login session.

### Why it exists
Revocable authentication; impersonation support.

### Core information
- Token hash (unique); person; user-agent; IP; impersonated-by; expiry; created.

### Required information
- Person; token hash; expiry.

### Relationships
- Belongs to a Person; may carry impersonated-by (another staff person).

### Ownership
- Platform / user.

### Access
- **Secret/credential-related** (token hash). Staff see impersonation metadata.

### Modification
- System (create/revoke).

### Lifecycle
- Created on auth; revoked on signout/logout-all; expires at 30d.

### Data sensitivity
- **Secret** (token hash). Never copied.

---

## Entity: Auth Token (OTP / Magic Link)

### Purpose
Hold one-time email verification / password-reset tokens.

### Why it exists
Email-based auth flows.

### Core information
- Email; token hash (unique); type (otp / magic_link); purpose; user; expiry;
  consumed time; IP; user-agent.

### Required information
- Email; token hash; type.

### Ownership
- Platform.

### Access
- **Secret** (token hash).

### Modification
- System.

### Lifecycle
- Issued → consumed or expired.

### Data sensitivity
- **Secret.**

---

## Entity: User Preference

### Purpose
Per-user notification/email/feed preferences.

### Why it exists
Lets users control communications; gates shopper onboarding completion.

### Core information
- Person; email-marketing / email-reviews / email-newsletter toggles; notify-new-
  listings / reviews / followers / disputes toggles; feed-preferences-set flag.

### Required information
- Person.

### Relationships
- Belongs to a Person (unique).

### Ownership
- The person.

### Access
- **Private** to user; staff for support.

### Modification
- Self.

### Lifecycle
- Created with account; updated by user.

### Data sensitivity
- **Private.**

---

## RELATIONSHIP MAP (conceptual product map)

```text
Account (Person)
 │
 ├── Vendor Storefront (at most one)
 │     │
 │     ├── Listing (many)
 │     │     ├── Photo (many, ordered)
 │     │     ├── Category (one primary + optional secondary)
 │     │     ├── Review (many, vendor-scoped; optional listing reference)
 │     │     ├── Wishlist Save (many)
 │     │     ├── Conversation (many; optional listing reference)
 │     │     └── Event Log (views/clicks)
 │     │
 │     ├── Review (many)
 │     │     ├── Comment (many)
 │     │     └── Like (many)
 │     ├── Follower (many persons)
 │     ├── Wishlist Save (many)
 │     ├── Conversation (many)
 │     ├── Report (many, as target)
 │     ├── Dispute (many, as target)
 │     ├── Badge (many)
 │     └── Event Log (views)
 │
 ├── Review (authored, many)
 ├── Report (submitted, many)
 ├── Dispute (reported, many)
 ├── Wishlist Save (many)
 ├── Follow (many vendors)
 ├── Conversation (many, as shopper)
 │     └── Message (many)
 ├── Notification (many)
 ├── Preference (one)
 ├── Session (many; impersonation metadata)
 └── Audit Log (as actor, staff)

Institution
 └── Campus (many)
       ├── Vendor (many, as campus)
       └── Account (many, as default campus)

Category (tree-capable)
 └── Listing (many, via assignment)

Agreement (current version referenced by Account consent)
FeatureFlag (staff toggles)
PressItem (public content)
EventLog (analytics, staff-only raw; aggregates public)
```

---

## DATA LIFECYCLE

| Entity | Created by | Modified by | Inactivation | Deletion | Related data |
|---|---|---|---|---|---|
| Account | signup/OAuth | self/staff | suspend/ban | logical (deletedAt); self-serve UI UNKNOWN | cascades to own rows |
| Vendor | become-vendor | owner/staff | suspend | logical | listings/reviews remain (soft) |
| Listing | vendor | owner/staff | pause/archive (UNKNOWN usage) | logical (deletedAt) | photos/events remain |
| Review | buyer | author(≤24h)/staff | hide | physical (cascade comments+likes) | rating recomputed |
| Conversation/Message | participants | participants (send) | — | no delete observed | — |
| Notification | system | recipient (read) | — | persists (retention UNKNOWN) | — |
| Report/Dispute | buyer | staff (resolve) | resolve/dismiss | status only | — |
| Session | auth | system (revoke) | revoke/expire | physical (revoke) | — |
| EventLog/AuditLog | system | none | — | append-only (retention UNKNOWN) | — |

---

## DATA DERIVED FROM OTHER DATA

| Derived value | Source | Update behavior |
|---|---|---|
| Vendor rating average + count | visible Reviews (rating) | recomputed on review create/update/delete |
| Vendor trust score (0–100) | badges, review count, verified, age, open reports, suspension | recomputed (badge cron + on changes) |
| Vendor onboarding progress (0–100) | business fields, listing, agreement, status | recomputed |
| "Verified purchase" flag | WhatsApp click eventLog (30d) at review time | set at review creation |
| Trending items | 7-day listing_view/vendor_view eventLogs | per request (ranked) |
| Recently viewed | 14-day distinct view eventLogs | per request |
| Open/closed vendor status | operatingHours / alwaysOpen / timezone | per request |
| Conversation started flag | creation time (<2s) | at creation |
| Listing view count / WhatsApp click count | increment on view/click | per event |
| Category/listing facets | current listings | per browse request |
| Read/unread message & notification counts | readAt presence | per action |

**Design note:** these are product-required derivations; the rebuild should recompute
them, not necessarily store them (except where caching is needed).

---

## DATA RETENTION

- **Persists indefinitely (observed):** Accounts, Vendors, Listings (soft-deleted),
  Reviews, Categories, Institutions/Campuses, Agreements, FeatureFlags, PressItems,
  Badges, Follows, Wishlist, Preferences, AuditLog, EventLog.
- **Expires:** Sessions (30d), AuthTokens (OTP/magic, short-lived), Featured
  (`featuredUntil`), FlashDeal (`flashDealUntil`).
- **Can be deleted (logical):** Account (`deletedAt`), Vendor (`deletedAt`), Listing
  (`deletedAt`). Review deletion is **physical** (cascade).
- **Retention UNKNOWN:** Notifications, Messages, Reports, Disputes, EventLog, AuditLog
  — no TTL observed in code.
- **Soft-deleted:** Account/Vendor/Listing via `deletedAt` (queries filter them out).

---

## DATA INTEGRITY REQUIREMENTS (product-level)

- **Uniqueness:** email (account); vendor slug; listing slug (within vendor); (person,
  vendor) review; (person, vendor) follow; (person, vendor OR listing) wishlist;
  (shopper, vendor) conversation; (person, badge) badge; session token hash; auth token
  hash.
- **Required relationships:** a Vendor requires an owning Person; a Listing requires a
  Vendor; a Review requires a Vendor target; a Conversation requires a shopper Person and
  a Vendor; a Report targets a Vendor; a Dispute targets a Vendor.
- **Ownership enforcement:** mutations require ownership (or staff permission) — see
  BUSINESS_RULES Authorization rules.
- **Valid state transitions:** Vendor/Listing/Review/Report/Dispute/User/Agreement/
  Session state machines (see BUSINESS_RULES §13).
- **Required fields:** Account email+role; Vendor name+slug+whatsapp+status; Listing
  title+priceMin+slug+status; Review rating+text+vendor+author; Message body+sender+
  conversation.
- **Referential dependencies:** deleting a Vendor logically preserves Listings/Reviews
  (they reference the vendor); deleting a Review physically cascades its comments+likes;
  revoking a Session invalidates the JWT.

---

## PRIVACY & SENSITIVITY

| Category | Examples | Required protection |
|---|---|---|
| Secret / credential | Session token hash, AuthToken hash, password hash | Never exposed; hash-only; staff cannot read plaintext |
| Personal (private) | email, name, consent IP/UA, preferences, wishlist, follows, notifications, conversations | user-private; staff only for support/moderation |
| Staff-only | AuditLog, EventLog (raw), FeatureFlag, impersonation metadata, Report/Dispute content | staff roles per PERMISSIONS |
| Public | vendor profile, listings, reviews (visible), badges, categories, institutions, agreements, press | safe to display |
| Privacy-relevant aggregates | EventLog IP/UA | treat as personal data; staff-only; consider retention |

**No actual secret values are recorded in these documents.**

---

## CROSS-DOCUMENT ANALYSIS (Batch 3 vs Batches 1–2)

### Missing data
- None identified that blocks the documented features. All Batch 1 features map to the
  entities above.

### Missing rules
- The **moderator web-console gap** (Batch 2 conflict) is re-affirmed as a rule
  discrepancy, not a missing data concept (the `moderator` role + PERMISSIONS exist; the
  web surface does not).
- **ListingStatus.draft / paused / archived** and **VendorStatus.pending_review /
  rejected** exist as states but their app-driven transitions are only partially
  confirmed — flagged as Uncertain, not assumed active. The rebuild should decide
  whether these states are needed.

### Contradictions
- **CONFLICT — moderator:** API-enforced (`STAFF_ROLES` + `PERMISSIONS.moderator`) but
  web-invisible (`requireSuperUserAdmin` excludes; no moderator UI). Same as Batch 2.
- **CONFLICT/UNCERTAIN — listing lifecycle:** `ListingStatus.draft` exists but vendor
  create sets `active` directly; the draft→active transition may be legacy/unused.

### Orphaned data
- `User.drafts` (Json) — a free-form drafts field on Account; **UNCLEAR** what populates
  it (no draft UI clearly traced). Possibly legacy. Flag for review.
- `ListingStatus.draft/paused/archived`, `VendorStatus.pending_review/rejected` — enum
  values with unclear app usage (potential legacy/partially-used states).
- `Agreement` versions beyond current — retained historically (expected, not orphaned).

### Orphaned functionality
- None identified. All features map to entities.

---

## LEGACY ARTIFACTS (do NOT automatically survive the rebuild)

- **`User.drafts` (Json):** no clear producer in current UI; likely legacy. Confirm
  before carrying forward. → **LEGACY ARTIFACT — unclear producer**.
- **Unused `ListingStatus` states (draft/paused/archived):** vendor create uses `active`;
  transitions for the others not observed. → **LEGACY ARTIFACT / uncertain** — decide per
  product need.
- **Unused `VendorStatus` states (pending_review/rejected):** `canGoLive` drives
  incomplete→live; pending_review/rejected routing not confirmed. → **UNCERTAIN** — may
  be legacy or future.
- **`User.lastAdminImpersonationAt` / `Session.impersonatedBy`:** keep (impersonation is
  active and audited) — NOT legacy.
- **`Listing.searchVector` / `Vendor.searchVector` (tsvector):** implementation-specific
  full-text search artifact; the product need is "searchable listings/vendors" — carry
  the *need*, not the tsvector mechanism. → **LEGACY ARTIFACT (implementation)**.
- **`EventLog.section`/various metadata Json:** keep the *need* (analytics); the exact
  shape is implementation.

**Product requirements vs legacy artifacts** are distinguished throughout; the rebuild
team should treat the LEGACY/UNCERTAIN items as candidates for removal or
re-evaluation, not automatic carries.

---

## SUMMARY
- **~22 meaningful data entities** identified (Account, Vendor, Listing, Category,
  Institution, Campus, Review, ReviewComment, ReviewLike, WishlistSave, Follow,
  Conversation, Message, Notification, Report, Dispute, VendorBadge, EventLog, Agreement,
  AuditLog, FeatureFlag, PressItem, Session, AuthToken, UserPreference — counting the
  core set).
- All described as **product requirements** (information needed), not as tables/columns.
- Derived, retention, integrity, and privacy requirements captured separately.
- Legacy/uncertain artifacts explicitly separated from genuine product needs.
