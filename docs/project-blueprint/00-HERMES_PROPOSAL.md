# 00-HERMES_PROPOSAL.md — Voeq Rebuild Proposal

> **Status:** PROPOSAL ONLY. Not approved. Nothing here is final.
> **Author:** Hermes (acting as senior product strategist, UX designer, software architect, technical advisor)
> **Basis:** Full read of `docs/product-recovery/batch-01/` (11 recovery docs) + 3 founder documents
> (`Voeq_Complete_Documentation-1.docx`, `Voeq_Category_Listing_Resolution-1.docx`,
> `NMU_Campus_Marketplace_Developer_Guide.docx`).
> **Scope of this document:** This single proposal. No other blueprint files, no code, no implementation prompts.
>
> **Legacy note (post-lock):** This proposal predates the locked redesign. Terminology here —
> "Buyer" (§57), "WhatsApp-first contact" (§73) — is **superseded**: the locked blueprint uses **Shopper**
> (not Buyer) and **native Voeq direct chat with WhatsApp REMOVED** (Docs 01–05, 13). Treat this file as
> historical intent only; the locked docs 01–13 govern.

---

# 1. YOUR UNDERSTANDING OF THE PRODUCT

**What it is.** Voeq (pronounced "Vogue", from Italian *voce* — voice) is a **campus marketplace
directory** for Nigerian tertiary students — *not* a transaction platform in its first phase.
Students discover verified campus vendors and service providers (food, repairs, tailoring, tech
support, etc.) and connect with them **directly via WhatsApp**. The platform's job is discovery and
connection, not checkout. Tagline: *"Find. Connect. Grow."* / *"Built for Campus. Built for You."*

**Who it serves.** Two sides of a two-sided marketplace:
- **Buyers/shoppers** — students looking for goods and services around their campus.
- **Vendors** — student-owned campus businesses (often solo operators: a phone repairer, a makeup
  artist, a photographer).
- **Staff** — moderators/admins who keep the directory trustworthy.

**The central problem it solves.** Nigerian university students have no reliable, campus-specific way
to discover vendors near them. Discovery today is word-of-mouth. Voeq's bet: a directory *built
around campus life*, with *verified* vendors and *direct WhatsApp connection*, solves a real,
recurring need for a well-defined first market.

**The core user experience.** A student picks their campus, browses/filters listings by category and
price, opens a vendor storefront, and taps **"Chat with Vendor via WhatsApp"** — no cart, no payment.
Vendors claim a storefront, post listings with photos, earn trust badges, and watch simple
analytics (views, WhatsApp clicks).

**What makes it valuable.** It lowers the friction of *finding* a trusted campus vendor to near zero,
and gives student entrepreneurs a free, credible storefront. Value concentrates on **trust** (verified
badges, reviews, campus-scoping) and **proximity** (campus-aware discovery, "trending on my campus").

**The defining quality of the new version — my recommendation.** The old version was *functionally
complete but operationally fragile and visually generic*. The new version's defining quality should
be **"a trustworthy, fast, campus-native directory that feels alive."** Specifically:
- **Trust made visible** (verification, reviews, badges, open-now) as the primary differentiator.
- **Speed as a feature** — instant browse, no spinners-for-spinners.
- **Campus identity** — the UI should feel like *it belongs to NMU / a specific school*, not a generic SaaS.
- **Phase-aware honesty** — Phase 1 is a discovery directory (no payments); the product must never
  over-promise checkout it doesn't have (the legacy stubs "Events/Housing/Waybill" created expectation
  gaps — see §15).

---

# 2. LEGACY ASSESSMENT

Reference: `FUNCTIONAL_SPECIFICATION.md`, `LEGACY_COMPLETENESS_AND_TECHNICAL_DEBT.md`,
`SECURITY_PERFORMANCE_AND_RELIABILITY_AUDIT.md`, `KNOWN_ISSUES_AND_FAILURES.md`.

## What worked well (preserve the *intent*)
- **The two-sided model is correct.** Buyer ↔ vendor ↔ staff roles, campus-scoping, WhatsApp-first
  contact — this is the product's spine and matches the founder's vision.
- **Core marketplace loop is proven.** Browse → listing/vendor detail → WhatsApp contact / message /
  review / save / follow is complete and coherent.
- **Realtime messaging worked** (socket.io verified delivering live this session).
- **Auth is genuinely solid** — JWT + server-side session revocation, OTP pending-token
  anti-enumeration, argon2, Zod validation at boundaries, safe error handling. This is the legacy's
  strongest layer; do not throw it away.
- **Capability-matrix authorization** (`PERMISSIONS` + `requirePermission`) is a sound design — keep it.
- **Analytics/trending/badges** approach is reasonable.

## What should be preserved (carry forward, redesign implementation)
- The entity model (Account, Vendor, Listing, Category, Institution/Campus, Review, Conversation,
  Report, Dispute, Badge, EventLog, etc.) — ~22 entities are sound *product concepts*.
- Campus-scoped discovery ("trending on my campus").
- WhatsApp-first contact (Phase 1).
- Soft-delete discipline (Account/Vendor/Listing `deletedAt`).
- Derived trust signals (rating, trust score, badges, onboarding progress).

## What should be redesigned (proven broken or weak)
- **3 unauthenticated privileged endpoints** (`POST /api/admin/backup/trigger`, `GET /api/cron/tick`,
  `GET /api/test/db`) — Critical/High security debt. Every privileged route must be auth-gated.
- **Cross-domain auth pain** — OAuth token in URL query string; impersonation cookie set on API domain
  (may be non-functional in web UI). Colocate auth or use a proper token/cookie exchange.
- **Base64-in-JSON upload** — ~33% inflation + a 1 MB global body limit that makes the advertised 5 MB
  cap unreachable. Use multipart + presigned uploads.
- **Write-on-read view counting** — inflates popularity on every refresh; de-dupe per user/window.
- **Inconsistent mobile nav** — shopper/admin use bottom tabs; vendor uses a stacked hamburger.
- **Vendor onboarding preview hidden on mobile** (`hidden lg:block`).
- **In-memory per-process rate limiter** — bypassable; centralize (Upstash) for all surfaces incl. sockets.
- **No web error boundaries**; **no external-failure retry/circuit-breaker** (uploads fail hard if
  SightEngine/Cloudinary down).
- **`conversation_started` 2-second heuristic** — return created-vs-found explicitly.

## What should be removed (legacy artifacts — confirmed in recovery docs)
- `User.drafts` (Json) — no clear producer; legacy.
- `ListingStatus.draft/paused/archived` and `VendorStatus.pending_review/rejected` — enum values with
  no confirmed app-driven transitions. Decide per product need; do not carry blindly.
- `Listing.searchVector` / `Vendor.searchVector` (tsvector) — implementation-specific; carry the *need*
  (searchable content), not the mechanism.
- The 3 unauthenticated endpoints above (backup/cron/test) — remove test; auth-gate the other two.

## What should NOT be carried into the new architecture
- **Prisma-specific schema, folder structure, API route shapes, state machines** — these are
  implementation, not requirements. The brief explicitly says: do not automatically preserve framework
  choices, folder structures, DB schema, Prisma models, API structure, state machines, UI patterns,
  bugs, or technical debt.
- The "broken code" itself — the recovery docs are the spec of *what existed*; they are not the spec of
  *what should exist*.

---

# 3. PRODUCT RECOMMENDATION

Distinguishing: **KEEP** (carry the requirement) · **CHANGE** (redo implementation) ·
**REMOVE** · **NEW** (not in legacy) · **DEFER** (roadmap, not rebuild scope).

## Core experience
A fast, trustworthy, campus-scoped directory. Buyer opens app → lands on campus-aware feed →
discovers vendors/listings → contacts via WhatsApp or in-app chat → saves/follows/reviews.

## Primary user journeys
- **Shopper:** signup (email OTP / Google) → agree TOS → pick campus → set feed prefs → browse →
  listing/vendor → WhatsApp/message/review/save/follow.
- **Vendor:** signup (intent=vendor) → 5-step onboarding (see §9 of founder doc) → live storefront →
  manage listings/analytics → respond to reviews.
- **Staff:** Google OAuth → admin console → moderate/verify/feature/audit.

## Core features (KEEP/CHANGE)
- KEEP: auth (email OTP + magic + Google), campus-scoped browse/search/trending, listing + vendor
  detail with full engagement, realtime chat, reviews (vendor-scoped), wishlist/follow, reports/
  disputes, notifications, badges, image upload + moderation, agreements gate, admin console.
- CHANGE: upload transport (multipart/presigned), view de-duplication, centralized rate limiting,
  auth-gating, cross-domain session handling, mobile nav unification, error boundaries, external
  retry.

## Secondary features (KEEP, lower priority)
- Analytics event logging, press/media pages, public/legal pages, featured placements, audit log,
  feature flags, impersonation (fixed).

## KEY NEW DECISION (from founder docs — already made, not my invention)
- **Category moves from vendor to listing.** Per `Voeq_Category_Listing_Resolution-1.docx`, a vendor
  may offer multiple things (phone repair *and* phone sales). The legacy attached category to the
  *vendor*; the corrected model attaches **category to each individual listing**, and search/filter
  queries **listings, not vendors**. This is an architectural fix already decided by the founder —
  the rebuild must implement it. (Note: the legacy Prisma already had a `ListingCategory` join, but
  search queried the vendor table — the fix is in the *query layer and onboarding*, not just schema.)
- **5-step vendor onboarding** (was 4): Basic Info → Contact & Location → Profile Photo → Listings
  (with categories) → Review → Go-live. Category removed from step 1.

## Features that should be DEFERRED (explicitly out of rebuild scope)
- **Events, Housing, Waybill** — legacy "coming soon" stubs with no backend. The founder's NMU
  isolation motivates Waybill *later*, but Phase 1 is discovery-only. Treat as roadmap, not rebuild.
  **Critically:** the old stubs created expectation gaps ("why is this here if it doesn't work?"). The
  new app should **not** ship dead "coming soon" nav entries — either build it or don't link it.
- **Phase 2 transactional pivot** (Paystack escrow, cart, checkout, logistics) — per the
  `NMU_Campus_Marketplace_Developer_Guide.docx`, this is the *January* pivot, not the October
  discovery launch. The rebuild should be **architected to allow it** (clean payment seam) but **not
  build it now**.

## Features that should potentially be REMOVED
- The `moderator` role is currently half-wired (API-enforced, web-invisible). **Decision required**
  (see §18): either implement a real moderator console or drop the tier. Do not ship a half-state.
- `User.drafts` and unused enum states (see §2).

## Potential improvements (NEW)
- **Verified-purchase signal** is currently derived only from a WhatsApp click (no payment exists).
  Acceptable for Phase 1; revisit in Phase 2.
- **Campus "feel"** — make NMU the hero campus in copy, imagery, and empty states (Phase 1 is NMU-
  focused per founder). Generic "welcome to the marketplace" is a missed opportunity.
- **Listing-level reviews** — legacy reviews are vendor-scoped. For a multi-category vendor, a buyer
  may want to review a *specific listing*. Consider listing-scoped reviews as a Phase 2 enhancement
  (keep vendor-scoped as the Phase 1 baseline to limit scope).

---

# 4. MVP / RELEASE STRATEGY

Recommended sequence for the **October discovery launch (Phase 1)**:

1. **Foundation** — repo, CI (clean `.next` before build — see §16), env management, DB (Neon),
   auth (carry the solid legacy auth), error monitoring (Sentry), logging.
2. **Authentication + Consent** — email OTP/magic/Google, agreement gate, campus select, session
   revocation. *(Reuse legacy auth strength; fix cross-domain token handling.)*
3. **Onboarding** — shopper feed-prefs; **5-step vendor onboarding** with category-on-listing.
4. **Core marketplace** — listings (with per-listing category), browse/search/trending, listing +
   vendor detail, wishlist/follow, WhatsApp contact, image upload (multipart/presigned + moderation).
5. **Engagement** — realtime chat, reviews (vendor-scoped), reports/disputes, notifications, badges.
6. **Trust & moderation** — admin console (auth-gated), verification, featured, audit log,
   impersonation (fixed), reports triage. **Fix all 3 unauthenticated endpoints here.**
7. **Analytics + polish** — EventLog, vendor dashboard, view de-duplication, mobile nav unification,
   error boundaries, performance pass.
8. **Launch hardening** — rate limiting (centralized), CORS tightening, security review, SEO/OG tags.

**Why this order:** trust and security are the product's differentiator and its biggest legacy risk, so
auth + moderation + the 3 endpoint fixes are early, not late. Browse/listing/vendor is the revenue-
less but usage-heavy core, so it comes before engagement. Phase 2 (payments) is a *separate* track
after launch, not part of this MVP.

---

# 5. ARCHITECTURE PROPOSAL

> Every choice below is a *recommendation for discussion*, not approval.

## Frontend
- **Recommendation:** Next.js (App Router) — same as legacy. Reasoning in §6.
- **Why:** SSR/SSG for SEO + fast first paint on campus networks; single framework for web + admin +
  vendor + public pages; Vercel-native.
- **Alternatives:** separate React SPA (more moving parts, worse SEO), Remix (viable, less ecosystem
  fit with Vercel here).
- **Advantages:** one deploy target, great image/perf tooling (`next/image`), route-level error
  boundaries.
- **Disadvantages:** Next build self-mutation quirk under pnpm (mitigate: clean build in CI).
- **Complexity:** Medium. **Performance:** good if SSR used correctly. **Long-term:** lowest friction
  with the existing Vercel/Neon stack.

## Backend
- **Recommendation:** A single Node/TypeScript API (Express or Fastify) — **not** Next API routes for
  the heavy logic. Keep it as a separate deployable (Render), same as legacy `apps/api`.
- **Why:** realtime (socket.io), background jobs, auth, and rate limiting are cleaner in a standalone
  service than co-mingled with Next. The legacy split (Vercel web + Render API) worked; keep it.
- **Alternatives:** Next API routes only (couples realtime/auth to Vercel limits), tRPC (nice but adds
  learning surface), NestJS (heavier).
- **Advantages:** clear boundary, independent scaling, socket.io lives naturally here.
- **Disadvantages:** two deployables to manage.
- **Complexity:** Medium. **Performance:** API on Render, web on Vercel, DB on Neon — proven topology.

## Database
- See §8.

## Authentication
- **Recommendation:** Carry the legacy model (JWT + server-side session row, OTP pending-token, argon2,
  Google OAuth) but **fix the cross-domain issues**:
  - Prefer **same-domain or subdomain-shared cookie** auth (e.g. `api.voeq.ng` + `voeq.ng` with a
    shared cookie domain) to avoid the URL-token hack.
  - If cross-domain is unavoidable, use a POST token-exchange that sets an httpOnly cookie — never a
    token in the URL query string.
- **Why:** the legacy auth *logic* is sound; only the cookie/token transport is fragile.
- **Advantages:** session revocation stays instant; no rebuild of proven logic.
- **Disadvantages:** cookie-domain setup needs care.

## API communication
- **Recommendation:** REST for resource ops (keep Zod validation at boundaries — it's good), socket.io
  for realtime chat (proven). Add a typed client.
- **CORS:** tighten — scope `no-Origin` allowance to public-only routes; pin `CORS_ORIGIN`.

## Realtime
- **Recommendation:** Keep socket.io. **Add per-event rate limiting on `message`** (legacy had none).
- **Why:** verified working; no need to switch to a heavier abstraction.

## Background jobs
- **Recommendation:** A proper scheduler for badge-sync (cron). **Auth-gate the cron endpoint** or
  trigger from the platform scheduler (Render cron / a secret header). The legacy `GET /api/cron/tick`
  was publicly callable — fix this.

## File/media storage
- **Recommendation:** Keep Cloudinary for images; **switch upload to multipart/form-data + presigned
  URLs** (or a direct Cloudinary signed-upload). Keep SightEngine moderation. Align body limits with
  the real 5 MB cap.
- **Why:** fixes the base64 bug and the unreachable 5 MB cap.

## Caching
- **Recommendation:** Redis (Upstash, already used for rate limiting) for: trending aggregates,
  recently-viewed, session lookups, feature flags. De-dupe view counts with a short rolling window
  (Redis or DB-level).

## Search
- **Recommendation:** For Phase 1 (NMU-scale, one campus pilot), **PostgreSQL full-text (or a simple
  ILIKE + trigram) is enough** — do not adopt Elasticsearch yet. Query **listings** (not vendors) by
  category. Revisit search infra when multi-campus volume demands it.

## Analytics
- **Recommendation:** EventLog (append-only) as legacy; surface aggregates via cached queries. Add
  PostHog for product analytics (already configured). Keep privacy: EventLog IP/UA is staff-only.

## Error monitoring
- **Recommendation:** Sentry (already configured) on both web + API. **Add Next.js `error.tsx` /
  `global-error.tsx`** (legacy had none).

## External integrations
- **Keep:** Google OAuth, Resend (email), Cloudinary (media), SightEngine (moderation), Upstash
  (ratelimit/cache), Neon (DB), Sentry, PostHog.
- **Phase 2 only:** Paystack (escrow/payouts), logistics partner API (Waybill).
- **Add:** Cloudflare Turnstile (already configured for bot protection) — verify UI wiring.

---

# 6. FRONTEND TECHNOLOGY

**Options considered:** (a) React SPA + separate API, (b) Next.js, (c) other (Remix/Svelte).

**Recommendation: Next.js (App Router).** Do **not** add unnecessary framework complexity.

**Reasoning:**
- **SEO / shareability:** vendor profiles and listings should be indexable and OG-shareable — SSR/SSG
  wins over a client-only SPA.
- **Performance:** `next/image`, route-based code-splitting, streaming — directly addresses the legacy
  heavy vendor-dashboard bundle (recharts 259 kB). Load charts only on the dashboard route (legacy did
  this correctly; keep it).
- **Deployment:** Vercel-native; zero extra infra.
- **Auth:** Next middleware for route guards (legacy used `requireShopper`/`requireVendor` in layout —
  sound pattern).
- **Team/project complexity:** one framework for shopper + vendor + admin + public = lower cognitive
  load than a separate SPA + API-frontend + admin-frontend.
- **Vercel compatibility:** first-class.

**Why not a separate React SPA:** worse SEO, more build/deploy surfaces, no clear upside for a
directory site. **Why not Remix/Svelte:** ecosystem/team familiarity favors Next; no evidence the
trade-off is worth it here.

**Caveat:** the legacy `next build` self-mutation under pnpm is a real dev/CI trap — **always clean
`.next` before build** (document as a CI requirement, already flagged in recovery docs).

---

# 7. BACKEND TECHNOLOGY

**Options considered:** (a) Next API routes only, (b) standalone Node service (Express/Fastify),
(c) tRPC/NestJS.

**Recommendation: standalone Node/TypeScript API (Fastify preferred over Express for throughput, but
Express is acceptable — the legacy Express app is fine).** Do **not** assume the old backend survives
unchanged — its *transport* decisions (base64 upload, public cron, in-memory limiter) must change.

**Reasoning:**
- **Realtime:** socket.io belongs in a long-lived process, not Vercel serverless.
- **Type safety:** TypeScript + Zod at boundaries (keep — it's good).
- **Performance:** Fastify > Express on throughput; either beats co-mingling with Next.
- **Auth:** JWT + session row (keep logic; fix cookie transport).
- **Validation:** Zod (keep).
- **Maintainability:** one API repo, clear service layer (legacy `services/*` pattern is sound).
- **Deployment on Render:** proven with legacy.
- **Developer experience:** shared types with frontend via monorepo (see §9).

**Why not Next API routes:** couples realtime/auth/background to Vercel's execution model; worse for
socket.io and long jobs. **Why not NestJS:** heavier than needed for this surface; Express/Fastify +
Zod is sufficient.

---

# 8. DATABASE APPROACH

**Context:** legacy used **PostgreSQL + Prisma + Neon**. Significant legacy DB artifacts existed
(tsvector columns, unused enum states). We redesign the *approach*, not just the schema.

**Recommendation:**
- **PostgreSQL on Neon** — keep. Neon fits the Vercel/Render stack and the pilot scale.
- **ORM:** **Do not default to Prisma.** Evaluate **Drizzle** or **sqlc-style typed queries** alongside
  Prisma. Prisma works but its client bundle and migration ergonomics have real trade-offs; Drizzle is
  lighter and edge-friendlier. **This is an open decision — see §18.** If the team prefers Prisma's
  DX, keep it; if bundle/perf matters, Drizzle is compelling.
- **Migrations:** use a managed migration tool (Prisma Migrate / Drizzle Kit / sqitch). Never
  hand-edit prod schema.
- **Validation:** Zod at API boundary (keep) + DB constraints (unique, not-null, FK) as the second line.
- **Transactions:** use them for multi-row writes (legacy `ensureVendorRow` deliberately avoided
  transactions for pooled-DB compat — reconsider with Neon's pooler; use explicit transactions where
  correctness needs it, e.g. review delete + rating recompute).
- **Query layer:** a thin data-access layer (repository pattern) so business logic isn't tangled in
  route handlers (legacy `services/*` is the right idea).
- **Data access boundaries:** enforce ownership/participation checks in the service layer (legacy did
  this well for reviews/listings/conversations — keep).
- **Search:** PostgreSQL FTS / ILIKE+trigram for Phase 1; defer dedicated search infra.
- **Do NOT carry:** `searchVector` tsvector columns (recreate search in the new stack), unused enum
  states, `User.drafts`.

**Alternatives to Prisma:** Drizzle (lighter, typed, SQL-forward), Kysely (typed SQL builder), raw
`pg` + Zod (max control, more boilerplate). All viable; pick on team preference + bundle/perf goals.

---

# 9. MONOREPO QUESTION

**Options:** (a) monorepo (Turborepo/pnpm workspaces), (b) separate repos.

**Recommendation: monorepo (Turborepo, as legacy used).** But apply the lessons the recovery docs
taught:
- Shared types between API and web (legacy had `apps/api` + `apps/web` — good).
- Shared UI kit (a `packages/ui`) so shopper/vendor/admin share components and **mobile-nav
  consistency** is enforced in one place (directly fixes the legacy vendor-hamburger inconsistency).
- Database package (`packages/db`) with the schema + migrations + typed client.
- **Build complexity:** Turborepo caching helps; the `next build` self-mutation is the only real trap
  (clean build in CI).
- **Deployment:** Vercel deploys `apps/web`; Render deploys `apps/api` — monorepo doesn't block this.

**Why monorepo over separate repos:** shared types/UI reduce the exact inconsistencies that bit the
legacy (mobile nav, fragmented vendor routers). **Why not dogmatically:** if the team prefers
separation, two repos work — but the consistency wins favor monorepo here.

---

# 10. DEPLOYMENT

Current stack (Vercel + Render + Neon) is appropriate — **keep it.**

- **Vercel:** `apps/web` (Next.js) — shopper, vendor, admin, public pages. Edge/SSR.
- **Render:** `apps/api` (Node service) — REST + socket.io + cron target + background jobs.
- **Neon:** PostgreSQL (all environments).
- **Environments:** dev / staging / production. Use separate Neon branches per env; separate Render
  services; Vercel preview deploys per PR.
- **Networking/CORS:** API on `api.voeq.ng` (or `voeq.onrender.com` for staging); web on `voeq.ng`;
  pin `CORS_ORIGIN`; scope `no-Origin` to public routes only.
- **Domains:** `voeq.ng` (prod), `api.voeq.ng` (prod API), staging subdomains.
- **Secrets:** Vercel env + Render env (not in repo — legacy `.env.example` is correct practice).
  **GITHUB_TOKEN note:** a token currently sits *commented out* in `~/.hermes/.env` — unrelated to
  Voeq secrets, but a reminder that secret hygiene matters project-wide.
- **Background workers / cron:** Render cron (or a secret-header-protected endpoint) triggers badge
  sync — **auth-gated**, never public.

**Avoid unnecessary infrastructure:** no separate queue broker needed at NMU-pilot scale; cron +
in-process jobs suffice. Revisit when volume demands.

---

# 11. PERFORMANCE STRATEGY

First-class, because the product must *feel* fast on campus networks (often throttled mobile data).

- **Initial page load:** SSR for listing/vendor pages; static shell for shell; stream where possible.
- **JS bundle:** route-level code-splitting; load `recharts`/charts **only** on vendor dashboard +
  admin analytics (legacy did this — keep); lazy-load modals.
- **Rendering:** SSR/SSG for public pages; client for dashboards.
- **Data fetching:** cache trending/recently-viewed (Redis); avoid the legacy `getMe()` on *every*
  `(main)` navigation — use a cached session/token refresh.
- **Caching:** Redis for aggregates, sessions, feature flags; CDN (Vercel/Cloudinary) for images.
- **DB queries:** fix write-on-read (no DB write per GET); index foreign keys; avoid N+1 (legacy
  `listListings` was clean — keep that discipline; audit admin analytics for N+1).
- **Images:** `next/image` + Cloudinary transforms; explicit width/height to avoid CLS.
- **Search:** indexed FTS; debounce client input.
- **Realtime:** socket.io with auto-reconnect (verified); cap payload sizes.
- **API latency:** pagination/cursors everywhere (legacy used cursors for messages — keep); index
  hot paths.
- **Loading states:** skeletons, not spinners; optimistic UI for save/follow.
- **Mobile performance:** defer heavy JS; test on throttled 3G; the NMU pilot audience is mobile-first.

---

# 12. SECURITY STRATEGY

Directly addresses the legacy audit's 6 security concerns.

- **Authentication:** keep JWT+session, OTP pending-token, argon2. Fix: no token-in-URL; proper
  cookie domain.
- **Authorization:** **auth-gate every privileged route** — the 3 unauthenticated endpoints
  (backup/cron/test) are the top risk. Remove `test`; gate backup + cron; restrict cron to scheduler
  network or secret header.
- **Staff permissions:** keep `PERMISSIONS` matrix + `requirePermission`; decide moderator's fate (§18).
- **Session management:** keep server-side revocation; fix impersonation cross-domain cookie (verify
  web consumption; colocate auth if simpler).
- **API protection:** centralized rate limiting (Upstash) for **all** routes incl. sockets; remove
  per-process in-memory limiter.
- **File uploads:** keep type/size/moderation; switch to multipart; add retry/circuit-breaker on
  SightEngine/Cloudinary failure.
- **Webhooks:** none in legacy; if Phase 2 adds Paystack webhooks, **validate signatures** (legacy had
  no webhook validation — don't repeat).
- **CORS:** pin origin; scope `no-Origin` to public routes.
- **Secrets:** env-only; never in repo; redact in errors (legacy did this — keep).
- **Audit logging:** keep `AuditLog` + `logAdminAction` on all staff mutations.
- **Impersonation:** keep, but fix cross-domain; super_admin guard stays.
- **Data privacy:** EventLog IP/UA is staff-only; define retention for messages/reports/disputes/
  EventLog/AuditLog (legacy had none — **open question §18**).

---

# 13. UX / UI VISION

This must be a *genuine* direction, not "modern, clean, intuitive."

## Brand personality
Voeq is **youthful, trustworthy, and campus-native** — but with a **premium, confident finish**. Think
"the student union's noticeboard, rebuilt by someone with taste." Not corporate, not childish. The
founder's *"Built for Campus. Built for You."* implies warmth + belonging. I'd anchor the personality
as: **Warm · Trustworthy · Energetic · A little sophisticated.** The trust layer (verified, reviews,
badges) is the soul of the product, so the UI must make trust *legible at a glance*.

## Visual language
- **Typography:** a confident display sans for headers (e.g. **Sora / Clash-like** via a free alt like
  *Space Grotesk* or *Plus Jakarta Sans*) + a highly readable body sans (*Inter*). Distinct
  header/body contrast = personality without clutter.
- **Color philosophy:** a **warm campus palette** — a deep trustworthy primary (forest/ink green or a
  campus-identity green) + a warm accent (amber/coral for CTAs like "Chat on WhatsApp"). NMU identity
  can inform the green. Avoid generic SaaS blue/purple.
- **Surface treatment:** soft, layered surfaces (subtle off-white canvas, white cards, 1px hairline
  borders) — *not* heavy shadows.
- **Borders:** 1px low-contrast borders; radii generous (16–20px cards, 10–12px controls) = friendly.
- **Shadows:** minimal; one soft elevation token for floating elements (bottom nav, modals).
- **Iconography:** rounded, friendly line icons (e.g. Lucide) — consistent weight.
- **Imagery:** real campus/vendor photography (not stocky abstract gradients). Vendor photos are the
  hero content.
- **Illustration:** sparing, only for empty states (a friendly "no listings yet" illustration beats a
  blank box).
- **Information density:** moderate — campus directories need scannable cards, not dense tables (except
  admin, where density is fine).

## Layout philosophy
- **Navigation:** **unified bottom-tab on mobile for ALL roles** (shopper/admin/vendor) — fixes the
  legacy vendor-hamburger inconsistency. Desktop: sidebars per role.
- **Cards:** listing/vendor cards with photo-forward design; trust badges visible on the card.
- **Lists:** recent-activity, conversations, reviews — clean rows with avatars.
- **Detail pages:** two-column on desktop (gallery + info), single-column mobile; sticky
  WhatsApp/contact CTA.
- **Forms:** large touch targets (legacy reset-password used `h-14 w-12` — good pattern); inline
  validation; never a dead "submit" with no feedback.
- **Dashboards:** vendor dashboard = at-a-glance (status strip, sparkline, per-listing table); admin =
  dense tables.
- **Mobile nav:** bottom tab, fixed, `pb` offset on content. **Vendor onboarding preview must be visible
  on mobile** (legacy hid it `hidden lg:block` — fix).

## Motion
Motion that *improves UX*, not decoration:
- **Page transitions:** subtle cross-fade/slide (200–250ms); respect `prefers-reduced-motion`.
- **Micro-interactions:** save/follow heart pop; button press scale; smooth filter chip add/remove.
- **Hover states:** lift on cards; color shift on CTAs.
- **Press states:** clear active state on every tappable.
- **Loading transitions:** skeleton shimmer (not spinner); optimistic updates for save/follow.
- **Success/error feedback:** toast (saved!/error) with clear copy; inline field errors.

This is where the new **animation** and **three.js/3D** skills can earn their place — but *sparingly*:
a tasteful hero treatment or a 3D vendor-card tilt on hover is "cool"; a 3D everything is not. Motion
is a finishing layer, applied after the core is fast and correct.

---

# 14. DESIGN QUALITY BAR

"Top-tier" for Voeq means:
- **Visual consistency:** one design system (shared `packages/ui`), one spacing/radius/color token set.
- **Accessibility:** WCAG AA contrast; keyboard-navigable; focus states; alt text on vendor images;
  `prefers-reduced-motion` honored.
- **Responsiveness:** flawless mobile-first (pilot audience is mobile); no desktop-only previews.
- **Performance:** LCP < 2.5s on 4G; bundle discipline (§11).
- **Interaction quality:** every action has feedback; no dead buttons.
- **Error handling:** branded `error.tsx`/`not-found`; graceful API-fail states.
- **Empty states:** helpful + on-brand (illustration, CTA), never blank.
- **Loading states:** skeletons everywhere.
- **Micro-interactions:** subtle, consistent, purposeful.
- **Typography:** clear hierarchy; comfortable line length.
- **Information hierarchy:** trust signals (verified, rating, open-now) surfaced before secondary info.
- **Mobile experience:** bottom-tab nav, thumb-reachable CTAs, no horizontal-scroll traps except
  intentional category pills.

---

# 15. PRODUCT SIMPLIFICATION

The recovery docs describe ~50+ screens and 30+ flows. Can we simplify without losing function?

- **Consolidate moderator into admin** (if moderator console isn't built) — one staff surface, not two
  half-states. (Or drop moderator — §18.)
- **Unify mobile nav** (one bottom-tab component) — removes the vendor-hamburger divergence and its
  test/maintenance cost.
- **Remove dead "coming soon" stubs** (Events/Housing/Waybill) from nav — they created expectation
  gaps in the legacy. Link them only when built.
- **Combine fragmented vendor routers** (legacy had 4 routers for one resource) into one cohesive
  vendor API surface — maintainability win, no UX loss.
- **Collapse discovery routes** (`discover` + `search` + `listings` browse overlap) into one
  browse/search service — same user need, less code.
- **Shopper + vendor onboarding** share agreement/campus gates — extract a shared onboarding shell.
- **Do NOT remove features to shrink the number** — e.g. reviews, chat, WhatsApp, badges are core
  trust; keep them. Simplification here is about *consolidation and dead-code removal*, not capability
  cuts.

---

# 16. MAJOR ARCHITECTURAL RISKS

| # | Risk | Seriousness | Mitigation |
|---|---|---|---|
| 1 | Unauthenticated privileged endpoints ship again | Critical | Auth-gate every staff/cron/backup route; pre-launch security review |
| 2 | Cross-domain auth breaks (tokens/cookies) | High | Colocate auth or subdomain-shared cookie; test OAuth + impersonation E2E |
| 3 | Upload cap bug returns (base64) | Medium | Multipart + presigned; aligned limits; integration test > 1 MB |
| 4 | View-count inflation distorts trending | Medium | De-dupe per user/window (Redis/DB) |
| 5 | Onboarding gate soft-locks users (no seeded campus) | Medium | Graceful fallback if campus list empty; support escape hatch |
| 6 | Moderator half-state | Medium | Decide + implement or drop (§18) |
| 7 | `next build` self-mutation | Low (CI) | Clean `.next` before build; document |
| 8 | External-failure hard fails (uploads) | Medium | Retry/circuit-breaker on SightEngine/Cloudinary |
| 9 | In-memory rate limiter bypass | Medium | Centralize (Upstash) all surfaces incl. sockets |
| 10 | Legacy artifacts carried blindly (drafts, unused states) | Low/Med | Explicit decision list (§2/§8); do not auto-carry |

---

# 17. ALTERNATIVES

For the major decisions, the comparison (not just "X is best"):

- **Next.js vs SPA:** Next wins on SEO/shareability for a public directory; SPA only wins if SEO
  doesn't matter (it does — vendor profiles should be findable).
- **Standalone API vs Next API routes:** standalone wins for socket.io/background/cron; Next routes win
  only on simpler deploys (not worth the realtime compromise).
- **Prisma vs Drizzle:** Prisma = mature DX, heavier client; Drizzle = lighter, edge-friendly, more
  SQL-forward. Pick on bundle/perf priority.
- **Monorepo vs multi-repo:** monorepo wins on shared-UI/type consistency (directly fixes legacy
  divergence); multi-repo wins only on team isolation (not a concern at this scale).
- **PostgreSQL FTS vs Elasticsearch:** FTS wins at pilot scale (zero infra); ES wins only at high
  volume/multi-campus.
- **Cloudinary vs S3+R2:** Cloudinary wins on transforms/moderation integration; S3/R2 wins on cost at
  scale.

---

# 18. OPEN QUESTIONS (require human approval)

These **cannot** be answered from code. The owner + technical reviewer must decide:

1. **Moderator role** — implement a real console, or drop the tier? (Legacy is half-wired.)
2. **Staff provisioning** — how are admin/moderator/super_admin created? (DB seed? invite? No UI found.)
3. **Account deletion** — user-facing self-serve delete? Retention for messages/reports/audit logs?
4. **Vendor approval** — self-serve go-live (legacy) or a `pending_review` manual step? (Enum exists,
   usage unconfirmed.)
5. **Cron scheduler** — Render cron vs in-app? Who triggers badge sync? Must be auth-gated.
6. **Impersonation** — keep? If so, how is cross-domain session handoff done correctly?
7. **Retention/legal** — policy for private messages, reports, disputes, EventLog, AuditLog?
8. **Events / Housing / Waybill** — explicitly in scope for rebuild, or Phase 2+ roadmap?
9. **Auth domain strategy** — colocate web+api auth (same/subscribed cookie domain) or token exchange?
10. **Rate-limiting posture** — strict global vs per-route only?
11. **ORM choice** — Prisma (keep) vs Drizzle (lighter)? (§8)
12. **UI direction** — confirm the warm/trustworthy/campus-native palette + typography proposed in §13,
    or steer differently?
13. **Listing-scoped reviews** — Phase 1 (vendor-scoped only) or add listing-scoped now?
14. **Phase 2 payment seam** — confirm we architect-for but do-not-build Paystack/escrow in this rebuild.

---

# 19. YOUR FINAL RECOMMENDATION

## RECOMMENDED DIRECTION

- **Product direction:** A trustworthy, fast, campus-native **discovery directory** (Phase 1: WhatsApp-
  first, no payments). Carry the two-sided model; implement the founder's **category-on-listing**
  correction; defer Events/Housing/Waybill and Phase 2 payments.
- **Architecture:** Next.js (web, Vercel) + standalone Node/TS API (Render) + PostgreSQL/Neon. Reuse
  the proven topology; fix its transport mistakes.
- **Frontend:** Next.js App Router. No unnecessary framework complexity. Shared `packages/ui` for
  cross-role consistency (fixes mobile-nav divergence).
- **Backend:** Standalone Node/TS (Fastify or Express) + Zod + socket.io. Reuse sound auth/session
  logic; fix cookie transport, upload transport, rate limiting, cron auth.
- **Database:** PostgreSQL/Neon. Re-evaluate Prisma vs Drizzle. Thin repository layer. Explicit
  transactions where correctness needs them. Don't carry tsvector/drafts/unused states.
- **Deployment:** Keep Vercel + Render + Neon. Dev/staging/prod with separate Neon branches. Auth-gate
  cron; pin CORS.
- **Monorepo decision:** **Yes (Turborepo)** — for shared types/UI/DB and consistency. Clean `.next`
  in CI.
- **UX philosophy:** Warm · Trustworthy · Energetic · Sophisticated. Trust made visible. Unified
  mobile bottom-tab nav. Motion that improves UX, applied sparingly (animation/3D as finishing layer).
- **Visual direction:** Warm campus palette (trustworthy green + warm WhatsApp-CTA accent), confident
  display + readable body type, soft layered surfaces, photo-forward cards, friendly radii, minimal
  shadows, on-brand empty/loading states.
- **Performance philosophy:** Feel fast on campus mobile networks — SSR public pages, code-split
  charts, de-dupe views, cache aggregates, no write-on-read, skeletons everywhere.
- **Security philosophy:** Auth-gate every privileged route (top risk), centralized rate limiting,
  tighten CORS, fix cross-domain auth, retry external failures, keep audit logging.
- **Development strategy:** MVP sequence in §4 (Foundation → Auth → Onboarding → Marketplace →
  Engagement → Trust/Moderation → Analytics/Polish → Launch Hardening). Phase 2 (Paystack/escrow/
  logistics) as a separate, later track. Resolve the §18 open questions before schema/blueprint
  finalization.

---

**END OF PROPOSAL. Nothing herein is approved. Awaiting owner + technical-reviewer review.**
