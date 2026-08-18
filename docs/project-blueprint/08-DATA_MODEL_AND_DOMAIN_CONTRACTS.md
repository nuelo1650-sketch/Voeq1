# 08 — DATA MODEL & DOMAIN CONTRACTS

> **Status:** PLANNING / DOCUMENTATION ONLY. No code, no dependency install, no modification of Docs
> 01–07. **Return for founder review after writing; do NOT begin Document 09.**
>
> **Authoritative constraints:** Docs 01–07 (product LOCKED; design LOCKED; architecture Doc 07 LOCKED).
> Initial data source = shaped mock (Doc 06/07), but contracts must be shaped so the mock repository is
> later replaced by real infrastructure **without UI redesign** (Doc 07 §7.7/§7.21).
>
> **Status vocabulary used below:**
> - 🔒 **LOCKED** — product semantics fixed by Docs 01–04; the model must carry them.
> - 🟡 **PROVISIONAL** — technical representation chosen for now; may adjust in real implementation.
> - 🔲 **OPEN** — not yet decided; must not block public slices (Doc 07 §7.22).
> - ⏭ **LATER** — infrastructure concern; out of scope for first public slices.

---

## 8.1 — Purpose

Define the domain language and typed contracts behind Voeq so implementation does not rediscover product
semantics. The model is shaped to **support the locked UI**, not flatten everything into generic CRUD:

- **Storefront** exposes the hierarchy 🔒 `Identity → Trust → Business Information → Social Proof →
  Offerings → Communication` (Doc 05 B.16/C.6) as *structured* fields — not `vendor + listings[]`.
- **Listing Detail** is a 🔒 **first-class individual offering** (PG-PUB-005), modeled independently of the
  vendor page, with its own rich shape.
- **Mock↔real swap safety:** repositories return these types; the UI depends only on the types, never on
  the source (Doc 07 §7.7).

---

## 8.2 — Status legend (lifecycle states)

Each entity with a lifecycle carries an explicit `status` enum. States below are 🔒 where Docs 01–04 fix
them; 🟡 where the exact enum is provisional but the *concept* is locked.

---

## 8.3 — Identity & roles (🔒 single coherent identity, Doc 03/04)

```ts
// One identity, one session. Role is a PROPERTY of the identity, not a separate account.
interface Identity {
  id: string;                     // 🔒 LOCKED (single sign-in, Doc 03)
  handle: string;                 // unique, human-readable
  displayName: string;
  avatarUrl: string | null;       // null → ContourMonogram (Doc 05 B.6/B.11)
  campusId: string;               // 🔒 every user belongs to a campus (Doc 04)
  role: 'shopper' | 'vendor' | 'staff'; // 🔒 derived from one identity
  createdAt: string;              // ISO
  accountStatus: 'active' | 'suspended' | 'banned' | 'deleted'; // PG-AUTH-004 🔒
  // Safe recovery/linking hooks (Doc 03 LOCKED) — NOT duplicate-account auto-merge (REJECTED).
}
```
- **Shopper** = `Identity & { role:'shopper'; savedListingIds:string[]; followedVendorIds:string[] }` 🔒
- **Vendor** = distinct profile (8.4). A shopper may *also* be a vendor (same Identity, role widens) — 🔒
  single identity, not two accounts.
- **Staff** = `Identity & { role:'staff'; staffRole:'moderator'|'admin'|'super_admin' }` (Doc 04 §3.7).

// CONSENT ACCEPTANCE — 🔒 LOCKED product requirement (08b §1.3), NOT frontend-only state.
// Storage/implementation mechanism = 🔲 OPEN (Doc 09). The requirement itself is locked now.
interface ConsentAcceptance {
  id: string;
  identityId: string;                 // 🔒 FK to Identity
  termsVersion: string;               // 🔒 which TOS version was accepted
  privacyVersion: string;             // 🔒 which Privacy version was accepted
  acceptedAt: string;                 // 🔒 ISO timestamp of acceptance
  method: 'email_signup' | 'google_signup' | 're_consent'; // 🔒 acceptance context/method
  // Re-consent on Terms update is an UNDECIDED policy (Doc 09), not a storage detail.
}
---

## 8.4 — Vendor Storefront PROJECTION (the 6-layer hierarchy as a view model)

**This is a Storefront PROJECTION / view model, not six database tables.** The six layers (Identity →
Trust → Business Information → Social Proof → Offerings → Communication) are a presentation composition
assembled for PG-PUB-004 from independently-modeled domain entities (Identity, Vendor, Listing, Review,
Verification, ...). See §8.21 for the entity-vs-projection boundary. It is NOT a flat `vendor +
listings[]`: the projection carries each hierarchy layer as its own structured block so the UI composes
them per C.6 (dominant identity → trust → business → social → offerings → communication), and the stress
test (B.16) is satisfiable.

```ts
interface VendorStorefront {
  // LAYER 1 — Identity (dominant on storefront, C.2.2)
  identity: {
    id: string; name: string; handle: string;
    avatarUrl: string | null;            // null → ContourMonogram
    campusId: string;
    campusFingerprint: CampusFingerprint | null; // 🔒 REAL geo only; null if no data (A.8)
    bioShort: string; bioLong: string | null;
  };
  // LAYER 2 — Trust (PRIMARY on storefront, C.3.2 / B.16-3)
  trust: {
    verified: boolean;                   // 🔒 honest absence allowed (not faked)
    verificationTier: 'unverified'|'pending'|'verified'|'flagged'; // 🔒
    ratingAvg: number; ratingCount: number;     // derived from Reviews
    responseIndicator: 'fast'|'moderate'|'slow'|'unknown'; // 🟡
    openNow: boolean;                             // availability signal
  };
  // LAYER 3 — Business Information
  business: {
    categoryIds: string[];              // links to Category
    campusZone: string | null;          // structural campus identity (not fake map)
    joinedAt: string;
    policies: { returns: boolean; delivery: string[] } | null; // 🟡
  };
  // LAYER 4 — Social Proof
  social: {
    followerCount: number; likeCount: number;    // counts, not boxes (B.16)
    followers: Identity[];                        // optional preview list
  };
  // LAYER 5 — Offerings (the listings; see 8.5)
  offerings: Listing[];                 // 3 / 15 / 100 all supported (B.15.4)
  // LAYER 6 — Communication
  communication: {
    canMessage: boolean;                // 🔒 native, never WhatsApp exit (Doc 01/03)
    responseTimeHrs: number | null;
    relatedVendorIds: string[];         // discovery links
  };
  // Lifecycle
  status: 'draft'|'published'|'suspended'; // 🟡
}
```
- **Reviews/Activity** are *referenced*, not embedded, to avoid flattening (see 8.8/8.16).

---

## 8.5 — Listing (🔒 first-class individual offering, PG-PUB-005)

Modeled independently of the vendor page — the Listing Detail surface (editorial object, gallery, price,
availability, native message CTA) needs its own rich shape.

```ts
interface Listing {
  id: string;
  vendorId: string;                    // ownership (8.17)
  title: string;
  description: string | null;
  images: ListingImage[];              // 🔒 ≥1; B.6 frame; imperfect allowed
  price: Money;                        // 🔒 tabular display (B.2)
  currency: string;                    // 🔒 NGN initially (Doc 02)
  categoryId: string;
  availability: Availability;          // 8.15
  status: 'draft'|'active'|'sold_out'|'removed'; // 🟡
  createdAt: string; updatedAt: string;
  stats: { views: number; saves: number; likes: number }; // social proof
}
// NOTE: arrangement is NOT stored on the Listing. A presentation selector (Doc 05 C.3.1) computes
// image-led / editorial / hybrid / compact from (listingCount, content density, user intent). See §8.21.
interface ListingImage {
  id: string; url: string; alt: string;
  order: number;                       // ordering within the listing gallery
  ratio: '4:3'|'1:1'|'16:9'|'3:2';     // 🔒 B.6 tokens
  status: 'active'|'moderated'|'removed'; // 🟡 moderation/status metadata
}
// NOTE: image QUALITY is NOT a domain field. "Poor" images are a fixture/stress-test concern (B.16),
// defined in the test layer, not stored on the entity. See §8.18 / §8.21.
interface Money { amountMinor: number; currency: string; } // 🔒 integer minor units (no float)
```

---

## 8.6 — Category (🔒 Explore variant, Doc 04)

```ts
interface Category {
  id: string; slug: string;            // PG-PUB-003 route param
  name: string; parentId: string | null; // optional hierarchy
}
```

---

## 8.7 — Social: Follow / Save / Like-activity

```ts
interface Follow { followerId: string; vendorId: string; createdAt: string; }       // 🔒
interface Save   { shopperId: string; listingId: string; createdAt: string; }       // 🔒 PG-SHOP-002
interface Like   { actorId: string; targetId: string; targetType:'listing'|'vendor'; createdAt: string; } // 🔲 like-vs-activity scope
```
- These are **relationship records**, not denormalized counts. Counts (8.4 social) are *derived* for
  display; the records support the actual follow/save/like actions (C.3.4, D.2 saves).

---

## 8.8 — Reviews / Ratings (🔒 social proof, B.16)

```ts
interface Review {
  id: string; vendorId: string; authorId: string;
  rating: 1|2|3|4|5;                       // 🔒
  body: string; createdAt: string;
  status: 'published'|'hidden'|'flagged';  // 🟡 moderation
  response: string | null;                 // vendor reply
}
// ratingAvg/ratingCount on VendorStorefront.trust are DERIVED from Reviews (never stored stale).
```

---

## 8.9 — Verification (🔒 Trust layer, C.3.2)

Verification is a first-class trust concept, not a display badge faked client-side.

```ts
interface Verification {
  vendorId: string;
  tier: 'unverified'|'pending'|'verified'|'flagged'; // 🔒
  method: 'campus_email'|'id_upload'|'manual_review'; // 🔲 mechanism (Doc 09)
  verifiedAt: string | null;
}
```
- **Unverified is an honest state** (C.3.2) — the UI shows absence, never a counterfeit badge.

---

## 8.10 — Reports (🔒 moderation input, C.5.3)

```ts
interface Report {
  id: string; reporterId: string; targetType:'listing'|'vendor'|'message'|'review';
  targetId: string; reason: string; createdAt: string;
  status: 'new'|'triaged'|'actioned'|'dismissed';  // feeds Staff workbench (C.5.3)
  severity: 'low'|'medium'|'high';                 // 🔒 drives Queue ordering
}
```

---

## 8.11 — Notifications (🔒 native, panel-primary, PG-SHOP-005 PROVISIONAL panel)

```ts
interface Notification {
  id: string; recipientId: string;
  type: 'listing_new'|'vendor_trending'|'message'|'review'|'follow'|'system';
  title: string; body: string; refId: string | null;
  read: boolean; createdAt: string;
}
```

---

## 8.12 — Conversations / Messages (🔲 feature, NOT MVP — Doc 06 Slice 7)

```ts
interface Conversation { id: string; participantIds: string[]; lastMessageAt: string; }
interface Message {
  id: string; conversationId: string; senderId: string;
  body: string; createdAt: string;
  state: 'pending'|'sent'|'delivered'|'failed'; // 🔒 cause-effect motion (D.3)
}
```
- Architecturally a **normal domain**, no special centrality (Doc 07 §7.12). Transport (ws/poll) = 🔲 OPEN
  (Doc 08→11). Realtime infra = ⏭ LATER.
- **§13.M consolidation (C11):** the full messaging domain spec — conversation model (two participants,
  idempotent reuse by pair) · message lifecycle (pending→sent→delivered, failed/retry, server-assigned
  timestamps, server-validated sender) · entry points (listing/storefront/profile/inbox/notification) ·
  permissions (authenticated gating, vendor-unavailable queueing, deactivation survival) · safety (spam
  rate-limits, report, server-side content scan+sanitize, auditability) · retention/deletion (structure
  survives, identifying info anonymized, §9.17) · UI (inbox/thread/composer, mobile-first, Cream, no new
  visual language, density=Operational) — lives in **Doc 13 §13.M**. Domain shape here stays
  provider-independent (transport-agnostic); mock backend (§7.7) satisfies it, real transport plugs in at
  Phase 9 with no UI change. Attachments 🔲 OPEN (if enabled, use Cloudinary adapter §13.8).

---

## 8.13 — Staff actions / Audit records (🔒 workbench, C.5.3)

```ts
interface StaffCase {
  id: string; reportId: string | null;
  queue: string;                        // triage bucket
  evidence: Evidence[];                 // related history/context
  decision: 'warn'|'hide'|'suspend'|'escalate'|'dismiss' | null;
  consequence: string | null;           // what changed → fed back to queue
  actorId: string; createdAt: string;
}
interface AuditRecord {
  id: string; actorId: string; action: string; targetType: string; targetId: string;
  before: object | null; after: object | null; ts: string;   // 🔒 accountability
}
```
- Models `Queue → Case → Evidence → Decision → Consequence` (C.5.3) explicitly.

---

## 8.14 — Permissions / capabilities (🔒 Doc 04 §3.7 matrix; scope 🔲 OPEN)

```ts
type Capability =
  | 'listing.create' | 'listing.edit' | 'listing.remove'
  | 'vendor.message' | 'review.read' | 'review.respond'
  | 'staff.queue.view' | 'staff.case.decide' | 'staff.config' | 'staff.admin';
// Capability set derived from Identity.role (+ staffRole for staff).
// Moderator scope = subset; Super Admin guardrails apply (Doc 04 §22). Exact matrix = 🔲 OPEN (Doc 09).
```

---

## 8.15 — Availability (🔒 offering state)

```ts
interface Availability {
  inStock: boolean;
  quantity: number | null;              // null = service/infinite
  openNow: boolean;                     // campus-hours signal (Doc 04)
  availableFrom: string | null;
}
```

---

## 8.16 — Discovery / search / trending signals (🔒 behavior, 🔲 mechanism)

```ts
interface SearchQuery { text: string; categoryId?: string; campusId?: string; sort: SortKey; page: number; }
type SortKey = 'relevance'|'recent'|'price_asc'|'price_desc'|'trending'; // 🔒 UI sorts
interface TrendingSignal {
  refId: string; refType:'vendor'|'listing'; campusZone: string;
  weight: number;                       // 🔲 ranking algorithm OPEN (Doc 07 §7.11)
  // Feeds contour ActivityNode (real event only, B.11/D.5)
}
```
- Search is folded into Explore (Doc 04 CHANGE); results come from `SearchRepo` (mock now). Trending
  ranking algorithm = 🔲 OPEN; the *signal shape* is locked so the contour can consume it.

---

## 8.17 — Relationships & ownership

- `Listing.vendorId` → `VendorStorefront.identity.id` (ownership; a vendor's offerings are theirs).
- `Review.vendorId`, `Follow.vendorId`, `Save.listingId`, `Report.targetId` → FK references (mock uses
  in-memory ids; real backend enforces constraints).
- `CampusFingerprint` references `Campus` only when real geo exists (🔒 no fake geography, A.8).
- No cyclic embedding: storefront references listings by id in `offerings` (the aggregate is assembled by
  the repo, not denormalized into every record).

---

## 8.18 — Fixture requirements (public-first build)

Mock data must be **real-shaped**, not toy. Required fixtures (consumed by Doc 06 slices):

1. **Landing fixture** — real-ish activity events (≥3 trending vendors across campus zones) to drive the
   contour signature (B.11). No activity → empty contour (correct).
2. **Explore fixture** — ≥40 listings across categories/campuses for discovery + filter/sort.
3. **🔒 STOREFRONT STRESS TEST fixture (Doc 05 B.16)** — ONE vendor with:
   - **15 listings**, of which **≥5 are intentionally poor-quality source images** (deliberately
     imperfect: low-light, off-ratio, noisy) supplied by the fixture — NOT a stored domain field — to
     exercise the B.6 ugly-photo treatment.
   - `trust`: verified + rating (mixed count) + responseIndicator + openNow.
   - `social`: followerCount + likeCount populated.
   - `business`: ≥2 categories, campusZone set, bioShort + bioLong.
   - `reviews`: ≥3 (mix of rated), one with vendor `response`.
   - `communication`: canMessage true, relatedVendorIds present.
   - Mix of `availability` (in/out/soon).
   - This single fixture is the Slice 4 gate input (B.16 six criteria).
4. **Listing Detail fixture** (PG-PUB-005) — one rich listing (multi-image, price, availability, vendor
   ref, stats) for Slice 3.
5. **Auth/Shopper/Vendor/Staff fixtures** — minimal shaped records for slices 5–8 (incl. a StaffCase with
   full Queue→Case→Evidence→Decision→Consequence chain for Slice 8).

---

## 8.19 — Mock → real swap safety

- The TypeScript interfaces above ARE the contract. `packages/data` repositories return these types.
- **Mock impl:** in-memory / JSON satisfying the shapes + the §8.18 fixtures.
- **Real impl (Phase 9):** DB/API fulfilling the same interfaces. UI imports the *interface*, never the
  source → no UI rebuild.
- **Money as integer minor units** + **ISO timestamps** + **FK ids** are chosen so a real RDBMS/API maps
  cleanly (no representational rework later).
- Anything 🔲 OPEN (transport, storage, ranking) is *behind* a repository/interface boundary so its
  resolution never reaches the UI.

---

## 8.20 — Status summary (LOCKED / PROVISIONAL / OPEN / LATER)

| Domain / decision | Status |
|---|---|
| Single coherent identity (no dup-merge) | 🔒 LOCKED (Doc 03) |
| Storefront 6-layer hierarchy | 🔒 LOCKED structure (B.16/C.6) |
| Listing as first-class offering | 🔒 LOCKED (PG-PUB-005) |
| Verification (honest unverified) | 🔒 LOCKED (C.3.2) |
| Reviews/Ratings shape | 🔒 LOCKED |
| Availability / openNow | 🔒 LOCKED |
| Notifications (native, panel-primary) | 🔒 behavior / 🟡 panel vs page (PG-SHOP-005) |
| Messaging domain | 🔒 shape / 🔲 transport / ⏭ realtime infra (Slice 7, not MVP) |
| Money representation (integer minor) | 🟡 PROVISIONAL (recommended) |
| responseIndicator enum | 🟡 PROVISIONAL |
| vendor.status / listing.status enums | 🟡 PROVISIONAL |
| Trending ranking algorithm | 🔲 OPEN (mechanism) |
| Verification method | 🔲 OPEN (Doc 09) |
| Moderator capability scope | 🔲 OPEN (Doc 04 §22 / Doc 09) |
| Image storage provider | ⏭ LATER (Doc 11) |
| Realtime messaging transport | ⏭ LATER (Doc 11) |
| DB choice / API framework | ⏭ LATER (Phase 9) |

---

## 8.21 — Domain vs presentation boundary audit

The six Storefront layers are a **composition/view model**, not six required database entities. This
boundary keeps the UI architecture beautiful without designing the database around the screen.

**Domain entities (independently modeled; persist as their own tables/records):**
- `Identity` (8.3) — single coherent identity; role is a property.
- `Vendor` (profile) — name, handle, bio, campus, categoryIds, policies.
- **Vendor visibility (🔒 LOCKED, Doc 13 §13.4):** a vendor profile is publicly visible/searchable **only
  when** `listings` contains `≥1 published listing` **AND** the identity has accepted the required
  Terms/consent. This is a **derived visibility state**, not a stored flag — computed from
  `Listing.isPublished` + `Identity.consent` at read time. A vendor lacking a published listing (or with
  unaccepted consent) resolves to no public storefront.
- `Listing` (8.5) — first-class offering, owned by vendor.
- `Review` (8.8) — rating + body, references vendor/author.
- `Verification` (8.9) — trust tier + method, references vendor.
- `Report` (8.10) — moderation input.
- `Notification` (8.11) — real domain; presentation (panel/page) PROVISIONAL.
- `Conversation` / `Message` (8.12) — messaging domain (Slice 7, not MVP).
- `StaffCase` / `AuditRecord` (8.13) — staff workbench + accountability.
- `Category` (8.6), `Campus` (referenced), `Follow`/`Save`/`Like` (8.7), `Availability` (8.15),
  `TrendingSignal` (8.16), `CampusFingerprint` (real geo only), `SearchQuery` (8.16, query-side contract).

**Storefront projection (assembled for PG-PUB-004, NOT persisted as 6 tables):**
- `VendorStorefront` (8.4) = `Identity layer` + `Trust layer` (derived from Verification + Reviews) +
  `Business layer` (Vendor fields) + `Social Proof layer` (derived counts + optional follower preview) +
  `Offerings layer` (`Listing[]` by vendorId) + `Communication layer` (Vendor comms fields).
- Built by the repository/composition layer from domain entities; the UI consumes the projection, never a
  raw screen-shape.

**Presentation/selection layer (holds NO domain state):**
- **Arrangement selector** (Doc 05 C.3.1): (listingCount, content density, user intent) → image-led /
  editorial / hybrid / compact. Lives in `packages/ui` composition, NOT on `Listing` (corrected:
  `arrangementHint` removed from §8.5).
- **Image quality** is a fixture/stress-test property (B.16), NOT a `ListingImage` field (corrected:
  `quality` removed from §8.5). The fixture supplies intentionally poor images; the domain stores only
  real image metadata (id, url, order, alt, ratio, moderation status).

**Re-check of all contracts for embedded presentation concerns:**
- `responseIndicator`, `stats`, `social.followers` are *derived/display* aggregations — computed from
  domain data, acceptable as projection fields, not stored layout.
- `SearchQuery.sort` is a *query-side intent* contract, not stored entity state — acceptable.
- No other presentation-layout decision is embedded in a domain entity. ✅

## 8.22 — What Doc 08 does NOT do

- No code; interfaces are documentation of the contract, not source files.
- Does not invent product features absent from Docs 01–07 (e.g., no payments — deferred Doc 02).
- Does not resolve 🔲 OPEN / ⏭ LATER items (they are explicitly deferred).
- Does not promote messaging above its Slice-7 (feature, not MVP) place.
- Does not begin Document 09.

---

**END OF DOC 08 (Stage: data model & domain contracts). Return to founder for strict review. Do NOT proceed to Doc 09.**
