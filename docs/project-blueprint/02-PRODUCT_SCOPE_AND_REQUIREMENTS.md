# 02-PRODUCT_SCOPE_AND_REQUIREMENTS.md — Voeq Rebuild

> **Status:** PRODUCT REQUIREMENTS ONLY. Not architecture. Not database. Not API. Not UI. Not
> design system. Not implementation.
> **Layer:** sits between `01-PRODUCT_DECISIONS.md` (what we believe) and UX / Architecture /
> Implementation (how we build).
> **Rule:** Current founder decisions override legacy behavior. Legacy material = *evidence of what
> existed*, not a spec to copy. Where a requirement would otherwise silently carry a broken legacy
> behavior, it is marked `REDESIGNED` or `REMOVED`.
> **Classification tags:** priority `MUST` / `SHOULD` / `LATER` / `REMOVED`; source `DECIDED` /
> `LEGACY-PRESERVED` / `REDESIGNED` / `NEW` / `OPEN`.

---

# 1. COMPLETE PRODUCT FEATURE MAP

Organized by product area. Every item carries a stable ID used in §14.

## Public (PUB)
- **VOEQ-PUB-001** Landing page — hero, campus context, entry to discovery. Background may be a
  designed, subject-earned phenomenon (campus terrain + live vendor constellation) per design
  exploration; exact treatment is a design-phase decision. `MUST` `DECIDED`
- **VOEQ-PUB-002** Public discovery (browse grid, trending-on-campus, recently-viewed, followed-feed
  preview). `MUST` `DECIDED`
- **VOEQ-PUB-003** Public search. `MUST` `DECIDED`
- **VOEQ-PUB-004** Category landing pages. `MUST` `DECIDED`
- **VOEQ-PUB-005** Public vendor/storefront. `MUST` `DECIDED`
- **VOEQ-PUB-006** Public listing detail. `MUST` `DECIDED`
- **VOEQ-PUB-007** About. `MUST` `DECIDED`
- **VOEQ-PUB-008** Terms. `MUST` `DECIDED`
- **VOEQ-PUB-009** Privacy. `MUST` `DECIDED`
- **VOEQ-PUB-010** Help. `SHOULD` `DECIDED`
- **VOEQ-PUB-011** For-Vendors (public recruitment page). `SHOULD` `NEW`
- **VOEQ-PUB-012** Press/Media. `LATER` `LEGACY-PRESERVED` (legacy had it; low priority, defer)

## Identity (IDN)
- **VOEQ-IDN-001** Registration (email OTP + magic-link, or Google OAuth; intent = shopper/vendor).
  `MUST` `REDESIGNED` (legacy cross-domain auth broken — redesign at architecture stage)
- **VOEQ-IDN-002** Login (email OTP/magic-link, Google). `MUST` `LEGACY-PRESERVED` (intent)
- **VOEQ-IDN-003** Email verification (OTP / magic-link; anti-enumeration via pending token). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-IDN-004** Sessions (persisted, server-revocable; single sign-in across web + api). `MUST`
  `REDESIGNED` (legacy cross-domain cookie issue)
- **VOEQ-IDN-005** Password recovery (forgot / reset). `MUST` `LEGACY-PRESERVED`
- **VOEQ-IDN-006** Logout (sign-out current; logout-all devices). `MUST` `LEGACY-PRESERVED`
- **VOEQ-IDN-007** Account state (active / suspended / banned) — enforcement on *normal* app is
  `OPEN` (legacy only enforced on admin routes). `MUST` `REDESIGNED`
- **VOEQ-IDN-008** Role handling (shopper default; buyer→vendor promotion; staff by assignment only).
  `MUST` `REDESIGNED` (terminology: buyer→shopper)
- **VOEQ-IDN-009** Consent gate (forced TOS/Privacy acceptance post-auth). `MUST` `LEGACY-PRESERVED`
- **VOEQ-IDN-010** Campus selection gate (shopper must pick default campus before use). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-IDN-011** `.edu.ng` gating (pilot intent). Mechanism `OPEN`. `MUST` `DECIDED`

## Shopper (SHOP)
- **VOEQ-SHOP-001** Shopper onboarding (discovery preference / feed-interest capture). `MUST` `DECIDED`
- **VOEQ-SHOP-002** Campus (default campus; switch campus). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-003** Discovery (browse, trending-on-my-campus, recently-viewed, followed). `MUST`
  `REDESIGNED` (fix view-count inflation; weighted trending)
- **VOEQ-SHOP-004** Search. `MUST` `LEGACY-PRESERVED` (intent)
- **VOEQ-SHOP-005** Filtering (campus, category, price, rating, verified, featured). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-SHOP-006** Listing interaction (view, save, share, open vendor, review entry). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-SHOP-007** Vendor interaction (view profile, follow, message, review). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-SHOP-008** Saves / wishlist (vendor or listing). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-009** Follows (vendor). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-010** Reviews (create, edit ≤24h, delete). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-011** Messaging — see MSG area. `MUST` `NEW` (native, replaces WhatsApp)
- **VOEQ-SHOP-012** Notifications (in-app). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-013** Profile (self). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-014** Settings (preferences, notification prefs, account). `MUST` `LEGACY-PRESERVED`
- **VOEQ-SHOP-015** Reports (report a vendor). `MUST` `LEGACY-PRESERVED`

## Vendor (VEND)
- **VOEQ-VEND-001** Vendor onboarding — **5 steps** (per founder brief). `MUST` `DECIDED` (legacy was 4)
- **VOEQ-VEND-002** Storefront (public profile surface). `MUST` `LEGACY-PRESERVED`
- **VOEQ-VEND-003** Vendor profile management. `MUST` `LEGACY-PRESERVED`
- **VOEQ-VEND-004** Listings CRUD (create/edit/soft-delete; price range). `MUST` `LEGACY-PRESERVED`
- **VOEQ-VEND-005** Categories (assign primary + secondary to listing). `MUST` `LEGACY-PRESERVED`
- **VOEQ-VEND-006** Images (upload + automated moderation; real 5MB via presigned, not base64).
  `MUST` `REDESIGNED`
- **VOEQ-VEND-007** Availability (operating hours / always-open → computed open-now). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-VEND-008** Reviews (view, respond ≤24h, one response). `MUST` `LEGACY-PRESERVED`
- **VOEQ-VEND-009** Messaging — see MSG. `MUST` `NEW`
- **VOEQ-VEND-010** Analytics (views, messages, followers, trend). `MUST` `LEGACY-PRESERVED`
- **VOEQ-VEND-011** Settings (profile, hours, socials, account). `MUST` `LEGACY-PRESERVED`

## Messaging (MSG) — first-class product area
- **VOEQ-MSG-001** Conversation creation (exactly one thread per shopper–vendor pair). `MUST` `LEGACY-PRESERVED`
- **VOEQ-MSG-002** Conversation list (for shopper and for vendor). `MUST` `NEW`
- **VOEQ-MSG-003** Conversation view (thread). `MUST` `NEW`
- **VOEQ-MSG-004** Sending (text; rich media `LATER`). `MUST` `NEW`
- **VOEQ-MSG-005** Receiving (participant-only). `MUST` `NEW`
- **VOEQ-MSG-006** Read/unread (recipient marks read on view). `MUST` `NEW`
- **VOEQ-MSG-007** Notifications (new message). `MUST` `NEW`
- **VOEQ-MSG-008** Realtime delivery (where appropriate). `MUST` `LEGACY-PRESERVED` (capability)
- **VOEQ-MSG-009** Retry / failure states (network unreliable on campuses). `MUST` `NEW`
- **VOEQ-MSG-010** Reconnection (session drop recovery). `MUST` `NEW`
- **VOEQ-MSG-011** Message states (sending / sent / delivered / read / failed). `MUST` `NEW`
- **VOEQ-MSG-012** Blocking / reporting from conversation. `SHOULD` `NEW` (report = legacy; block `OPEN`)
- **VOEQ-MSG-013** Mobile behavior (responsive chat, bottom-nav). `MUST` `NEW`
- **VOEQ-MSG-014** Desktop behavior (two-pane chat). `MUST` `NEW`
- **VOEQ-MSG-015** Conversation lifecycle (archive/hide, reopen). `SHOULD` `NEW`

## Trust (TRUST)
- **VOEQ-TRUST-001** Verification (staff-confirmed real campus presence + genuine identity). `MUST`
  `REDESIGNED`
- **VOEQ-TRUST-002** Ratings (derived from visible reviews; one review per shopper–vendor). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-TRUST-003** Reviews (vendor-scoped; listing-scoped `LATER`). `MUST` `LEGACY-PRESERVED`
- **VOEQ-TRUST-004** Review editing (≤24h window). `MUST` `LEGACY-PRESERVED`
- **VOEQ-TRUST-005** Vendor responses (one per review, editable ≤24h). `MUST` `LEGACY-PRESERVED`
- **VOEQ-TRUST-006** Reporting (categories: not-on-campus, scam, inappropriate, impersonation,
  harassment, other). `MUST` `LEGACY-PRESERVED`
- **VOEQ-TRUST-007** Trust signals (verified, rating, responsiveness, open-now, badges, report
  health). `MUST` `DECIDED`
- **VOEQ-TRUST-008** Responsiveness (derived from native-messaging reply latency). `MUST` `NEW`
  (replaces implicit assumption; now measurable)
- **VOEQ-TRUST-009** Badges (earned: newcomer, active, quick-responder, rising-star, top-rated,
  community-pillar, multi-talented). `MUST` `LEGACY-PRESERVED`
- **VOEQ-TRUST-010** Trust score (internal ranking; public shows discrete signals). `SHOULD`
  `LEGACY-PRESERVED` (re-derive)
- **VOEQ-TRUST-011** Disputes (shopper↔vendor). `MUST` `LEGACY-PRESERVED`

## Staff (STAFF)
- **VOEQ-STAFF-001** Moderator — `OPEN` (retain distinct scoped role vs fold into Admin). `MUST?`
  `OPEN`
- **VOEQ-STAFF-002** Admin (broad management, no staff-management/erasure). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-003** Super Admin (all capabilities). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-004** Moderation queue (reports/reviews/listings to action). `MUST` `NEW` (legacy had
  no moderator UI)
- **VOEQ-STAFF-005** Report handling. `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-006** Vendor verification action (set/clear verified). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-007** User management (suspend / ban; enforcement `OPEN`). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-008** Listing moderation. `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-009** Audit log. `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-010** Analytics (platform). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-011** Staff permissions (capability matrix). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-012** Staff invite flow (super_admin → invite). `SHOULD` `NEW` (legacy = DB-seed only)
- **VOEQ-STAFF-013** Impersonation-assisted support (audited, super_admin-guarded). `SHOULD`
  `LEGACY-PRESERVED`
- **VOEQ-STAFF-014** Featured placement (timed). `SHOULD` `LEGACY-PRESERVED`
- **VOEQ-STAFF-015** Institutions / Campuses management. `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-016** Categories management (official taxonomy). `MUST` `NEW` (official-only proposed)
- **VOEQ-STAFF-017** Agreements management (versioned TOS/Privacy/Vendor). `MUST` `LEGACY-PRESERVED`
- **VOEQ-STAFF-018** Press management. `LATER` `LEGACY-PRESERVED`

## Discovery / Search (DISC) — cross-cutting, detailed in §8
- **VOEQ-DISC-001** Search (free-text over listing title/desc + vendor name). `MUST` `LEGACY-PRESERVED`
- **VOEQ-DISC-002** Filtering (campus, category, price, rating, verified, featured). `MUST`
  `LEGACY-PRESERVED`
- **VOEQ-DISC-003** Sorting (newest, price asc/desc, rating, popularity). `MUST` `LEGACY-PRESERVED`
- **VOEQ-DISC-004** Campus scope (default = shopper campus; switchable). `MUST` `LEGACY-PRESERVED`
- **VOEQ-DISC-005** Category scope (official taxonomy; user categories `OPEN`). `MUST` `PROPOSED`
- **VOEQ-DISC-006** Vendor discovery (browse vendors; by category/campus). `MUST` `LEGACY-PRESERVED`
- **VOEQ-DISC-007** Listing discovery (browse listings). `MUST` `LEGACY-PRESERVED`
- **VOEQ-DISC-008** Trending (weighted: recency + rating + campus, **not** raw views). `MUST`
  `REDESIGNED`
- **VOEQ-DISC-009** Recency (new vendors / new listings surfacing). `MUST` `NEW`
- **VOEQ-DISC-010** Relevance (search result ranking). `SHOULD` `NEW`

## Notifications (NOTIF)
- **VOEQ-NOTIF-001** In-app notifications. `MUST` `LEGACY-PRESERVED`
- **VOEQ-NOTIF-002** Realtime events (new message, presence). `MUST` `LEGACY-PRESERVED`
- **VOEQ-NOTIF-003** Email notifications (which events). `SHOULD` `LEGACY-PRESERVED`
- **VOEQ-NOTIF-004** Push notifications. `LATER` `NEW`

## Future (FUT) — Phase 2+, awareness only
- **VOEQ-FUT-001** Paystack escrow / checkout. `LATER` `NEW` (per founder Phase 2)
- **VOEQ-FUT-002** Logistics / fulfillment. `LATER` `NEW`
- **VOEQ-FUT-003** Multi-institution expansion. `LATER` `DECIDED` (architected for)
- **VOEQ-FUT-004** Listing-scoped reviews. `LATER` `OPEN`
- **VOEQ-FUT-005** Rich messaging (attachments, edit/delete, typing). `LATER` `NEW`
- **VOEQ-FUT-006** Monetization mechanics. `LATER` `OPEN`

## Removed (REMOVED) — must NOT reappear
- **VOEQ-REM-001** WhatsApp as core communication. `REMOVED` `DECIDED`
- **VOEQ-REM-002** Events. `REMOVED` `DECIDED`
- **VOEQ-REM-003** Housing. `REMOVED` `DECIDED`
- **VOEQ-REM-004** Waybill. `REMOVED` `DECIDED`
- **VOEQ-REM-005** Legacy 3 unauthenticated privileged endpoints. `REMOVED` `DECIDED`
- **VOEQ-REM-006** Generic "coming soon" product promises. `REMOVED` `DECIDED`
- **VOEQ-REM-007** Legacy unused/dead states (e.g. `ListingStatus.draft/paused/archived`,
  `VendorStatus.pending_review/rejected` with no confirmed transitions). `REMOVED` `DECIDED`
- **VOEQ-REM-008** "Buyer" terminology in product-facing copy/URLs. `REMOVED` `DECIDED`

---

# 2. FEATURE REQUIREMENTS (major features)

Detailed blocks for the product spine. Each is product-level; no implementation prescribed.

---

### VOEQ-IDN-001 / 002 — Registration & Login
- **Purpose:** Let a student create/sign in to an account (shopper or vendor intent).
- **User:** Prospective shopper / vendor.
- **Preconditions:** API + auth provider reachable; Google client configured; email sender configured.
- **Core behavior:** Email signup → OTP/magic-link verify (pending token required, anti-enumeration) →
  session. Google OAuth → find-or-create by email; role by `intent`. Campus/consent gates applied
  post-auth.
- **Success:** Authenticated session; post-auth redirect by role + completion state.
- **Empty state:** N/A (entry form).
- **Loading state:** Form shows submitting state; no indefinite spinners.
- **Error state:** Invalid/missing inputs → inline field errors (no raw API errors). OTP without
  pending token → reject. Rate-limited (lockout) on OTP/magic abuse.
- **Permission:** Public.
- **Edge cases:** Google user with no `agreementAcceptedAt` is **not** silently consented (forced
  consent modal). super_admin/admin Google → `/admin`. Vendor intent promotes buyer→vendor (never
  demotes staff). `.edu.ng` gating `OPEN` (§14 #4).
- **Dependencies:** IDN-003 (verification), IDN-004 (sessions), IDN-009/010 (gates), email provider.

---

### VOEQ-SHOP-003 / DISC — Shopper Discovery (browse + trending)
- **Purpose:** Help a shopper find relevant campus vendors/listings without knowing names.
- **User:** Shopper (and public visitors, pre-auth).
- **Preconditions:** Shopper has (or is shown a default) campus; vendors/listings exist and are live.
- **Core behavior:** Browse grid (category/campus); "Trending on my campus"; recently-viewed
  (deduped); followed-vendors preview. Trending **weights recency + rating + campus**, not raw view
  count.
- **Success:** Shopper sees a populated, relevant, campus-scoped set; can open any item.
- **Empty state:** "No vendors yet on {campus}" with clear CTA (browse nearby campuses / become a
  vendor). Never a blank grid.
- **Loading state:** Skeleton grid; instant-first (cache/optimistic where safe).
- **Error state:** Discovery fetch fails → retry affordance; do not show broken/empty as if
  intentional.
- **Permission:** Public for browse; personalized ("my campus") requires auth + campus set.
- **Edge cases:** New campus with zero vendors (cold start) → surface seed/founding vendors or
  explicit empty state, not fake content. View-count must **not** inflate on refresh (fix legacy
  write-on-read).
- **Dependencies:** DISC-001..008, VEND-002/004, TRUST-007.

---

### VOEQ-PUB-003 / DISC-001 — Search
- **Purpose:** Let users find a vendor/listing by name, item, or keyword.
- **User:** Public + authenticated.
- **Preconditions:** Indexed searchable content (title, description, vendor name).
- **Vendor visibility precondition (🔒 LOCKED, Doc 13 §13.4):** a vendor profile is **not publicly
  visible/searchable until** `≥1 published listing` **AND** `required Terms/consent acceptance`. Listings
  inherit this — an unpublished or consent-missing vendor does not appear in discovery. This is a product
  rule, not merely legal text.
- **Core behavior:** Free-text query → results ranked by relevance (title match > description; vendor
  name boost); respects campus scope + filters + sort.
- **Success:** Relevant results; clear facets (categories, price range).
- **Empty state:** "No results for '{q}'" + suggested categories / spelling help; never a dead end.
- **Loading state:** Debounced input; result skeleton.
- **Error state:** Search service error → graceful empty + retry; no raw error.
- **Permission:** Public.
- **Edge cases:** Very short/empty query → show browse, not error. Special characters / diacritics →
  normalized match.
- **Dependencies:** DISC-002/003/004, indexing (architecture).

---

### VOEQ-PUB-005 / VEND-002 — Public Vendor Storefront
- **Purpose:** The vendor's public face — trust signals + offerings + direct contact.
- **User:** Public + shoppers + the vendor themselves.
- **Preconditions:** Vendor `status = live`; ≥1 active listing.
- **Core behavior:** Identity (name, photo, campus, category), trust signals (verified, rating,
  responsiveness, open-now), listings grid, reviews, "Message vendor" (native), follow/save.
- **Success:** A shopper can evaluate trust and start a conversation in ≤2 taps.
- **Empty state:** Vendor with no listings → show profile + "no listings yet" + message CTA.
- **Loading state:** Skeleton; hero + trust chips first.
- **Error state:** Vendor not found / suspended / banned → appropriate public state (not a 500;
  suspended/banned should reduce or remove public visibility — enforcement `OPEN` IDN-007).
- **Permission:** Public read; vendor can manage own.
- **Edge cases:** Unverified vendor (default) → no verified badge, but still visible. Banned vendor →
  public visibility must be restricted (§IDN-007). 
- **Dependencies:** TRUST-001..009, VEND-004, MSG, SHOP-008/009.

---

### VOEQ-PUB-006 / VEND-004 — Listing Detail
- **Purpose:** Show one offering with enough to trust + act.
- **User:** Public + shoppers.
- **Preconditions:** Listing `status=active`, `deletedAt=null`, vendor `live`.
- **Core behavior:** Photos, price range (min required), description, category breadcrumb, vendor link,
  save/follow/message/review-entry, share.
- **Success:** Shopper understands the offering and can message the vendor or save it.
- **Empty state:** N/A (single object).
- **Loading state:** Photo + title skeleton.
- **Error state:** Not found / unavailable → public "unavailable" state, not error page.
- **Permission:** Public read.
- **Edge cases:** Listing soft-deleted or vendor not-live → must not appear in browse; detail returns
  unavailable. View count increments once per window (fix legacy inflation).
- **Dependencies:** VEND-004, TRUST, MSG, SHOP-006.

---

### VOEQ-MSG-001..015 — Native Messaging (first-class)
- **Purpose:** Let shoppers and vendors communicate *inside Voeq* — the core connection mechanism
  replacing WhatsApp.
- **User:** Authenticated shopper ↔ authenticated vendor.
- **Preconditions:** Both participants authenticated; one conversation per pair (upsert on first
  message).
- **Core behavior:**
  - Create: first message from either side opens the single shared thread.
  - List: shows threads with last message, unread count, participant,时间戳.
  - View: full thread, messages grouped by sender; own on one side.
  - Send: text; states sending → sent → delivered → read.
  - Receive: participant-only; realtime push where available.
  - Read/unread: recipient marks read on view; sender sees read state.
  - Retry/failure: on send failure (network), message enters `failed` with retry affordance; never
    silently lost.
  - Reconnection: on drop, client re-establishes session and reconciles pending/out-of-order messages.
  - Notifications: new-message in-app (+ realtime where appropriate; email `SHOULD`).
  - Mobile: responsive single-pane chat, bottom-nav accessible; Desktop: two-pane (list + thread).
  - Lifecycle: archive/hide; reopen from archive.
- **Success:** A shopper messages a vendor and gets a reply without leaving Voeq; failures are
  recoverable; read state is accurate.
- **Empty state:** "No conversations yet" + prompt to message a vendor from a storefront.
- **Loading state:** Thread skeleton; optimistic send (message appears immediately in `sending`).
- **Error state:** Send fails → `failed` state + retry; thread load fails → retry; no data loss.
- **Permission:** Authenticated only; participant-only access to a thread.
- **Edge cases:** Offline compose → queue, send on reconnect. Participant removed/banned → thread
  access handled gracefully. One-thread-per-pair enforced (no thread sprawl). Blocking `OPEN`
  (MSG-012). Reporting a vendor reachable from thread.
- **Dependencies:** IDN-004 (sessions/realtime), NOTIF, TRUST-008 (responsiveness derived from this).

---

### VOEQ-VEND-001 — Vendor Onboarding (5 steps)
- **Purpose:** Guide a new vendor to a complete, live storefront.
- **User:** New vendor (from signup intent or "Become a vendor").
- **Preconditions:** Authenticated; role promoted to vendor; agreement accepted.
- **Core behavior:** 5-step wizard (business basics → photos/listing → review → go-live; exact step
  list reconciled at build). Nav hidden during onboarding. Go-live gated on completeness (name,
  contact channel = native messaging handle, profile photo, ≥1 active listing, agreement).
- **Success:** Vendor reaches live storefront + dashboard.
- **Empty state:** Step 1 blank form.
- **Loading state:** Step transition states; progress indicator.
- **Error state:** Validation per step; cannot advance while incomplete; go-live blocked with reasons.
- **Permission:** Vendor only.
- **Edge cases:** Vendor abandons mid-flow → resume, not restart. Re-promotion idempotent.
- **Dependencies:** IDN-008, VEND-004 (listing), VEND-006 (images), MSG (contact channel replaces
  WhatsApp number).

---

### VOEQ-VEND-004 — Vendor Listing Management
- **Purpose:** Create/edit/remove offerings.
- **User:** Vendor (own listings only).
- **Preconditions:** Live vendor; authenticated.
- **Core behavior:** Create (price range min required, max optional; ≥1 category; photos) → active
  immediately (legacy default; confirm at build). Edit/soft-delete with ownership check.
- **Success:** Listing appears in discovery; edits reflected; delete hides it.
- **Empty state:** "No listings yet" + create CTA on dashboard.
- **Loading state:** Form/list skeletons.
- **Error state:** Invalid input → inline; ownership failure → denied; upload failure → retry (not
  hard fail).
- **Permission:** Vendor (own).
- **Edge cases:** Soft-delete must remove from browse; re-create reuses slug with `-N`. Image
  moderation failure → reject with reason, not silent drop.
- **Dependencies:** VEND-005 (categories), VEND-006 (images), DISC.

---

### VOEQ-TRUST-001 — Vendor Verification
- **Purpose:** A trustworthy, staff-confirmed signal that a vendor is real and campus-present.
- **User:** Staff (verifier) sets it; shoppers/vendors see it.
- **Preconditions:** Vendor exists; staff has `vendor.verify` permission.
- **Core behavior:** Staff confirms (a) real campus presence, (b) genuine identity → sets `verified`.
  Revocable. Never self-asserted.
- **Success:** Verified badge shows on storefront/discovery; contributes to trust.
- **Empty state:** Unverified is the default; no badge shown.
- **Loading/Error:** Staff action confirms with audit entry; failure → retry.
- **Permission:** Staff with `vendor.verify` only.
- **Edge cases:** Revocation on report/banned → badge cleared; audit-logged.
- **Dependencies:** STAFF-006, TRUST-007, audit (STAFF-009).

---

### VOEQ-TRUST-003 / 004 / 005 — Reviews & Responses
- **Purpose:** Shopper-authored trust signal on a vendor; vendor can respond once.
- **User:** Shopper (author); Vendor (respond); Public (read visible).
- **Preconditions:** Authenticated shopper; one review per (shopper, vendor) pair.
- **Core behavior:** Create review (rating + text). Edit ≤24h. Delete (cascades comments/likes,
  recomputes rating). Vendor responds once, editable ≤24h.
- **Success:** Review visible; rating recomputed; vendor can reply.
- **Empty state:** "No reviews yet" on storefront.
- **Loading/Error:** Submit states; validation (1–5 stars, length); duplicate → "edit instead."
- **Permission:** Shopper creates own; vendor responds to own vendor's reviews only.
- **Edge cases:** Edit window expiry → locked. Vendor response already set → reject second.
  **"Verified purchase" legacy concept REMOVED** (see §9) — no payment system exists to verify;
  native contact makes real interaction directly observable, so the proxy is unnecessary.
- **Dependencies:** TRUST-002 (rating), MSG (optional contact signal, `OPEN`), TRUST-009.

---

### VOEQ-STAFF-004 / 005 / 006 — Moderation (queue, reports, verification)
- **Purpose:** Keep the directory trustworthy via scoped staff action.
- **User:** Moderator (if retained) / Admin / Super Admin.
- **Preconditions:** Staff session with appropriate permission.
- **Core behavior:** Reports surface in a queue; staff reviews vendor/listing/review/report; can verify
  vendors, moderate content, suspend/ban users (per role authority). Every action audit-logged.
- **Success:** Reported content actioned; verified vendors confirmed; audit trail complete.
- **Empty state:** "No open reports."
- **Loading/Error:** Queue skeleton; action confirms with audit.
- **Permission:** Capability-matrix gated (see §10).
- **Edge cases:** Moderator cannot act on staff; admin cannot act on super_admin; impersonation cannot
  target super_admin. **Moderator role shape is `OPEN`** (retain vs fold).
- **Dependencies:** STAFF-011 (permissions), STAFF-009 (audit), TRUST-001, TRUST-006.

---

# 3. CORE USER JOURNEYS (requirements)

## Shopper
1. **Discover** — lands on public discovery / shared link → sees campus-scoped vendors/listings.
2. **Understand** — opens storefront/listing → reads trust signals, reviews, open-now.
3. **Trust** — evaluates verified/rating/responsiveness; reads reviews.
4. **Message** — taps "Message vendor" → native conversation opens (auth required; if not signed in,
   sent to registration with return intent).
5. **Continue conversation** — replies arrive (realtime/in-app); read states accurate; failures
   retryable; returns via notification.
- **Failure paths:** not-authed message → register then resume; send fails → retry; vendor unverified
  → still contactable but unbadged; campus empty → explicit empty state.

## Vendor
1. **Register** — signs up with vendor intent (or "Become a vendor" from shopper).
2. **Onboard** — 5-step wizard → live storefront.
3. **Establish storefront** — profile, hours, photo, categories.
4. **Create listings** — add offerings with photos + price range.
5. **Become discoverable** — listings go live; appears in browse/search/trending.
6. **Communicate** — receives + replies to shopper messages natively (responsiveness tracked).
7. **Manage business** — edit listings, respond to reviews, watch analytics, earn badges.
- **Failure paths:** incomplete go-live blocked with reasons; image-moderation reject → reason +
  retry; abandoned onboarding → resume; banned/suspended → storefront visibility restricted (`OPEN`).

## Staff
1. **Review** — sees reports/queues.
2. **Moderate** — actions content/vendors within authority.
3. **Verify** — confirms real campus vendors.
4. **Intervene** — suspends/bans abusive accounts; clears/revokes verification.
5. **Audit** — every action logged; can trace who did what.
- **Failure paths:** unauthorized action → denied (capability matrix); moderator hitting staff →
  blocked; action on super_admin → blocked; audit gap → unacceptable (every action must log).

---

# 4. PAGE / EXPERIENCE INVENTORY

Groups: PUBLIC · AUTH · ONBOARDING · SHOPPER · VENDOR · MESSAGING · STAFF · SYSTEM.
"Required?" = Phase 1. Not a copy of legacy routes — re-expressed from requirements.

### PUBLIC
| Experience | User | Purpose | Req? | Pub/Priv | Major functionality | Deps |
|---|---|---|---|---|---|---|
| Landing | All | Hero + entry to discovery | Yes | Public | Campus context, background phenomenon (design-phase), CTAs | DISC, PUB |
| Discovery | All | Browse campus vendors/listings | Yes | Public | Grid, trending-on-campus, recently-viewed, followed preview | DISC |
| Search results | All | Query results | Yes | Public | Results + facets + sort | DISC-001..003 |
| Category page | All | Listings/vendors by category | Yes | Public | Filtered browse | DISC-005 |
| Vendor storefront | All | Vendor public face | Yes | Public | Trust signals, listings, message, follow | VEND-002, TRUST |
| Listing detail | All | One offering | Yes | Public | Photos, price, message, save | VEND-004 |
| About | All | What Voeq is | Yes | Public | Static | — |
| Terms | All | TOS | Yes | Public | Versioned doc | STAFF-017 |
| Privacy | All | Privacy policy | Yes | Public | Versioned doc | STAFF-017 |
| Help | All | How-to / FAQ | Should | Public | Static + contact | — |
| For-Vendors | All | Recruit vendors | Should | Public | Value prop + CTA | VEND-001 |
| Press | All | Announcements | Later | Public | List | STAFF-018 |

### AUTH
| Experience | User | Purpose | Req? | Priv | Major | Deps |
|---|---|---|---|---|---|---|
| Sign in | Prospect | Login | Yes | Public | Email OTP/magic, Google | IDN-002,003,004 |
| Sign up | Prospect | Register | Yes | Public | Intent, verify | IDN-001,003 |
| Verify OTP | Prospect | Confirm email | Yes | Public | Pending-token gated | IDN-003 |
| Forgot/reset password | User | Recover | Yes | Public | Email flow | IDN-005 |
| Consent gate | Auth user | TOS/Privacy | Yes | Private | Forced modal | IDN-009 |
| Campus select gate | Auth user | Default campus | Yes | Private | Modal | IDN-010 |
| Logout | User | Sign out | Yes | Private | Current / all | IDN-006 |

### ONBOARDING
| Experience | User | Purpose | Req? | Priv | Major | Deps |
|---|---|---|---|---|---|---|
| Shopper onboarding | Shopper | Feed interests | Yes | Private | Pref capture | SHOP-001 |
| Vendor onboarding | Vendor | 5-step → live | Yes | Private | Wizard, go-live gate | VEND-001 |

### SHOPPER
| Experience | User | Purpose | Req? | Priv | Major | Deps |
|---|---|---|---|---|---|---|
| Shopper home/dashboard | Shopper | Personalized entry | Yes | Private | Trending, saved, followed, messages preview | SHOP-003, MSG |
| Saves | Shopper | Wishlist | Yes | Private | Vendor+listing | SHOP-008 |
| Follows | Shopper | Followed vendors | Yes | Private | List | SHOP-009 |
| Reviews (mine) | Shopper | My reviews | Yes | Private | Create/edit/delete | TRUST-003 |
| Profile | Shopper | Self profile | Yes | Private | View/edit | IDN-008, SHOP-013 |
| Settings | Shopper | Prefs | Yes | Private | Notifications, account | SHOP-014 |
| Reports (mine) | Shopper | My reports | Yes | Private | Status | TRUST-006 |

### VENDOR
| Experience | User | Purpose | Req? | Priv | Major | Deps |
|---|---|---|---|---|---|---|
| Vendor dashboard | Vendor | Business overview | Yes | Private | Trend, listings, reviews, messages | VEND-010 |
| Listings manage | Vendor | CRUD | Yes | Private | Create/edit/delete | VEND-004 |
| Storefront manage | Vendor | Profile/hours/photo | Yes | Private | Edit | VEND-002/003/007 |
| Analytics | Vendor | Views/messages/followers | Yes | Private | Charts | VEND-010 |
| Reviews (respond) | Vendor | Reply to reviews | Yes | Private | One response | TRUST-005 |
| Settings | Vendor | Account/socials | Yes | Private | Edit | VEND-011 |

### MESSAGING
| Experience | User | Purpose | Req? | Priv | Major | Deps |
|---|---|---|---|---|---|---|
| Conversation list | Auth | All threads | Yes | Private | List + unread | MSG-002 |
| Conversation view | Auth | Thread | Yes | Private | Send/receive/read | MSG-003..011 |
| (Mobile) | Auth | Chat on phone | Yes | Private | Single-pane, bottom-nav | MSG-013 |
| (Desktop) | Auth | Chat on desktop | Yes | Private | Two-pane | MSG-014 |

### STAFF
| Experience | User | Purpose | Req? | Priv | Major | Deps |
|---|---|---|---|---|---|---|
| Moderation queue | Mod/Admin/SA | Reports to action | Yes | Private | Queue | STAFF-004 |
| Vendor management | Admin/SA | Verify/suspend | Yes | Private | Table + actions | STAFF-006/007 |
| User management | Admin/SA | Suspend/ban | Yes | Private | Table | STAFF-007 |
| Listing moderation | Mod/Admin/SA | Moderate | Yes | Private | Table | STAFF-008 |
| Audit | Admin/SA | Trace actions | Yes | Private | Log | STAFF-009 |
| Analytics | Admin/SA | Platform | Yes | Private | Dash | STAFF-010 |
| Categories mgmt | Admin/SA | Official taxonomy | Yes | Private | CRUD | STAFF-016 |
| Campuses mgmt | Admin/SA | Institutions | Yes | Private | CRUD | STAFF-015 |
| Agreements mgmt | Admin/SA | Versioned docs | Yes | Private | CRUD | STAFF-017 |
| Featured | Admin/SA | Placement | Should | Private | Timed | STAFF-014 |
| Impersonation | Admin/SA | Support | Should | Private | Audited | STAFF-013 |
| Staff invite | SA | Add staff | Should | Private | Invite | STAFF-012 |
| Press mgmt | Admin/SA | Announcements | Later | Private | CRUD | STAFF-018 |

### SYSTEM
| Experience | Purpose | Req? | Major | Deps |
|---|---|---|---|---|
| Email sending (OTP, notifications) | Deliver | Yes | IDN-003, NOTIF-003 | — |
| Image moderation (upload pipeline) | Safety | Yes | VEND-006 | — |
| Realtime gateway | Live msg/presence | Yes | MSG-008 | — |
| Analytics event stream | Signals | Yes | VEND-010, DISC | — |
| Audit logging | Accountability | Yes | STAFF-009 | — |

---

# 5. REQUIREMENT DEPENDENCIES (order)

Determined from the product, not assumed:

```
Institutions/Campuses + Categories (seed, staff)
        ↓
Identity (register/login/verify/sessions) + Consent + Campus gate + .edu.ng gate
        ↓
Role handling (shopper / vendor / staff)
        ↓
Shopper onboarding (feed prefs)  ──┐
        ↓                           │
Vendor onboarding (5-step)         │
        ↓                           │
Vendor storefront + Listings + Images + Availability
        ↓
Public discovery (browse/search/category) + Trending (weighted) + Recently-viewed
        ↓
Trust: Reviews + Ratings + Verification + Badges + Responsiveness
        ↓
Native Messaging (depends on Identity sessions + Trust responsiveness)
        ↓
Notifications (in-app/realtime/email)  ── depends on Messaging + Trust
        ↓
Shopper experience (dashboard/saves/follows) + Vendor experience (dashboard/analytics)
        ↓
Staff (moderation/verify/audit/analytics)  ── depends on all above
        ↓
Legal/public pages + For-Vendors  (can parallel early)
        ↓
Polish/perf/a11y  (separate build)
```

Note: Discovery depends on Vendor/Listings existing; Messaging depends on Identity (sessions) +
Trust (responsiveness). Staff is last because it governs everything below it.

---

# 6. STATES

Recommended model. Legacy dead states are **not** carried. `PROPOSED` marks recommendations.

## Account / Person
- **New** — registered, pre-consent. Gate: consent + campus + (shopper) feed prefs.
- **Active** — consented, campus set, in normal use.
- **Unverified email** — email not yet confirmed (email signups); Google = pre-verified.
- **Suspended** — staff action; `OPEN`: must block normal app use (legacy only blocked admin). `PROPOSED: enforce on normal app.`
- **Banned** — staff action; `OPEN`: must block normal app + revoke public vendor visibility. `PROPOSED: enforce broadly.`
- **Deleted** — soft-delete (logical). `PROPOSED: self-serve delete with confirmation; staff can erase (super_admin).`

## Vendor
- **Pending / Incomplete** — created, onboarding not finished. Not publicly discoverable.
- **Live** — complete + go-live passed. Public + discoverable.
- **Inactive** — `PROPOSED: replace legacy pending_review/rejected dead states with a single
  "incomplete/live" + staff "suspended"`. Suspended vendor → public visibility restricted.
- (Legacy `pending_review` / `rejected` with no confirmed transitions → **REMOVED**, REM-007.)

## Listing
- **Active** — visible, vendor live.
- **Unavailable** — vendor not-live / soft-deleted → not in browse; detail shows unavailable.
- **Removed** — soft-deleted (logical). Not recoverable by shopper; vendor can recreate (slug `-N`).
- (Legacy `draft`/`paused`/`archived` with no confirmed transitions → **REMOVED** unless a real
  product need is confirmed; carry only the *need*, REM-007.)

## Conversation / Message
- **Conversation: empty** — no messages yet (rare; thread created on first message).
- **Conversation: active** — has messages; participant can post.
- **Message: sending** — optimistic, pre-ack.
- **Message: sent** — accepted by server.
- **Message: delivered** — received by recipient client (where realtime available).
- **Message: read** — recipient viewed.
- **Message: failed** — send rejected/timeout → retry affordance; never silently dropped.

## Report / Dispute
- **Report: open** — submitted, in queue.
- **Report: resolved** — actioned or dismissed; audit-logged.

## Simplified recommendation (PROPOSED)
Collapse legacy's many enums into: Account {active, suspended, banned}; Vendor {incomplete, live,
suspended}; Listing {active, removed}; Message {sending, sent, delivered, read, failed}; Report
{open, resolved}. Drop `ListingStatus.draft/paused/archived`, `VendorStatus.pending_review/rejected`
unless a concrete product need is approved.

---

# 7. NOTIFICATIONS

Separated by channel. No implementation decided.

### In-app (MUST, NOTIF-001)
- New message (shopper↔vendor)
- New review (vendor)
- New follower (vendor)
- Report status update (reporter)
- Vendor verified / verification revoked (vendor)
- Listing moderation result (vendor)
- Account suspended/banned notice (user)

### Realtime events (MUST, NOTIF-002)
- Incoming message (realtime delivery)
- Presence / typing (where shipped; basic presence Phase 1, rich later)
- Unread count update

### Email (SHOULD, NOTIF-003)
- OTP / magic-link (auth)
- New review (vendor) — digest optional
- New follower (vendor) — digest optional
- Account suspended/banned (user)
- (No marketing email in Phase 1.)

### Push (LATER, NOTIF-004)
- Deferred to post-launch; architected for, not built.

---

# 8. SEARCH & DISCOVERY REQUIREMENTS

- **Search (DISC-001):** free-text over listing title + description + vendor name; case-insensitive;
  relevance-ranked (title > description; vendor-name boost). Debounced; public.
- **Filtering (DISC-002):** campus, category, price (min/max), min rating, verified-only, featured.
  Combinable. Public.
- **Sorting (DISC-003):** newest, price asc, price desc, rating (vendor avg), popularity. Public.
- **Campus scope (DISC-004):** default = shopper's campus; switchable (shopper can browse other
  campuses). Discovery surfaces are campus-scoped by default. NMU pilot but model multi-campus.
- **Category scope (DISC-005):** official taxonomy (parent/child). **PROPOSED: official-only in Phase
  1** (curated quality); user-submitted categories `OPEN`. Staff-managed (STAFF-016).
- **Vendor discovery (DISC-006):** browse vendors by category/campus; vendor cards with trust signals.
- **Listing discovery (DISC-007):** browse listings grid.
- **Trending (DISC-008):** **REDESIGNED — not raw view count.** Weight = recency + rating + campus
  relevance + (optionally) engagement. Must not be gameable by refresh inflation (fix legacy
  write-on-read view counting). 
- **Recency (DISC-009):** surface new vendors / new listings ("New on {campus}").
- **Relevance (DISC-010):** search ranking; later add personalization by feed prefs.

**Anti-pattern explicitly avoided:** legacy `trending = raw 7-day view events` with no rating/recency
weighting. That is insufficient and is replaced.

---

# 9. TRUST & REVIEW REQUIREMENTS

- **Verification (TRUST-001):** staff-confirmed real campus presence + genuine identity. Set/clear by
  staff with `vendor.verify`. Never self-asserted. Revocable; audit-logged.
- **Reviews (TRUST-003):** vendor-scoped; one per (shopper, vendor). Visible-status filtered for
  public. Listing-scoped = `LATER` (FUT-004, `OPEN`).
- **Ratings (TRUST-002):** average of visible reviews; recomputed on create/edit/delete; 0 if none.
- **Review editing (TRUST-004):** editable ≤24h only; then locked.
- **Vendor responses (TRUST-005):** exactly one per review; editable ≤24h.
- **Reporting (TRUST-006):** categories (not-on-campus, scam, inappropriate, impersonation,
  harassment, other); opens a report; feeds moderation.
- **Trust signals (TRUST-007):** verified badge (highest), rating, responsiveness, open-now, badges,
  report health. Public surface leads with **discrete, understandable signals**, not a cryptic score.
- **Responsiveness (TRUST-008):** **NEW** — derived from native-messaging reply latency (now
  measurable because contact is in-app, replacing the legacy implicit assumption). Powers a "responds
  in ~Xh" signal.

### Removal of "verified purchase" (explicit)
Legacy derived `isVerifiedPurchase` from a **WhatsApp click within 30 days**. With WhatsApp removed
and **no payment system**, this signal is invalid. **PROPOSED / OPEN:**
- **Recommendation:** **remove the "verified purchase" concept entirely.** It was a proxy for "real
  interaction" that only existed because contact happened off-platform. Native messaging makes real
  interaction directly observable, so the proxy is unnecessary.
- **If a contact-quality signal is wanted:** define "**verified contact**" = shopper has exchanged ≥1
  message with the vendor within N days (proves a real conversation happened). Exact N and whether it
  affects review weight = `OPEN` (see §15 #3). This must be decided before reviews ship.

---

# 10. STAFF REQUIREMENTS

Legacy moderator was backend-enforced but **had no web UI** (frontend/backend mismatch). The product
decision document left the moderator shape `OPEN`. Documented per role:

### Moderator — `OPEN` (retain vs fold)
- **Responsibilities:** scoped content/user moderation — user.moderate, user.ban, vendor.moderate,
  vendor.verify, listing.moderate, report.moderate, review.moderate.
- **Authority:** moderate content/vendors/reviews/reports; ban users (within canActOnUser rules).
- **Restrictions:** NO staffing powers (cannot manage admin/moderator/super_admin), NO featured/
  institution/category/press/email/settings/analytics/audit/impersonate. Cannot act on admin or
  super_admin or other moderators.
- **Escalation:** refers staffing/feature/erasure to Admin/Super Admin.
- **Decision required:** (a) retain as distinct role **with its own web console** (recommended to
  honor least-privilege), or (b) fold into Admin. Until decided, capability set above is the working
  reference; **do not rebuild the legacy mismatch** (matrix exists, UI absent).

### Admin
- **Responsibilities:** all moderator powers + vendor.feature, institution/campus/category.moderate,
  featured, press, email.send, settings.manage, analytics.view, audit.view, impersonate.
- **Authority:** platform-wide management except staff management and true erasure.
- **Restrictions:** cannot act on other admin/super_admin; cannot perform super_admin-only erasure;
  cannot impersonate super_admin.
- **Escalation:** staff-management/erasure → Super Admin.

### Super Admin
- **Responsibilities:** everything (`'*'`) — including staff management and true erasure.
- **Authority:** full platform + can erase/modify staff.
- **Restrictions:** cannot be impersonated by another admin; top of hierarchy.
- **Escalation:** none higher.

### Staff permissions model
Capability matrix (`PERMISSIONS` + `requirePermission`) is **preserved** (sound design). Every
staff-affecting route must apply a specific `requirePermission`, not a blanket admin gate (fix legacy
partial coverage). Staff accounts: **build a controlled invite flow** (super_admin → invite) — legacy
relied on DB/seed, unacceptable for production (`OPEN` build).

---

# 11. REMOVED FEATURES

Must NOT reappear (see REM-001..008 in §1):
1. **WhatsApp as core communication** — no "Chat on WhatsApp", no WhatsApp-number dependency for
   contact or for any trust signal.
2. **Events** — was a "coming soon" stub; remove entirely.
3. **Housing** — same.
4. **Waybill** — same.
5. **Legacy 3 unauthenticated privileged endpoints** (`/admin/backup/trigger`, `/cron/tick`,
   `/test/db`) — remove test; auth-gate the others.
6. **Generic "coming soon" promises** — no dead-end stubs; build only what ships.
7. **Legacy unused/dead states** — `ListingStatus.draft/paused/archived`,
   `VendorStatus.pending_review/rejected` (no confirmed transitions) — do not carry blindly.
8. **"Buyer" terminology** — use "shopper" in all product-facing copy/URLs/models-naming-in-product.

---

# 12. FUTURE FEATURES (Phase 2+, awareness only)

Do not implement or over-specify. Make Phase 1 aware without polluting it.
- **FUT-001 Paystack escrow / checkout** — founder Phase 2. Phase 1 data/IA must allow attaching a
  future order entity (shopper↔vendor↔listing) without rework. No payments built now.
- **FUT-002 Logistics / fulfillment** — Phase 2 per founder docx.
- **FUT-003 Multi-institution expansion** — architected for (campus model multi-campus); NMU-first
  launch `OPEN` (single vs multi at day 1).
- **FUT-004 Listing-scoped reviews** — `OPEN` (Phase 2).
- **FUT-005 Rich messaging** — attachments, edit/delete, typing presence beyond basics.
- **FUT-006 Monetization mechanics** — escrow fee / featured promotion; `OPEN` (Phase 2 decision).

---

# 13. ACCEPTANCE CRITERIA (product level)

A feature is complete only when it satisfies **behavior + permissions + states + edge cases** above —
not merely "the page exists."

- **Discovery:** campus-scoped; trending reflects recency+rating+campus; view count does not inflate
  on refresh; empty campus shows explicit state (not fake content).
- **Search:** returns relevant results with facets; empty query → browse; no-result → helpful state.
- **Vendor storefront:** shows trust signals + listings + native message CTA; suspended/banned vendor
  visibility restricted (once IDN-007 resolved).
- **Listing detail:** accurate price range, photos, message/save; unavailable handled gracefully.
- **Messaging:** one thread per pair; send/receive/read accurate; **failed messages retryable, never
  lost**; realtime where available; mobile + desktop both usable; participant-only access.
- **Auth:** email + Google; OTP anti-enumeration; single session across web+api (post-redesign);
  consent + campus gates enforced; `.edu.ng` rule applied per decision.
- **Vendor onboarding:** 5 steps; go-live gated on completeness; resume on abandon.
- **Verification:** only staff-set; revocable; audit-logged; never self-asserted.
- **Reviews:** one per pair; edit/respond ≤24h; rating recomputed; "verified purchase" **absent**.
- **Staff:** every action permission-gated + audit-logged; moderator (if retained) cannot touch staff
  or super_admin; impersonation cannot target super_admin.
- **Removed features:** confirmed absent from codebase + UI (WhatsApp, Events, Housing, Waybill,
  unauthenticated endpoints, "coming soon" stubs, dead states, "buyer" term).
- **No decorative ambient animation / generic cliché visuals** (per design exclusions).

---

# 14. PRODUCT REQUIREMENTS MATRIX

Stable IDs for reference by UX / Architecture / API / Testing / Build batches / QA.

| ID | Requirement | Area | Priority | Status | Source |
|----|-------------|------|----------|--------|--------|
| VOEQ-PUB-001 | Landing page | Public | MUST | DECIDED | DECIDED |
| VOEQ-PUB-002 | Public discovery | Public | MUST | DECIDED | DECIDED |
| VOEQ-PUB-003 | Public search | Public | MUST | DECIDED | DECIDED |
| VOEQ-PUB-004 | Category pages | Public | MUST | DECIDED | DECIDED |
| VOEQ-PUB-005 | Public vendor storefront | Public | MUST | DECIDED | LEGACY-PRESERVED |
| VOEQ-PUB-006 | Public listing detail | Public | MUST | DECIDED | LEGACY-PRESERVED |
| VOEQ-PUB-007 | About | Public | MUST | DECIDED | DECIDED |
| VOEQ-PUB-008 | Terms | About | MUST | DECIDED | LEGACY-PRESERVED |
| VOEQ-PUB-009 | Privacy | Public | MUST | DECIDED | LEGACY-PRESERVED |
| VOEQ-PUB-010 | Help | Public | SHOULD | DECIDED | NEW |
| VOEQ-PUB-011 | For-Vendors | Public | SHOULD | DECIDED | NEW |
| VOEQ-PUB-012 | Press/Media | Public | LATER | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-001 | Registration | Identity | MUST | REDESIGNED | REDESIGNED |
| VOEQ-IDN-002 | Login | Identity | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-003 | Email verification | Identity | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-004 | Sessions (single sign-in) | Identity | MUST | REDESIGNED | REDESIGNED |
| VOEQ-IDN-005 | Password recovery | Identity | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-006 | Logout | Identity | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-007 | Account state enforcement | Identity | MUST | REDESIGNED | REDESIGNED |
| VOEQ-IDN-008 | Role handling | Identity | MUST | REDESIGNED | REDESIGNED |
| VOEQ-IDN-009 | Consent gate | Identity | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-010 | Campus selection gate | Identity | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-IDN-011 | .edu.ng gating | Identity | MUST | DECIDED (mech OPEN) | DECIDED |
| VOEQ-SHOP-001 | Shopper onboarding | Shopper | MUST | DECIDED | DECIDED |
| VOEQ-SHOP-002 | Campus switch | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-003 | Discovery | Shopper | MUST | REDESIGNED | REDESIGNED |
| VOEQ-SHOP-004 | Search | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-005 | Filtering | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-006 | Listing interaction | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-007 | Vendor interaction | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-008 | Saves/wishlist | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-009 | Follows | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-010 | Reviews (shopper) | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-011 | Messaging (shopper) | Shopper | MUST | NEW | NEW |
| VOEQ-SHOP-012 | Notifications (shopper) | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-013 | Profile | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-014 | Settings | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-SHOP-015 | Reports (shopper) | Shopper | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-001 | Vendor onboarding (5-step) | Vendor | MUST | DECIDED | DECIDED |
| VOEQ-VEND-002 | Storefront (public) | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-003 | Vendor profile mgmt | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-004 | Listings CRUD | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-005 | Listing categories | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-006 | Images (upload+moderation) | Vendor | MUST | REDESIGNED | REDESIGNED |
| VOEQ-VEND-007 | Availability / open-now | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-008 | Reviews (respond) | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-009 | Messaging (vendor) | Vendor | MUST | NEW | NEW |
| VOEQ-VEND-010 | Analytics | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-VEND-011 | Settings | Vendor | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-MSG-001 | Conversation creation (1/pair) | Messaging | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-MSG-002 | Conversation list | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-003 | Conversation view | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-004 | Sending | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-005 | Receiving | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-006 | Read/unread | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-007 | Notifications | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-008 | Realtime | Messaging | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-MSG-009 | Retry/failure | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-010 | Reconnection | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-011 | Message states | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-012 | Block/report from chat | Messaging | SHOULD | NEW | NEW |
| VOEQ-MSG-013 | Mobile chat | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-014 | Desktop chat | Messaging | MUST | NEW | NEW |
| VOEQ-MSG-015 | Conversation lifecycle | Messaging | SHOULD | NEW | NEW |
| VOEQ-TRUST-001 | Verification (staff) | Trust | MUST | REDESIGNED | REDESIGNED |
| VOEQ-TRUST-002 | Ratings | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-003 | Reviews (vendor-scoped) | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-004 | Review editing (24h) | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-005 | Vendor responses | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-006 | Reporting | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-007 | Trust signals | Trust | MUST | DECIDED | DECIDED |
| VOEQ-TRUST-008 | Responsiveness (from msg) | Trust | MUST | NEW | NEW |
| VOEQ-TRUST-009 | Badges | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-010 | Trust score (internal) | Trust | SHOULD | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-TRUST-011 | Disputes | Trust | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-001 | Moderator | Staff | MUST? | OPEN | OPEN |
| VOEQ-STAFF-002 | Admin | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-003 | Super Admin | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-004 | Moderation queue | Staff | MUST | NEW | NEW |
| VOEQ-STAFF-005 | Report handling | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-006 | Vendor verification action | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-007 | User management | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-008 | Listing moderation | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-009 | Audit log | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-010 | Analytics | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-011 | Staff permissions matrix | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-012 | Staff invite flow | Staff | SHOULD | NEW | NEW |
| VOEQ-STAFF-013 | Impersonation support | Staff | SHOULD | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-014 | Featured placement | Staff | SHOULD | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-015 | Campuses mgmt | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-016 | Categories mgmt | Staff | MUST | NEW | NEW |
| VOEQ-STAFF-017 | Agreements mgmt | Staff | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-STAFF-018 | Press mgmt | Staff | LATER | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-001 | Search | Discovery | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-002 | Filtering | Discovery | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-003 | Sorting | Discovery | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-004 | Campus scope | Discovery | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-005 | Category scope (official) | Discovery | MUST | PROPOSED | PROPOSED |
| VOEQ-DISC-006 | Vendor discovery | Discovery | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-007 | Listing discovery | Discovery | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-DISC-008 | Trending (weighted) | Discovery | MUST | REDESIGNED | REDESIGNED |
| VOEQ-DISC-009 | Recency surfacing | Discovery | MUST | NEW | NEW |
| VOEQ-DISC-010 | Relevance ranking | Discovery | SHOULD | NEW | NEW |
| VOEQ-NOTIF-001 | In-app notifications | Notif | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-NOTIF-002 | Realtime events | Notif | MUST | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-NOTIF-003 | Email notifications | Notif | SHOULD | LEGACY-PRESERVED | LEGACY-PRESERVED |
| VOEQ-NOTIF-004 | Push notifications | Notif | LATER | NEW | NEW |
| VOEQ-FUT-001 | Paystack escrow/checkout | Future | LATER | NEW | NEW |
| VOEQ-FUT-002 | Logistics | Future | LATER | NEW | NEW |
| VOEQ-FUT-003 | Multi-institution | Future | LATER | DECIDED | DECIDED |
| VOEQ-FUT-004 | Listing-scoped reviews | Future | LATER | OPEN | OPEN |
| VOEQ-FUT-005 | Rich messaging | Future | LATER | NEW | NEW |
| VOEQ-FUT-006 | Monetization | Future | LATER | OPEN | OPEN |
| VOEQ-REM-001 | REMOVE WhatsApp core | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-002 | REMOVE Events | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-003 | REMOVE Housing | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-004 | REMOVE Waybill | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-005 | REMOVE unauth endpoints | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-006 | REMOVE "coming soon" stubs | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-007 | REMOVE dead legacy states | Removed | REMOVED | DECIDED | DECIDED |
| VOEQ-REM-008 | REMOVE "buyer" terminology | Removed | REMOVED | DECIDED | DECIDED |

---

# 15. OPEN QUESTIONS (genuine, unresolvable from current material)

1. **Moderator role** — retain as distinct scoped role (with web console) or fold into Admin? (§10,
   STAFF-001)
2. **Staff account creation** — build controlled invite flow, or accept DB/seed for Phase 1? (STAFF-012)
3. **Banned/suspended enforcement on normal app** — should shoppers/vendors be blocked from normal use
   (not just admin)? Recommend yes. (IDN-007)
4. **`.edu.ng` gating mechanism** — domain suffix? institution email list? manual campus approval?
   Non-`.edu.ng` students excluded or manually reviewed? (IDN-011)
5. **"Verified purchase" replacement** — remove entirely (recommended) or define "verified contact"
   (≥1 message in N days)? Exact N + review-weight impact? (§9, TRUST)
6. **Review scoping** — vendor-scoped only (Phase 1) or add listing-scoped (Phase 2)? (FUT-004)
7. **Categories** — official-only (Phase 1, proposed) or allow user-submitted? (DISC-005)
8. **Pre-auth messaging** — public discovery yes; messaging requires auth (proposed) — confirm. (MSG)
9. **Monetization** — free Phase 1 (proposed); confirm + decide Phase 2 model. (FUT-006)
10. **NMU-only vs multi-campus at launch** — data model supports multi; launch scope OPEN. (FUT-003)
11. **Message blocking** — include block-from-chat (MSG-012) or report-only in Phase 1? 
12. **Design values / light-vs-dark / art-directed imagery / background boldness** — design-phase
    (carried from DESIGN_HANDOFF); not a product decision but affects PUB-001 acceptance.

---

# 16. CONTRADICTIONS WITH LEGACY (explicit)

Captured so they are not silently carried:

1. **Moderator exists in backend permission matrix but has NO web UI** (legacy frontend/backend
   authorization mismatch). Product: decide shape (§10, OPEN), do not rebuild the gap.
2. **`suspended`/`banned` only enforced on admin routes** in legacy — a banned vendor could keep a
   public storefront. Product: propose enforcing on normal app (IDN-007, OPEN).
3. **"Verified purchase" derived from WhatsApp clicks** — invalid post-WhatsApp-removal and no
   payments exist. Product: remove or redefine as in-app contact (§9, OPEN).
4. **Trending = raw 7-day view count**, no rating/recency weighting, and **view count inflates on
   every refresh** (write-on-read). Product: weighted trending + deduped view counting (DISC-008,
   SHOP-003).
5. **Vendor onboarding = 4 steps (legacy) vs 5 steps (founder brief).** Product: adopt 5-step
   (VEND-001, DECIDED); reconcile exact steps at build.
6. **Cross-domain auth** (OAuth token in URL query; impersonation cookie on API domain) — fragile.
   Product: redesign for single sign-in (IDN-004, REDESIGNED).
7. **Base64-in-JSON upload** (33% inflation; 5MB cap unreachable). Product: presigned multipart
   (VEND-006, REDESIGNED).
8. **Inconsistent mobile nav** (shopper/admin bottom-tabs; vendor hamburger). Product: unify (carried
   from 01-PRODUCT_DECISIONS).
9. **Dead enum states** (`ListingStatus.draft/paused/archived`, `VendorStatus.pending_review/
   rejected`) with no confirmed transitions. Product: remove unless a real need is approved (REM-007).
10. **Framework assumptions** (Next.js/Prisma/socket.io) — not to be carried implicitly. Product:
    architecture stage chooses deliberately (01-PRODUCT_DECISIONS §8).

---

**END OF 02-PRODUCT_SCOPE_AND_REQUIREMENTS.** This is the requirements layer only. It references
`01-PRODUCT_DECISIONS.md` for beliefs and feeds UX / Architecture / API / Testing / Build / QA via the
stable IDs in §14. No architecture, database, API, UI, design-system, or implementation is specified
herein.
