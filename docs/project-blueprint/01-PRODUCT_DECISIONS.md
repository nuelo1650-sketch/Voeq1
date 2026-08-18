# 01-PRODUCT_DECISIONS.md — Voeq Rebuild

> **Status:** PRODUCT DECISIONS ONLY. Not approved. Not architecture. Not UI. Not implementation.
> **Author:** Hermes (product strategist) — based on full read of `docs/product-recovery/batch-01/`
> (11 legacy recovery docs) and the founder brief `VOEQ — PRE-EXECUTION PLANNING`.
> **Rule applied:** Where legacy documents conflict with current founder direction,
> **CURRENT FOUNDER DIRECTION WINS.** Legacy material is treated as *evidence of what existed*,
> not as a spec for what should exist.

Label convention used throughout:
`DECIDED` (locked founder decision) · `PROPOSED` (recommended, needs sign-off) ·
`OPEN` (requires founder decision) · `DEFERRED` (known, later phase) · `REMOVED` (discarded from legacy).

---

# 1. PRODUCT IDENTITY

### 1.1 What is Voeq?
**DECIDED.** Voeq is a **campus-focused discovery and marketplace platform** for Nigerian tertiary
students. Its first and primary experience is **discovery, connection, and communication** between
students and campus vendors/service providers (food, repairs, tailoring, tech support, printing,
beauty, tutoring, and similar). The pilot market is **NMU (Nigeria Maritime University, Okerenkoko)**,
with explicit intent to expand to other tertiary institutions.

### 1.2 What problem does it solve?
**DECIDED (problem framing).** Nigerian tertiary students have no reliable, *campus-specific* way to
discover trusted vendors and services near them. Discovery today is word-of-mouth, scattered WhatsApp
statuses, and physical noticeboards. Voeq collapses that into one **campus-scoped, trust-visible
directory** where a student can find who sells what, near them, and reach them directly.

### 1.3 What makes it different?
**PROPOSED (positioning, founder to confirm).** Three things, in priority order:
1. **Campus-native, not generic.** Discovery is scoped to the student's institution/campus. "Trending
   on *my* campus" is a first-class concept, not a filter bolted on.
2. **Trust made visible.** Verification, reviews, response time, and open-now status are product
   primitives — not afterthoughts. Trust is the actual product, not the transaction.
3. **Communication is core, not a button.** Native messaging is a first-class capability (see §10),
   not a "Chat on WhatsApp" exit link. The connection *happens inside Voeq.*

### 1.4 Core value proposition
**DECIDED (one line).** *Voeq is the trusted map of who sells what on your campus — and the fastest
way to reach them.* For vendors: a free, credible, campus-scoped storefront and a direct line to
students. For shoppers: near-zero-friction discovery of trusted local vendors.

---

# 2. USERS

Five participant types. Legacy had the same five; we keep the *concepts* and correct the terminology
and one structural gap.

### 2.1 Shopper — `DECIDED`
A student who discovers, saves, follows, messages, and reviews campus vendors. This role was called
**"buyer"** in the legacy system. **The legacy term "buyer" is RETIRED; the role is "Shopper."**
Everything product-facing (copy, URLs, models' naming-in-product, support docs) uses "shopper."

- Can: browse/discover, search/filter, open vendor + listing, save (wishlist), follow vendor, message
  vendor, review vendor, report vendor, manage own account + preferences.
- Cannot: own a storefront, access vendor or staff surfaces.

### 2.2 Vendor — `DECIDED`
A campus business owner (typically a student entrepreneur) with a storefront. One storefront per
person (legacy enforced this; keep it). Vendors publish listings, respond to reviews, view analytics,
and chat with shoppers.

- Onboarding: legacy used a 4-step wizard; the **founder's current brief specifies a 5-step vendor
  onboarding** (per `Voeq_Category_Listing_Resolution` docx). **DECIDED:** adopt the 5-step flow as the
  product requirement; reconcile exact steps during build planning.
- Go-live gating (legacy `canGoLive`): business name, contact channel, profile photo, ≥1 active
  listing, agreement accepted. **PROPOSED:** carry the *intent* (a vendor must be minimally complete
  before public) but re-express against native messaging (contact = in-app, not WhatsApp number).

### 2.3 Moderator — `OPEN` (legacy gap to resolve)
Legacy had a `moderator` role in the backend permission matrix (scoped content moderation:
user/vendor/listing/review/report moderation, no staffing powers) but **no web UI and no creation
flow** — a frontend/backend authorization mismatch. Two options:

- **Option A (PROPOSED):** Retain moderator as a real, scoped staff role with its own lightweight web
  console (queue of reports/reviews/listings to action). This honors the capability matrix that
  already exists and keeps admins out of routine moderation.
- **Option B:** Merge moderation into Admin and drop the separate moderator role. Simpler, but loses
  the principle of least privilege the matrix was built for.

**Founder decision required:** keep moderator as a distinct role (Option A) or fold into admin (B)?
Until then, the *capability set* from legacy is the working reference.

### 2.4 Admin — `DECIDED`
Platform staff with broad management (vendors, listings, categories, campuses, featured placements,
press, settings, analytics, impersonation-assisted support, audit) but **not** staff management or
true erasure. Obtained by assignment only (no self-serve path in legacy; keep).

### 2.5 Super Admin — `DECIDED`
Platform owner. All capabilities including staff management and erasure. Obtained by assignment only.

### 2.6 Unresolved staff decisions — `OPEN`
- How staff accounts are created/invited (legacy: DB/seed only, no UI). **PROPOSED:** build a
  controlled staff-invite flow (super_admin → invite) in Phase 1 staff work; do not rely on manual DB
  edits for production.
- Whether `suspended`/`banned` *shoppers and vendors* (not just staff) are blocked from normal app
  use. Legacy only enforced status on admin routes. **PROPOSED:** suspended/banned must block normal
  app access too (a banned vendor should not keep a public storefront). Confirm during build.

---

# 3. CORE PRODUCT LOOP

### 3.1 Shopper journey — `DECIDED (shape), OPEN (exact screens)`
1. Arrives (public landing / shared link) → picks or is shown their campus.
2. Signs up (email OTP or Google; **`.edu.ng`-gated signups per founder docx — DECIDED as intent,
   OPEN as exact mechanism**).
3. Consents to TOS/Privacy (forced, post-auth) → selects default campus → sets discovery preferences
   (feed interests) on first run.
4. Lands in shopper home: campus-aware discovery (trending on my campus, recent, followed).
5. Discovers: browses categories, searches, filters (campus, category, price, rating, verified), opens
   vendor profile / listing detail.
6. Engages: saves vendor/listing, follows vendor, **messages vendor natively**, writes a review.
7. Returns: unread messages + notifications pull them back; "trending on my campus" evolves.

### 3.2 Vendor journey — `DECIDED (shape)`
1. Signs up with vendor intent (or "Become a vendor" from a shopper account).
2. Completes 5-step onboarding → storefront created, status `live`.
3. Manages listings (create/edit, photo upload + moderation), profile, hours, settings.
4. Responds to reviews; earns trust badges; watches analytics (views, messages, followers).
5. **Communicates with interested shoppers via native messaging** (replaces legacy "WhatsApp click").
6. Grows: featured placement (staff-set), rising-star signals, repeat shoppers.

### 3.3 The loop's defining quality — `PROPOSED`
"**A trustworthy, fast, campus-native directory that feels alive.**" Aliveness comes from *real data
and real people* (live messages, new vendors, trending shifts, presence) — **not** from decorative
ambient motion. This resolves the earlier open question about "alive": **DECIDED in principle that
motion is data-driven, not decorative**; exact animation language is a design-phase decision.

---

# 4. PRODUCT PRINCIPLES

Twelve principles to govern decisions. Each is grounded in the evidence.

1. **Discovery first.** `DECIDED.` The product opens into discovery, not a login wall or a feed of
   everything. A student's first need is "what's near me," not "manage my account."
2. **Trust before transaction.** `DECIDED.` Every vendor surface leads with trust signals
   (verification, rating, response time, open-now). Trust is the product; the transaction (if any)
   is later.
3. **Campus-native.** `DECIDED.` Campus/institution is a first-class scope, not a tag. Discovery,
   trending, and identity are campus-shaped.
4. **Communication is core.** `DECIDED.` Native messaging is a first-class capability, not an exit
   link. (See §10.) "Contact the vendor" must happen inside Voeq.
5. **Fast by default.** `PROPOSED (elevated to principle).` Instant browse, no needless spinners,
   responsive on low-end Android (the dominant Nigerian student device). Performance is a feature.
6. **Simple over feature-heavy.** `DECIDED.` Phase 1 does few things extremely well. We do not ship
   half-built surfaces (the legacy Events/Housing/Waybill stubs broke trust — see §7).
7. **Honest about phase.** `DECIDED.` The product must never imply capabilities it lacks (no fake
   checkout, no fake cart, no "coming soon" dead ends). Phase 1 is a discovery + communication
   directory; say so plainly.
8. **Verified means something.** `DECIDED (policy intent).` "Verified" is a staff-confirmed signal
   with a defined meaning (§9), not a self-asserted badge.
9. **One conversation per pair.** `DECIDED (carry legacy rule).` A shopper and a vendor share exactly
   one thread; no thread sprawl. (Legacy enforced this; keep.)
10. **Respect the reader's attention.** `PROPOSED.` Notifications are meaningful (new message, new
    review, new follower, report update) — not growth-hack noise.
11. **Secure by construction.** `DECIDED.` Auth, authorization, and input validation are
    first-class; privileged actions are always gated. (Legacy had 3 unauthenticated privileged
    endpoints — those are REMOVED, see §8.)
12. **Build in visible batches.** `DECIDED.` Outside-in, vertical slices, feature batches, continuous
    verification; dev servers stay up so progress is observable (per founder build philosophy).

---

# 5. PHASE 1 (initial product — what is IN)

**DECIDED (scope intent), PROPOSED (exact screen list to confirm at build planning).**
Phase 1 is a **campus-scoped discovery + native-communication directory with NO payments.**

In scope:
- **Public shell + landing** (visual identity from the design exploration; background phenomenon per
  founder's later instruction — design-phase decision, not product).
- **Public discovery:** browse, search, category pages, campus scoping, filters (price, rating,
  verified, campus), sorting, trending/recently-viewed, "trending on my campus."
- **Vendor profile** (public storefront: identity, listings, trust signals, reviews, open-now,
  native-message entry).
- **Listing detail** (photos, price range, description, vendor link, save/follow/message/review
  entry).
- **Authentication:** email OTP + magic-link + Google OAuth; `.edu.ng` gating intent; TOS/Privacy
  forced consent; campus selection; feed-preference onboarding.
- **Shopper experience:** dashboard, saved/followed, reviews, preferences.
- **Vendor experience:** 5-step onboarding, storefront management, listings CRUD, photo upload +
  moderation, profile/hours/settings, analytics (views, messages, followers).
- **Native messaging (full):** conversations, messages, unread/read states, notifications, realtime
  where appropriate, mobile + desktop chat, message failure/retry, conversation lifecycle.
- **Trust/social:** reviews (vendor-scoped — see §14), ratings, badges, follow, save/wishlist,
  reports, disputes.
- **Staff:** Admin console (the 14 legacy areas, re-expressed) + moderator decision (§2.3). Staff
  invite flow. Audit logging. Impersonation-assisted support.
- **Legal/public pages:** About, Terms, Privacy, Vendor Agreement, Help, For-Vendors.
- **Foundational plumbing:** institutions/campuses, categories (official taxonomy), agreements
  (versioned), feature flags, analytics event stream.

Explicitly **NOT in Phase 1:** payments, checkout, escrow, cart, order management, logistics,
multi-currency, native mobile app, AI features, Events/Housing/Waybill.

---

# 6. PHASE 2 (architected for, not necessarily built initially)

**DEFERRED (intent to support, build later).**
- **Payments / escrow.** Founder's `Voeq_Complete_Documentation` docx describes a two-phase roadmap:
  Phase 1 = discovery directory (no checkout); **Phase 2 = Paystack escrow + logistics.** We design
  Phase 1 data/IA so payments can attach later (e.g., listings already carry price ranges; a future
  order entity links shopper↔vendor↔listing) **without** building it now.
- **Logistics / fulfillment** integration (Phase 2 per docx).
- **Multi-institution expansion** beyond the NMU pilot (campus model already supports this; Phase 1
  ships NMU-first but the data model must not hard-code one campus).
- **Listing-scoped reviews** (legacy is vendor-scoped only — see §14, OPEN).
- **Rich messaging** (attachments, edit/delete, typing presence beyond basics) — architected for,
  phased.

---

# 7. EXPLICIT EXCLUSIONS

**DECIDED (do not build / do not carry).** This section is mandatory and is the antidote to the
legacy "coming soon" trust erosion.

- **WhatsApp as a core contact channel — REMOVED.** No "Chat on WhatsApp" exit; no WhatsApp-number
  dependency for contact or for the "verified purchase" signal. Native messaging replaces it (§8, §10).
- **Events, Housing, Waybill — REMOVED.** Legacy shipped these as "coming soon" stubs with no
  implementation. They created expectation gaps and broke trust. **Do not carry the stubs or the
  features** unless explicitly re-proposed in a later phase with real scope.
- **Native mobile app — EXCLUDED (Phase 1).** Web-only, responsive, mobile-first. No React Native /
  native iOS/Android in Phase 1.
- **AI features — EXCLUDED.** No AI functionality in the product itself for Phase 1. (Utilities like
  image moderation are operational, not "AI features.")
- **Multi-currency — EXCLUDED.** Listings are NGN-only (Nigeria). No multi-currency in Phase 1.
- **Decorative ambient animation / generic background effects — EXCLUDED** per founder's earlier
  rejection (organic green lines, grain, gold glow, cursor-reactive). Background may be a *designed,
  subject-earned phenomenon* (campus terrain + live vendor constellation, per design exploration) but
  must never be decorative noise.
- **Generic SaaS / luxury-cliché visual treatment — EXCLUDED** (the founder rejected the
  MODERN-LUXE/CELESTIA reference class as generic).
- **Magento/Shopify-style commerce admin — EXCLUDED.** This is a discovery directory in Phase 1, not a
  full e-commerce backend.

---

# 8. LEGACY DECISIONS BEING CHANGED

| # | Legacy | New decision | Status |
|---|---|---|---|
| 1 | Role called **"buyer"** | Renamed to **"Shopper"** everywhere product-facing | `DECIDED` |
| 2 | **WhatsApp-first** contact; "Chat with Vendor via WhatsApp" | **Native messaging** is the contact channel; WhatsApp removed from core | `DECIDED` / `REMOVED` |
| 3 | "Verified purchase" derived from **WhatsApp click** within 30 days | Must be re-derived from **native in-app message contact** (no WhatsApp signal exists) | `DECIDED (principle)` / `OPEN (exact signal)` |
| 4 | **3 unauthenticated privileged endpoints** (`/admin/backup/trigger`, `/cron/tick`, `/test/db`) | **REMOVED.** Every privileged route is auth + permission gated. Test endpoint deleted. | `DECIDED` |
| 5 | **Events / Housing / Waybill** "coming soon" stubs | **REMOVED** entirely (see §7) | `DECIDED` |
| 6 | Cross-domain auth (OAuth token in URL query; impersonation cookie on API domain) | **REDESIGN required** — colocate auth or use a proper token/cookie exchange. Product requires "sign in once, stay signed in across web + api." | `DECIDED (problem)` / `OPEN (solution, architecture phase)` |
| 7 | Base64-in-JSON upload (33% inflation, unreachable 5MB cap) | **REDESIGN** — multipart + presigned uploads. Product requires real 5MB image uploads. | `DECIDED (problem)` / architecture phase |
| 8 | Inconsistent mobile nav (shopper/admin bottom-tabs; vendor hamburger) | **Unify mobile nav** across roles (one pattern). | `PROPOSED` / `DECIDED (intent)` |
| 9 | Vendor onboarding = 4 steps | Founder brief specifies **5-step** onboarding | `DECIDED` (adopt 5-step) |
| 10 | Framework assumptions (Next.js, Prisma, socket.io) carried implicitly | **NOT assumed.** Architecture stage chooses deliberately. | `DECIDED` |
| 11 | `User.drafts`, unused enum states (`ListingStatus.draft/paused/archived`, `VendorStatus.pending_review/rejected`) with no confirmed transitions | **Do not carry blindly.** Carry the *needs* (draft capability if wanted), not the dead states. | `DECIDED` |
| 12 | Reviews **vendor-scoped only** (no per-listing review entity) | **Carry as default; OPEN** whether to add listing-scoped reviews in Phase 2 (§14). | `DECIDED (default)` / `OPEN` |

Note: legacy *auth strength* (JWT + session revocation, OTP anti-enumeration, argon2, Zod at
boundaries, capability-matrix authorization) is genuinely solid — **PROPOSED: preserve the intent,
redesign implementation.** Not a "change" so much as "keep the good, rebuild the broken."

---

# 9. TRUST MODEL (product level — no implementation yet)

**DECIDED (policy), OPEN (exact weights).** "Trusted/verified vendor" must mean something specific,
not a self-asserted label.

### 9.1 Verification — `DECIDED (meaning)`
A vendor is **Verified** only when **staff have confirmed** (a) the vendor is a **real campus
presence** (operates at/around the claimed campus), and (b) the identity is **genuine** (not
impersonating a person or business). Verification is set by a staff member with `vendor.verify`
permission — never self-asserted. Unverified is the default; verification is earned and can be revoked.

### 9.2 Trust signals (the visible vocabulary) — `DECIDED (set), OPEN (computation)`
- **Verified badge** (staff-confirmed) — highest-weight signal.
- **Rating** (derived from visible reviews; one review per shopper–vendor pair).
- **Response time / responsiveness** (derived from native-messaging reply latency — replaces legacy's
  implicit assumption; now measurable since messaging is in-app).
- **Open-now** (computed from operating hours / always-open / timezone).
- **Badges** (earned: newcomer, active, quick-responder, rising-star, top-rated, community-pillar,
  multi-talented) — automated, retained from legacy intent.
- **Report health** (open reports reduce trust; see §8 legacy trust-score formula as reference, not
  gospel).

### 9.3 Trust score — `PROPOSED (carried intent, re-derive)`
Legacy derived a 0–100 trust score from verification (+5), badges (+2 each), review count, months
active, open reports (−10), suspension (−20). **PROPOSED:** keep a derived trust score as an internal
ranking signal, but make the *public* surface lead with discrete, understandable signals (verified,
rating, responds in Xh, open-now) rather than a cryptic number. Exact formula is a build-phase
decision.

### 9.4 Dispute & report — `DECIDED (carry)`
Shoppers can report vendors (categories: not-on-campus, scam, inappropriate, impersonation,
harassment, other) and open disputes. Reports feed moderation (moderator/admin). A reported/bannered
vendor must lose public visibility appropriately (ties to §2.6 banned/suspended enforcement).

---

# 10. COMMUNICATION MODEL (native messaging)

**DECIDED.** Native messaging is a **first-class product capability**, not an add-on.

### 10.1 What it must support (product requirements, from founder brief)
- Conversations (one thread per shopper–vendor pair — carry legacy rule).
- Messages (text; rich media is Phase 2, architected for).
- Unread states and read states (recipient marks read on view).
- Notifications (new message, new review, new follower, report update).
- Realtime delivery where appropriate (legacy proved socket.io works; keep the *capability*).
- Mobile chat and desktop chat (responsive; same threads).
- Message failure / retry states (network is unreliable on Nigerian campuses — this is a
  first-class requirement, not an edge case).
- Conversation lifecycle (start, archive/hide, re-open).

### 10.2 Why native, not WhatsApp — `DECIDED`
- Keeps the connection, the history, and the trust signal *inside Voeq* (a WhatsApp exit loses the
  relationship to the platform).
- Enables real-time presence, read states, failure/retry, and measurable responsiveness (which now
  powers the trust model, §9.2).
- Removes a dependency on the shopper/vendor having WhatsApp and on a foreign channel for core contact.

### 10.3 Open product questions — `OPEN`
- Guest/limited browse before auth? (Legacy required auth to message; discovery was public.) **PROPOSED:**
  discovery is public; messaging requires auth (carries legacy rule). Confirm.
- Typing indicators / presence — in Phase 1 or later? **PROPOSED:** basic presence (online/last seen)
  in Phase 1; rich presence later.
- Group/community chat — **EXCLUDED** Phase 1 (1:1 shopper↔vendor only).

---

# 11. DISCOVERY MODEL (conceptual / product level)

**DECIDED (concepts), OPEN (exact ranking).** All discovery is campus-scoped.

- **Campus / Institution:** Campuses belong to Institutions (university/polytechnic/college). A
  shopper has a default campus; discovery defaults to it. NMU is the Phase 1 pilot but the model must
  support multi-campus. `DECIDED.`
- **Categories:** A curated official taxonomy (parent/child tree). Legacy supported user categories
  too — **PROPOSED:** Phase 1 ships official categories only (curated quality > crowd taxonomy);
  revisit user-submitted categories later. `OPEN.`
- **Vendors:** The seller storefront; the unit of trust and of messaging. `DECIDED.`
- **Listings:** A specific good/service a vendor offers, with a **price range** (min required, max
  optional), photos, category. `DECIDED (carry).`
- **Search:** Free-text over listing title/description + vendor name; case-insensitive. `DECIDED
  (carry intent).` Phase 1 uses simple indexed search; advanced search is later. `OPEN (depth).`
- **Filtering:** campus, category, price (min/max), rating (min), verified-only, featured. `DECIDED
  (carry set).`
- **Sorting:** newest, price asc/desc, rating, popularity (views). `DECIDED (carry set).`
- **Discovery surfaces:** browse grid, search results, category page, "trending on my campus"
  (recency + views, campus-scoped), recently-viewed (deduped — fix legacy write-on-read inflation),
  followed-vendors feed. `DECIDED (carry intent, fix the view-count bug).`
- **"Alive" without decoration:** trending shifts, new vendors, live message presence — data-driven
  life, not motion. `DECIDED (principle, §3.3).`

---

# 12. MONETIZATION

**OPEN (no decision yet) — documented assumptions + deferral.**
- Legacy had **no monetization** (discovery directory; contact off-platform). 
- Founder docx Phase 2 mentions **Paystack escrow** — implies a future transaction take-rate is
  plausible *when payments ship*, but this is **not decided** for Phase 1.
- **PROPOSED (for founder consideration, not a decision):** Phase 1 stays free for shoppers and
  vendors (grow supply + demand); monetization attaches to Phase 2 payments (escrow fee) and/or
  optional vendor promotion (featured placement, already supported by `isFeatured`/`featuredUntil`).
- **DEFERRED:** all monetization mechanics to Phase 2 / a dedicated monetization decision.

---

# 13. PRODUCT BOUNDARIES

| Tier | Scope |
|---|---|
| **MUST HAVE (Phase 1)** | Public discovery (browse/search/category/filter/sort/trending), vendor profile, listing detail, auth (email OTP + Google, `.edu.ng` intent, consent, campus, feed prefs), shopper experience, vendor experience (5-step onboarding, listings, analytics), **native messaging (full)**, trust (verification, reviews, badges, reports, disputes), staff (admin + moderator decision), legal/public pages, foundational plumbing (campuses, categories, agreements, flags, analytics). |
| **SHOULD HAVE (Phase 1, if capacity)** | Staff invite flow (vs DB-seed), moderator web console (if role retained), basic presence/typing, "trending on my campus" refinement, responsive polish. |
| **LATER (Phase 2 / beyond)** | Payments/escrow (Paystack), logistics, multi-institution expansion, listing-scoped reviews, rich messaging (attachments, edit/delete), advanced search, user-submitted categories, monetization mechanics. |
| **NOT BUILDING** | WhatsApp core, Events/Housing/Waybill, native mobile app, AI features, multi-currency, decorative ambient animation, generic SaaS/luxury-cliché visuals, full e-commerce backend, the 3 legacy unauthenticated endpoints. |

---

# 14. OPEN DECISIONS (founder approval required)

1. **Moderator role:** retain as distinct scoped staff role with web console (Option A) or fold into
   Admin (Option B)? — §2.3
2. **Staff account creation:** build a controlled invite flow, or accept DB/seed only for Phase 1? — §2.6
3. **Banned/suspended shoppers & vendors:** should normal app access be blocked (not just admin)? — §2.6
4. **".edu.ng" gating mechanism:** exact rule (domain suffix? institution email list? manual campus
   approval?) and whether non-`.edu.ng` students are excluded or manually reviewed. — §3.1
5. **"Verified purchase" replacement signal:** derive from in-app message contact within N days?
   Different definition? — §8 #3
6. **Reviews scoped:** keep vendor-scoped only (Phase 1) or add listing-scoped reviews (Phase 2)? — §8 #12
7. **Categories:** official-only (Phase 1) vs allow user-submitted? — §11
8. **Messaging guest browsing:** public discovery yes; pre-auth messaging no (proposed) — confirm. — §10.3
9. **Monetization:** free Phase 1 (proposed); confirm and decide Phase 2 model. — §12
10. **NMU-only vs multi-campus at launch:** ship NMU-locked or allow multiple campuses from day one?
    (Data model supports multi; product launch scope is OPEN.) — §5/§6
11. **Exact green/gold/cream values, light vs dark primary, art-directed imagery direction:** design
    phase (carried from DESIGN_HANDOFF open questions).
12. **Background phenomenon:** adopt the campus-terrain + live-vendor-constellation concept (design
    exploration BG-1/BG-2) and at what boldness? Design-phase decision, flagged here for continuity.

---

# 15. PRODUCT RISKS

| # | Risk | Phase | Mitigation (product level) |
|---|---|---|---|
| 1 | **Supply-side cold start** — too few vendors → discovery feels empty → shoppers leave → vendors don't join. | Phase 1 | Seed NMU with verified founding vendors; "trending" surfaces only populated campuses; founder's pilot plan implies manual vendor recruitment. |
| 2 | **Trust erosion from fake/unverified vendors** | Phase 1 | Strict verification meaning (§9.1); easy reporting; verified-default-off; ban/suspend enforces visibility loss (§2.6). |
| 3 | **Messaging reliability on poor campus networks** | Phase 1 | Failure/retry states are a first-class requirement (§10.1), not an edge case; offline-queue mentally designed in. |
| 4 | **Phase confusion** — shoppers expect checkout that doesn't exist | Phase 1 | "Honest about phase" principle (§4 #7); no cart/checkout UI; clear "connect, don't transact yet" copy. |
| 5 | **Scope creep into Phase 2** (payments, logistics pulled early) | Phase 1 | Boundaries table (§13) is the gate; anything in LATER/NOT is a sign-off exception, not a default. |
| 6 | **Legacy staff-auth mismatch carried forward** (moderator invisible; status not enforced on normal app) | Phase 1 | Explicitly resolved in §2.3/§2.6; do not rebuild the mismatch. |
| 7 | **Discovery quality depends on ranking** (legacy trending = raw view count only) | Phase 1 | "Trending" must weight recency + rating + campus, not raw views (§11); define ranking in build. |
| 8 | **Design execution risk** — exploration to date was template-grade (see DESIGN_HANDOFF) | Phase 1 | Design phase must produce one bold, art-directed direction with real imagery, not an option board; founder to supply a hero reference. |
| 9 | **`.edu.ng` gating may block legitimate users** (part-time, non-traditional, nearby non-students) | Phase 1 | Decide mechanism (§14 #4) before auth build; allow manual review path. |
| 10 | **Single-campus pilot limits network effect evidence** | Phase 1→2 | Keep data model multi-campus; treat NMU as validated learning, not a ceiling. |

---

**END OF PRODUCT DECISIONS.** Nothing herein is approved architecture, UI, or implementation. This
document is the authoritative source for *product* decisions and supersedes conflicting legacy
assumptions where marked `DECIDED` / `REMOVED`. Architecture, design-system, and implementation
planning follow in separate documents per the build philosophy.
