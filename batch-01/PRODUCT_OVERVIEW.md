# PRODUCT_OVERVIEW.md — Voeq (as-built recovery)

> Recovered product knowledge from the existing Voeq codebase. This document describes
> what the product **actually is and does** today, reconstructed from code, schema,
> routes, UI, and configuration. It is intentionally **investigation-only**: no
> redesign, no judgment about the future architecture. Where the implementation is
> incomplete, broken, or contradictory, that is called out explicitly.
>
> Evidence basis: `apps/api/prisma/schema.prisma`, `apps/api/src/routes/**`,
> `apps/api/src/services/**`, `apps/web/src/app/**`, `apps/web/package.json`,
> `apps/api/package.json`, `render.yaml`, `.env.example`.

---

## 1. Product identity

- **Name:** Voeq (web app at `voeq.ng`; API at `voeq.onrender.com`).
- **Apparent category:** A **multi-university campus marketplace** connecting student
  **buyers/shoppers** with **campus vendors** (local student businesses) at Nigerian
  tertiary institutions (universities, polytechnics, colleges).
- **Problem it intends to solve:** Lets students on a campus discover and contact
  nearby student-run businesses (listings, services) without leaving their campus
  community; gives those businesses a storefront, analytics, and a direct contact
  channel.
- **Intended audience:** University/polytechnic students (buyers) and student
  entrepreneurs (vendors), scoped by **campus** and **institution**.
- **Primary user types (from `UserRole` enum + UI):**
  - `buyer` — a shopping student (the "shopper" experience).
  - `vendor` — a campus business owner (storefront experience).
  - `moderator` — defined in the role enum; no dedicated moderator UI/routing
    discovered (see Maturity).
  - `admin` — platform staff (full admin console).
  - `super_admin` — platform owner (same admin console as `admin`; explicit guard
    prevents impersonating a `super_admin`).

---

## 2. Core value proposition

- **For buyers:** Browse listings filtered by campus/category, save vendors & listings,
  follow vendors, message vendors, leave reviews, and contact vendors directly via
  WhatsApp. Campus-scoped discovery ("trending on my campus") is a central feature.
- **For vendors:** Claim a storefront, publish listings with photos, get a public
  profile/landing page, view analytics (views, WhatsApp clicks, conversations),
  respond to reviews, earn trust badges, and chat with interested shoppers.
- **For platform:** Moderation, content reports, disputes, featured placements,
  impersonation-assisted support, audit logging, feature flags, and analytics.

Functional value, not marketing: the product is a **two-sided campus marketplace with
direct WhatsApp-based contact** (no in-app payments — money moves off-platform via
WhatsApp), plus a moderation/admin layer.

---

## 3. Core product concepts (entities)

All confirmed present in the Prisma schema unless noted.

| Concept | Notes |
|---|---|
| User | Account (email and/or Google), role, campus, agreement acceptance, preferences. |
| Vendor | A business storefront owned by one User. Has status lifecycle, slug, WhatsApp number, trust score, badges. |
| Listing | A product/service offered by a Vendor. Price range (min/max), photos, category, status. |
| Category | Taxonomy for listings (supports parent/child tree, official vs user categories). |
| Campus / Institution | Campuses belong to Institutions (university/polytechnic/college). Discovery is campus-scoped. |
| Review | Vendor-scoped rating + text (1–5 stars), with vendor response, comments, likes. |
| WishlistItem | Save either a Vendor or a Listing (one of the two per row). |
| Follow | A buyer following a Vendor. |
| Conversation / Message | Direct buyer↔vendor messaging (REST + realtime socket). |
| Notification | new_follower, new_review, review_response, badge_earned, new_message. |
| Report | A buyer reporting a Vendor (category: not_on_campus, scam, inappropriate, impersonation, harassment, other). |
| Dispute | Buyer↔vendor dispute against a vendor/listing. |
| VendorBadge | Gamified/earned badges (newcomer, active_seller, verified_presence, quick_responder, rising_star, top_rated, multi_talented, community_pillar). |
| EventLog | Analytics event stream (page_view, search, listing_view, vendor_view, whatsapp_click, signup*, vendor_go_live, listing_created, review_submitted, report_submitted, badge_earned, conversation_started). |
| Agreement | Versioned TOS / privacy / vendor_agreement documents. |
| AuditLog | Admin action log. |
| FeatureFlag | Runtime feature toggles (key/value JSON). |
| PressItem | Announcements / features / press / blog entries shown on a public press page. |
| Session | Persisted auth sessions (revocable; supports impersonation). |
| AuthToken | OTP + magic-link storage. |
| UserPreference | Email/notification preferences + `feedPrefsSetAt` (shopper onboarding step 3 gate). |

---

## 4. Product areas

| Area | Evidence | Status |
|---|---|---|
| Authentication | `routes/auth.ts`, `(auth)` pages (signin, signup, verify-otp, forgot/reset-password, auth-callback) | Core |
| Onboarding (shopper) | `(main)/shopper/onboarding` (step gate via `feedPrefsSetAt`) | Core |
| Onboarding (vendor) | `vendor/onboarding` steps 1–4 + `VendorChrome` hides nav during onboarding | Core |
| Buyer/shopper dashboard | `(main)/shopper/dashboard` | Core |
| Vendor dashboard | `vendor/dashboard` | Core |
| Discovery / Browse | `(main)/browse`, `(main)/search`, `(main)/home`, `(main)/following`, `(main)/wishlist` | Core |
| Listing detail | `(main)/l/[slug]` | Core |
| Vendor profile | `(main)/v/[slug]` | Core |
| Messaging | `(main)/messages`, `(main)/messages/[id]` + socket.io | Core |
| Reviews | `routes/reviews.ts`, `services/review.service.ts`, review UI on vendor profile | Core |
| Wishlist / Follow / Save | `routes/wishlist.ts`, `routes/follow.ts` | Core |
| WhatsApp contact | `routes/whatsapp.ts` (template generator) + WhatsApp button UI | Core (off-platform contact) |
| Admin console | `admin/*` (14 sub-areas) | Core |
| Moderation | Reports, Disputes, Impersonation, Audit, Feature flags | Core |
| Analytics | `routes/analytics.ts`, `routes/admin/analytics.ts`, vendor `daily` series | Core |
| Notifications | `routes/notifications.ts`, `services/notification.service.ts` | Core |
| Badges | `services/badge.service.ts`, `routes/badges.ts`, cron sync | Core |
| Agreements | `routes/agreements.ts`, `AgreementModal` gate | Core |
| Image upload + moderation | `routes/upload.ts` (Cloudinary + SightEngine) | Core |
| Trending / recently-viewed | `routes/discover.ts` | Core |
| Feature flags | `routes/admin/features.ts` | Core |
| Press / Media | `routes/press.ts`, `(public-group)/press`, `(public-group)/media` | Secondary |
| Public/legal pages | about, careers, cookies, privacy, terms, vendor-agreement, for-vendors | Secondary |
| **Events** | `(main)/events` | **Stub — "coming soon"** |
| **Housing** | `(main)/housing` | **Stub — "coming soon"** |
| **Waybill** | `(main)/waybill` | **Stub — "coming soon"** |

---

## 5. Typical user journey

### Shopper (buyer)
1. Lands on marketing/public pages or `/home`.
2. Signs up via **email+OTP** or **Google OAuth** (intent=`buyer`).
3. Forced through **AgreementModal** (TOS consent) then **CampusSelectModal**
   (pick default campus) on first run.
4. If `feedPrefsSetAt` unset, redirected to `/shopper/onboarding` (feed preferences).
5. Reaches `/shopper/dashboard`: saved/following/trending panels, recently viewed,
   my reviews, messages preview.
6. Browses `/browse` (search, category pills, sort, price/rating/verified filters),
   opens `/l/[slug]` (listing detail) or `/v/[slug]` (vendor profile).
7. Engages: saves listing/vendor, follows vendor, messages vendor (chat), writes a
   review, or taps WhatsApp to contact off-platform.
8. Post-auth role routing sends `buyer` → `/home`; `admin`/`super_admin` → `/admin`.

### Vendor
1. Signs up (email/Google, intent=`vendor`) → role set to `vendor`, Vendor row created.
2. Redirected to `/vendor/onboarding/step-1` (nav hidden during onboarding).
3. Completes 4-step wizard (business basics, photos/listing, review, go-live).
4. Once `Vendor.status = 'live'`, reaches `/vendor` dashboard: trend card (sparkline),
   per-listing table, reviews panel, open-now indicator, analytics.
5. Manages listings (`/vendor/listings`, new/edit), profile, settings, analytics.
6. Responds to reviews, views WhatsApp click analytics, earns badges.
7. Post-auth routing: `vendor` + `live` → `/vendor`; `vendor` + not live →
   `/vendor/onboarding/step-1`.

### Admin / Super admin
1. Google OAuth (role already `admin`/`super_admin`) → `/admin`.
2. Uses console: stats, institutions, campuses, categories, vendors, listings, users,
   reviews, reports, featured, analytics, system, emails, feature flags, audit,
   settings, impersonation, export, press.

---

## 6. Product boundaries (what it does NOT appear to do)

- **No payments / checkout.** Contact is via WhatsApp; there is no cart, order, or
  payment processing. (A `Dispute` model exists for post-contact disputes, but no
  transactional commerce.)
- **No in-app moderator role UI.** `moderator` exists in `UserRole` but no moderator
  routes/pages were discovered; moderation is performed inside the admin console.
- **Events / Housing / Waybill are stubs** ("coming soon") — not implemented features.
- **No native mobile app** — web only (responsive web app).
- **Reviews are vendor-scoped**, not listing-scoped. A listing detail can *link* to a
  vendor review but there is no per-listing review entity.
- **No documented AI functionality** in the product itself (though `browser-image-compression`,
  `isomorphic-dompurify`, and SightEngine image moderation exist as utilities).
- **No multi-currency** — listings default to `NGN`.

---

## 7. Current product maturity

| Area | Classification | Evidence |
|---|---|---|
| Auth (email OTP, magic link, Google, password) | **Complete** | Full route set + session revocation + rate limiting. |
| Shopper + vendor onboarding | **Complete** (gated) | 4-step vendor wizard; shopper feed-pref gate. |
| Marketplace (listings, browse, search, detail, vendor profile) | **Complete** | All routes + UI + filters + trending. |
| Messaging (REST + socket realtime) | **Complete** | `conversations.ts` + socket.io (verified realtime earlier this session). |
| Reviews (create, respond, comment, like, delete) | **Complete** | Full service + UI. |
| Wishlist / Follow / Save | **Complete** | Routes + UI buttons. |
| Admin console (14 areas) | **Complete** | All sub-routers mounted under `requireAdmin`. |
| Analytics / EventLog / trending | **Complete** | `analytics.service`, `discover`, vendor `daily`. |
| Badges | **Complete (automated)** | `badge.service` + cron sync. |
| Image upload + moderation | **Complete** | Cloudinary + SightEngine. |
| Notifications | **Complete** | Service + routes + bell UI. |
| Agreements | **Complete** | Versioned docs + consent gate. |
| Impersonation | **Complete** | Start/end with audit + super_admin guard. |
| Feature flags | **Complete** | CRUD via admin. |
| Events / Housing / Waybill | **Stub / Deferred** | Pages render "coming soon". |
| `moderator` role | **Unclear / Unused** | Enum value exists; no dedicated surface found. |
| `backup` / `export` admin routes | **Present** | `routes/backup.ts`, `routes/admin/export.ts` exist; behavior not fully traced this pass. |

**Conflicts / uncertainties requiring human review:**
- `CONFLICT` — Earlier session audit claimed "listing detail has zero engagement UI,"
  but code inspection shows `/l/[slug]` already has WhatsApp, save, message, share,
  follow, and review-entry. The claim is stale; treat the code as current truth.
- `UNKNOWN` — Whether the `moderator` role is wired to any authorization path.
- `UNKNOWN` — Exact contents/seeding of `FeatureFlag` rows and `Agreement` versions
  in production (schema + routes confirmed; seed data not inspected this pass).
- `INFERRED` — "Trending on campus" ranks by raw 7-day view events; no weighting by
  rating/recency beyond view count (inferred from `discover.ts` implementation).
