# 07 — TECHNICAL ARCHITECTURE & APPLICATION STRUCTURE

> **Status:** PLANNING / DOCUMENTATION ONLY. No code, no dependency install, no scaffold, no modification
> of any document except the creation of this one. **Return for founder review after writing; do NOT begin
> Document 08.**
>
> **Authoritative constraints (LOCKED — treated as law, not suggestion):**
> - Docs 01–04 = product/flow/scope/IA source of truth.
> - Doc 05 A–D = design authority (A🔒 B🔒-structure/🟡-aesthetics C🔒 D🔒 / 3D🟡).
> - Doc 06 = build execution plan (slice order, monorepo, data boundary, verification gates).
> - Implemented order (Doc 06 §2): Foundation → Landing → Explore → Listing Detail → **Vendor Storefront
>   stress test** → Auth/Shopper → Vendor → **Messaging (feature, NOT MVP)** → Staff → progressive real-infra.
> - QC principle (Doc 05, after Part C): implementation convenience never overrides the locked design.
>
> **This document does NOT redesign the product.** Where a decision is not yet justified, it is marked
> OPEN / PROVISIONAL / LATER.

---

## 7.1 — Stack & monorepo boundaries (from Doc 06 §1)

- **Stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS. Monorepo.
- **Layout:**
  ```
  voeq/
    apps/web/              Next.js app (voeq.ng) — App Router, Tailwind, TS
    packages/
      design-tokens/      Doc 05 B tokens → CSS custom properties + Tailwind theme (ROLES, not hex)
      ui/                 Doc 05 C components (six-dimension specs → React components)
      contour/            Doc 05 B.11 contour/activity SVG primitives + real-data gating
      data/               DATA BOUNDARY: typed repositories (mock now, real API later) + domain shapes
  ```
- **Boundary rules:**
  - `packages/data` is the **only** package that knows whether data is mock or real. UI imports typed
    repositories (`getListings`, `getVendor`, `getActivity`, ...). Swapping mock→real touches **only** this
    package (Doc 06 §1, Phase 9).
  - `packages/design-tokens` emits CSS vars (`--voeq-surface`, `--voeq-ink`, ...) so components reference
    *roles* — satisfying the B.1 role-rule and the "two environments, one world" requirement.
  - `packages/ui` components implement the C.2–C.5 specs (job / hierarchy / states / responsive /
    composition / stress). No generic "Voeq Button™" catalogue (founder: C defines assembly grammar, not
    widgets).
  - `packages/contour` owns the signature primitives + the real-data gate (A.12/B.11): a node renders
    **only** when a real event exists.

---

## 7.2 — App Router structure & route architecture (mapped to Doc 04 PG IDs)

Routes are derived directly from Doc 04's locked page map (§1028–1041). Public routes are built first
(archive priority / portfolio). Auth, vendor, messaging, staff follow Doc 06 order.

| Route (App Router) | Doc 04 PG ID | Slice (Doc 06) | Environment | Composition gate (Doc 06 §2 tier) | Notes |
|---|---|---|---|---|---|
| `/` | PG-PUB-001 (Landing) | Slice 1 | **Deep** ⚠️ **REVERSED→Cream** (2026-08-18 founder call: Cream is default on all public routes incl. Landing; Deep never silent default. See Doc 06 §2 reversal note) | **Expressive** — one dominant hierarchy; grouped-not-flat; whitespace structural; not full-width-by-default (S1 composition gate) | Arrival; contour strongest; continuity source |
| `/explore` | PG-PUB-002 (Explore, search folded in) | Slice 2 | Cream | **Editorial** — composed groupings, imagery leads, comfortable-not-cramped, contour whisper (S2 composition gate) | Discovery; contour edge-whisper; weighted trending |
| `/category/[slug]` | PG-PUB-003 (Category) | Slice 2 | Cream | **Editorial** — same as `/explore` (Explore variant) | Explore variant (Doc 04: category = Explore route variant) |
| `/vendor/[id]` | PG-PUB-004 (Storefront) | Slice 4 | Deep hero + Cream body | **Editorial** — B.16 stress: rich-but-composed at 15 listings, zero card-monotony (S4 composition gate) | **STRESS TEST** (B.16) |
| `/listing/[id]` | PG-PUB-005 (Listing Detail) | Slice 3 | Cream | **Editorial** — editorial object, framed imagery leads, data prominent not buried (S3 composition gate) | Editorial object; native message CTA |
| `/auth/*` | PG-AUTH-001..004 (single coherent) | Slice 5 | **Deep** ⚠️ **REVERSED→Cream** (2026-08-18 founder call: auth arrival → Cream-default, same reversal as Landing; Deep remains supported alternate. See Doc 06 §2 reversal note) | **Functional** — calm, list-led, utility-first, signature minimal, quiet nav (S5 composition gate) | FLOW-AUTH-SINGLE (Doc 03/04 LOCKED) |
| `/onboarding/shopper` | PG-ONB-001 | Slice 5 | Cream | **Functional** — calm, utility-first (S5 composition gate) | Shopper onboarding |
| `/onboarding/vendor` | PG-ONB-002 (5-step) | Slice 6 | Cream | **Functional** — grouped utility, attention-queue framing (S6 composition gate) | Founder: 5 steps (not 4) |
| `/shopper/*` (home, saved, settings, notifications) | PG-SHOP-001..005 | Slice 5 | Cream | **Functional** — calm, list-led, scannable, quiet utility (S5 composition gate) | Notifications panel-primary (PG-SHOP-005 PROVISIONAL panel) |
| `/vendor/*` (dashboard, listings mgmt, settings) | PG-VEND-001..006 | Slice 6 | Cream | **Functional** — attention-queue framing, grouped utility, not a stat-grid dump (S6 composition gate) | Dashboard = attention queue (PG-VEND-001 LOCKED job) |
| `/vendor/listing/[action]` | PG-VEND-007 (create/edit distinct) | Slice 6 | Cream | **Functional** — grouped utility (S6 composition gate) | Large experience, not a sub-form (Doc 04 CHANGE) |
| `/messages/*` | PG-MSG-001/002 | Slice 7 | Cream | **Functional** — calm scannable thread, one clear hierarchy, utility receding (S7 composition gate) | **FEATURE, not MVP** — built after public+auth+vendor |
| `/staff/*` (queue, case, analytics, config) | PG-STAFF-001..005 | Slice 8 | Cream (+Deep strategic) | **Operational** — dense-but-legible, strategic-Deep, NO signature, grouped workbench stages (S8 composition gate) | Operational tier; no signature |
| `/about` | PG-PUB-006 (About) | LATER | Cream | **Editorial** (info page composition) | Standalone info page (Doc 04) |
| `/terms` | PG-PUB-007 (Terms) | Slice 5 | Cream | **Functional** — calm, utility-first (S5 composition gate) | **Consent destination** — versioned TOS referenced by consent gate (Doc 03 §3.1 / 09 §9.4) |
| `/privacy` | PG-PUB-008 (Privacy) | Slice 5 | Cream | **Functional** — calm, utility-first (S5 composition gate) | **Consent destination** — versioned Privacy referenced by consent gate (Doc 03 §3.1 / 09 §9.4) |
| `/help` | PG-PUB-009 (Help) | LATER | Cream | **Editorial** (info page composition) | Standalone info page (Doc 04) |
| `/for-vendors` | PG-PUB-010 (For-Vendors) | LATER | Cream | **Editorial** (info page composition) | Standalone info + CTA (Doc 04) |
| `/press` | PG-PUB-011 (Press) | ⏭ LATER | Cream | **Editorial** (info page composition) | Standalone info page (Doc 04) |

- **Two environments, one world:** implemented as a single theme with a `data-env="deep|cream"` attribute
  on the route root; role tokens flip. The Landing→Explore flip happens **once** (Doc 05 A.3). No second
  theme, no mid-task environment switch (Doc 05 A.3 LOCKED).
  > ⚠️ **REVISED 2026-08-18 (founder reversal):** Landing is now **Cream**, so the "Landing→Explore flip
  > happens once" statement is **collapsed** — Landing→Explore is Cream→Cream. The single-theme /
  > no-mid-task-switch principle still holds; only the environment *color* flip at the Landing boundary is
  > gone. Continuity must come from composition/motion/shared components (Slice 2 needs a new strategy).
  > See Doc 06 §2 reversal note.
- **Route → environment mapping** is fixed by Doc 05 A.3/B.2: Landing (`/`) and auth arrival are now
  **Cream** (default) per the 2026-08-18 founder reversal (see the `/` and `/auth/*` row notes); everything
  else Cream. Deep remains a supported alternate, used *strategically inside* Staff (alerts/high-value
  states), never as the surface.
- **Campus scope (Phase 1):** discovery is scoped to **250+ Nigerian universities** (NMU default). The
  campus selector draws a 250+ seed catalog + dynamic storage: a normalized (alias-aware) search miss
  auto-persists the campus as `unverified` (selectable immediately for the user; publicly discoverable only
  after ≥1 confirmed vendor; weekly founder review). See Doc 01 §5/§6, Doc 03 IDN-010, Doc 04 §86.

---

## 7.3 — Server vs client responsibilities

- **Server (RSC) by default:** public routes (`/`, `/explore`, `/vendor/[id]`, `/listing/[id]`) are Server
  Components — they fetch via `packages/data` repositories (mock now) and render the design system. This
  serves SEO (portfolio + marketplace discoverability) and keeps the client bundle lean (D.7 60fps budget).
- **Client only where interaction demands it:** contour activity pulses, message composer, filters,
  save/follow, bottom-nav state, reduced-motion media queries. Client components are leaf-level, not
  whole pages.
- **Data fetching boundary:** server components call `packages/data` repo functions (async). Client
  interactivity calls the same repo interface via a thin client adapter (same types) — so mock→real swap
  is invisible to both.
- **No client-side product re-architecture:** messaging is NOT promoted to the core architecture (founder
  rule). It is one route group (`/messages`) implemented in Slice 7 like any other, using the same repo +
  component layers.

---

## 7.4 — Design-token consumption (Doc 05 B)

- `packages/design-tokens` builds a CSS-variable sheet: per-environment role maps (Cream + Deep) from B.1,
  spacing scale (B.3), radius (B.4, 4px LOCKED), shadows (B.5 minimal), type scale (B.2, PROVISIONAL
  Fraunces+Hanken), motion tokens (B.10/D.1).
- Tailwind theme references the CSS vars (e.g., `colors.surface = 'var(--voeq-surface)'`), so utilities
  carry environment context automatically.
- **Exact hex values remain PROVISIONAL** (B.1) and live ONLY in `design-tokens` — adjustable in real
  composition without touching components. This is the mechanism that keeps aesthetics provisional while
  structure is locked.
- Density tiers (B.12) are exposed as variant utilities / data-attributes consumed by `ui` components.

---

## 7.5 — Component architecture (Doc 05 C, no generic library)

- Components are organized by the C.2–C.5 *situations*, not a flat widget list:
  `ui/navigation`, `ui/identity`, `ui/commerce` (listing, trust, price, likes), `ui/communication`
  (messaging, search, reviews, contour), `ui/system` (notifications, forms, staff, states).
- Each component file carries its six-dimension spec as doc-comment/doc (job/hierarchy/states/responsive/
  composition/stress) — the spec travels with the code.
- **Composition over components:** the assembly grammar (C.6) lives in *page-level composition* modules
  (e.g., `StorefrontComposition`), which place `ui` primitives per the C.3.1 arrangement rules
  (image-led/editorial/compact/hybrid chosen by density+intent). The storefront is a composition, not a
  card grid (QC principle / C.3.1).
- **Listing arrangement engine:** a small selector (C.3.1) maps (listingCount, intent) → arrangement.
  This is the anti-"random assembly" rule made code-shaped.

---

## 7.6 — Contour / activity architecture (Doc 05 B.11 / A.12)

- `packages/contour` exports: `ContourEdge` (≤12% opacity line at container edges/margins), `ActivityNode`
  (6px dot, renders only on real event), `CampusFingerprint` (abstract mark from REAL geo; absent if no
  data — no fake geography, A.8 LOCKED).
- **Data gate:** nodes are driven by an `activity` repository (mock now) returning real-shaped events
  (trending vendor, new listing, open-now). **Zero events → zero nodes, zero motion** (D.5). This is
  enforced in the component, not left to callers.
- **Placement rule (B.12/A.12 LOCKED):** contour lives at edges/section boundaries/margins, never behind
  text. Landing = strongest; Explore = edge-whisper; Storefront = structural header mark; Dashboard =
  pulses; Messaging/Staff = absent unless context warrants.
- **Motion:** node pulse = one soft pulse then static (D.5); respects reduced-motion (D.8). No perpetual
  loops.

---

## 7.7 — Mock-data repository boundary (Doc 06 §1, Phase 9)

- `packages/data` exposes typed repository interfaces:
  `ListingsRepo`, `VendorsRepo`, `ActivityRepo`, `AuthRepo`, `MessagesRepo`, `StaffRepo`, `SearchRepo`.
- **Mock implementation now:** in-repo shaped JSON / faker-style generators producing *real-shaped* data
  — including the B.16 storefront fixture (15 listings, ≥5 imperfect-photo URLs, trust, reviews,
  availability). The fixture is the stress-test input for Slice 4.
- **Real implementation later:** same interfaces backed by HTTP/DB. UI imports the interface, never the
  implementation. Swap = change one provider in `data` (Phase 9).
- **API boundary for real backend:** repository method signatures ARE the API contract. When the real
  backend lands, it fulfills these signatures; no UI change. (Concrete endpoint design = Doc 08.)

### 7.7.1 — External service adapters (Resend / Cloudinary / Sightengine) — provider-independent by contract

All third-party integrations follow the **same adapter pattern** as the data repos: a Voeq-owned domain
interface, a swappable provider implementation behind it. **Adapters are delivery/transport details — they
do NOT leak into the core domain contracts (Doc 08).** Phase-1 placement 🔒; exact config 🔲 OPEN; adapter =
no lock-in (Doc 13 §13.7/§13.8/§13.10).

- **Resend (email adapter) — Doc 13 §13.7 (C5):** `NotificationDomain → EmailAdapter → Resend`. Resend is an
  *email-delivery* adapter, **not** domain logic — product/notification domain stays provider-independent.
  Required template catalog referenced (welcome/registration · email-verification OTP · password-reset OTP ·
  password-reset confirmation · email-change verification · security notification · deactivation ·
  re-consent · vendor transactional · new-conversation/new-message). Template final content 🔲 OPEN; support
  email 🔲 OPEN (not invented). Phase 1 🔒 placement / 🔲 config.
- **Cloudinary (media adapter) — Doc 13 §13.8 (C6):** `MediaDomain → MediaAdapter → Cloudinary`. Cloudinary is
  a *media adapter*, **not** domain coupling — core `ListingImage` / `VendorProfile` domain contract (Doc 08
  §8.4) stays provider-independent (URL/handle, not Cloudinary IDs). Audit scope (validation, types, size,
  transforms, responsive variants, deletion, fallback `ContourMonogram`) 🔲 OPEN exact values. Phase 1 🔒
  placement / 🔲 config. Also governs messaging attachments **if** attachments enabled (§13.M-OPEN).
- **Sightengine (pre-publication moderation gate) — Doc 13 §13.10 (C9):** image **moderation/safety**
  integration (the earlier "SignEngine" name was a naming error — corrected). Runs on uploaded images
  **BEFORE publication** (vendor profile/storefront + listing images). **Moderation result is
  server-authoritative**; client cannot mark an image approved. Rejected images must NEVER become public
  merely because moderation is async — pipeline ordering (§13.8): `Upload → server validation → Sightengine
  → approved → Cloudinary/storage → public`. Failed moderation → clear re-upload/contact-support state.
  Exact API/categories/thresholds 🔲 OPEN (configurable, not silently invented). Phase 1 🔒 placement / 🔲.

### 7.7.2 — Redis — justified-use only (Doc 13 §13.9, C7)

Redis is **not** a mandatory architectural dependency. Adopt per justified use, defer if unjustified;
DB-backed TTL is a valid alternative. Candidate uses (each justified independently, 🔲 OPEN adoption):
OTP storage/expiry (TTL-native) · OTP rate limiting · auth throttling · API rate limiting · idempotency
keys (Doc 09 §9.8 Tier B) · short-lived cache (⏭/🔲) · abuse prevention. **Real-time transport for messaging
is NOT pre-locked to Redis** (§13.M.7). Phase-1 Redis adoption 🔲 OPEN. Adapter, no lock-in.

---

## 7.8 — Domain models / interfaces (shapes only; full contracts = Doc 08)

Defined as TypeScript types in `packages/data` (no behavior yet):
- `Vendor` (identity, campus, verification, description, followers, responseIndicator, categories)
- `Listing` (images[], title, price, availability, vendorId, category)
- `Review` (rating, body, author, vendorId)
- `ActivityEvent` (type, campusZone, refId, ts)
- `Message` / `Conversation` (participants, body, state: pending|sent|delivered)
- `StaffCase` (queue, evidence[], decision, consequence) — matches C.5.3 workbench model.
These are intentionally minimal here; Doc 08 expands them into full domain contracts. Marked PROVISIONAL
until Doc 08 ratification.

---

## 7.9 — Authentication architecture (architectural level only; product LOCKED in Doc 03/04)

- **Single coherent authentication** (Doc 03 FLOW-AUTH-SINGLE LOCKED): one identity, one session, one
  sign-in — across shopper/vendor/staff roles. Architecture supports role derived from the same identity
  (not separate auth systems).
- **Session strategy (PROVISIONAL):** server-side session (Next.js cookies/route protection) for RSC;
  client reads auth state via a lightweight context. Exact mechanism (NextAuth vs custom) = OPEN until Doc 09.
- **Route protection:** `/vendor/*`, `/messages/*`, `/staff/*` gated by role; `/auth/*` is the entry.
  No contradiction with "single coherent" — role is a property of the one identity.
- **Safe identity recovery / linking** (Doc 03 LOCKED) is a product behavior; architecture provides the
  session+recovery hook points. Duplicate-account auto-merge is REJECTED (Doc 03) — architecture does not
  implement it.
- **Google authentication cannot complete account creation before required Voeq consent (LOCKED, Doc 03
  §3.1 / 08b §1.2):** Google OAuth and email/password both terminate in the **same** post-auth consent
  gate (IDN-009) and single Identity. Google answers "who are you?"; it does **not** grant pre-consent. No
  identity is finalized as a completed account until the consent gate passes for **both** methods. **OTP-inclusive
  (C3, Doc 13 §13.4):** the Google path additionally requires **Voeq OTP verification** before activation;
  Google identity resolution does not bypass the OTP step — both methods route through the same OTP + consent gate.

- **Vendor-visibility precondition (🔒 LOCKED, Doc 13 §13.4 / C1):** a vendor profile/storefront is
  **publicly visible/searchable only when** `≥1 published listing` **AND** required Terms/consent
  acceptance exist. This is a **derived visibility state** (computed at read time from `Listing.isPublished`
  + `Identity.consent`), not a stored flag — architecture must compute it, never trust a stored
  "isPublic" boolean. Domain/derivation spec: Doc 08 §8.4; product rule also in Doc 02/04/08.

---

## 7.10 — Image handling (Doc 05 B.6, imperfect-photo system)

- Images flow through a **uniform treatment pipeline**: client-requested ratio + server/client crop to
  ratio (never distort) + matte frame + optional unifying overlay (B.6). Implemented as an `ImageFrame`
  component in `ui/commerce` consuming `design-tokens` ratios.
- **Storage (LATER / Phase 9):** object storage + CDN; exact provider OPEN. Mock phase uses placeholder
  URLs (including deliberately imperfect ones for the B.16 fixture).
- **Missing state:** `ContourMonogram` (B.11) as the art-directed empty plate — never a gray box.

---

## 7.11 — Search / discovery architecture (PG-PUB-002/003)

- Search is folded into Explore (Doc 04 CHANGE). Discovery surface = Server Component fetching via
  `SearchRepo` + `ListingsRepo`.
- **Trending weighting (PROVISIONAL):** ranking signal combines recency + activity + campus density;
  concrete algorithm = OPEN (Doc 02 behavior LOCKED, mechanism OPEN).
- **Filter/sort (PG-PUB-002 DISC-005):** filter state in URL search params (shareable, SSR-friendly);
  results rearrange with meaningful transition (D.2/D.4), not a flash.
- Client interaction (typing, filter chips) is leaf-level; the result list re-fetches via the repo
  boundary.

---

## 7.12 — Messaging architecture (FEATURE, not MVP — Doc 06 Slice 7)

- Implemented as a normal route group `/messages` (PG-MSG-001/002) in **Slice 7**, after public + auth +
  vendor. Architecture gives it NO special centrality (founder rule: not the MVP, not the core).
- Client-side conversation list + thread (two-pane desktop, single-pane mobile per B.9). Native composer
  (C.4.1); message states pending→sent→delivered animate per D.3 (cause-effect).
- **Persistence (LATER):** real-time transport (websocket/polling) = OPEN until Doc 08/11; mock uses local
  state + `MessagesRepo` mock. No architectural shortcut promotes messaging above its Slice-7 place.

---

## 7.13 — Staff architecture (PG-STAFF-001..005, Slice 8)

- Operational tier (B.12/B.15.3): Cream surface, **no signature**, Deep used *strategically* for alerts.
- **Moderation workbench** = the C.5.3 composition: `Queue → Case → Evidence/Context → Decision →
  Consequence`. Architected as a stateful workbench view over `StaffRepo` + `ActivityRepo`, not a 400-row
  table. Roles (Moderator→Admin→Super Admin) respect the Doc 04 capability matrix; moderator scope OPEN
  (Doc 04 §22) — architecture supports scoped access, decision deferred to Doc 09.

---

## 7.14 — Error / loading / recovery boundaries (Doc 05 C.5.4, first-class states)

- **Loading:** skeleton *within* the image frame (B.6), not full-screen spinner. Route-level `loading.tsx`
  per public route (RSC streaming).
- **Error:** route `error.tsx` + component-level error boundaries; actionable copy, no stack traces.
- **Recovery:** error→retry→content transition (D.6), no celebratory animation.
- **Empty:** contour monogram / helpful copy; no spinning nothing.
- These are first-class (Doc 05 A.10/C.5.4) — built into `ui/system` states from Slice 0, not retrofitted.

---

## 7.15 — Accessibility & performance requirements (Doc 05 A.15 / B.9 / D.7–D.8)

- **AA contrast** in both environments (B.1 values chosen to meet it; gold never body text).
- **Reduced-motion** (D.8 LOCKED): `@media (prefers-reduced-motion)` disables non-essential motion;
  contour pulse → static; Landing→Explore → instant swap.
- **Focus visibility** (B.8 LOCKED): 2px `accent-strong` ring on all interactive elements (keyboard).
- **Performance budget** (D.7 LOCKED): 60fps on mid-range Android; animate `transform`/`opacity` only;
  cap simultaneous animated elements; if jank risk → cut motion before ship.
- **Mobile-first** (B.9): bottom nav, sheets over modals, single-pane messaging, stacked storefront.

---

## 7.16 — SEO / public-page requirements (portfolio + marketplace)

- Public routes are RSC + SSR/SSG (7.3) for crawlability.
- Per-page `metadata` (title/description/OG) from route data; structured data (Product/Organization)
  PROVISIONAL.
- **Landing (`/`) is the portfolio showpiece** (Cream default environment, contour signature — Deep remains
  a supported alternate) — built in Slice 1, verified for "feels like Voeq," not just renders.
  > ⚠️ **ENVIRONMENT REVERSED 2026-08-18:** "Deep environment" above is overturned — Landing is now
  > **Cream** (default). Deep remains a supported alternate. See Doc 06 §2 reversal note.

---

## 7.17 — Environment / configuration strategy

- Config via env vars + `next.config` (no secrets in client). `NEXT_PUBLIC_*` only for non-sensitive.
- **Data provider toggle:** `DATA_SOURCE=mock|api` (default `mock`) selects the `packages/data` provider
  (Phase 9 flip). Keeps mock-first without faking forever (Doc 06 §0).
- Secrets (API keys, session secret) server-only; never exposed to client bundle.

---

## 7.18 — Testing boundaries (full strategy = Doc 10; architectural here)

- **Unit:** `ui` components render to spec (six-dimension); `contour` gate logic (no event → no node).
- **Integration:** repository boundary (mock fulfills interface); route renders with fixture.
- **Slice verification (Doc 06 §3):** each slice gated by the Doc 05 + Doc 04 checklist before advance.
- **Visual/stress:** B.16 storefront fixture drives the Slice 4 gate (15 listings, imperfect photos).
- E2E (Playwright) LATER; architectural hook reserved.

---

## 7.19 — Security principles (full = Doc 09; architectural here)

- Server-side session; HTTP-only cookies; CSRF protection on mutations (PROVISIONAL mechanism).
- Authz enforced server-side (role derived from single identity, 7.9); never trust client role claims.
- User-generated images: validated + processed server-side (7.10), no arbitrary upload execution.
- No secrets in client; least-privilege API scopes when real backend lands.
- **Trust/verification** (C.3.2) is a product + security concern (Doc 03 TRUST flows) — architecture
  provides verified-state hooks, not fake badges.

---

## 7.20 — Observability / logging (LATER / Doc 11; architectural here)

- Structured server logging (request/id, errors) behind a `logging` boundary (swap impl later).
- Client error boundary reports to the same sink (PROVISIONAL provider).
- No PII in logs (security, 7.19). Real infra = Phase 9 / Doc 11.

---

## 7.21 — Future real-backend migration path (Doc 06 Phase 9)

- The repository interfaces (7.7) ARE the migration contract. Steps:
  1. Build public UI on mock (`DATA_SOURCE=mock`).
  2. After public proves the design (Slice 4 gate), implement real repos per interface, one domain at a
     time (listings → vendors → auth → messaging → staff).
  3. Flip `DATA_SOURCE=api` per domain; UI unchanged.
  4. 3D experiment (D.9) only if a Landing contour prototype demonstrably improves arrival; else cut.
- **No UI rebuild on migration** — that is the whole point of the boundary (Doc 06 §1).

---

## 7.22 — Open / provisional decisions (explicitly NOT silently decided)

> **Blocking rule (founder):** Technical OPEN decisions must **not** block the public visual slices
> unless they *directly* affect the slice being built. Debating eventual messaging transport before the
> Landing page exists is out of order (Doc 06 order governs).

| Decision | Status | Resolved in |
|---|---|---|
| Auth mechanism (NextAuth vs custom) | OPEN | Doc 09 |
| Session/transport for messaging (ws/poll) | OPEN | Doc 08 / 11 |
| Image storage provider (S3/R2/...) | LATER | Doc 11 |
| Trending ranking algorithm | PROVISIONAL | Doc 02 behavior LOCKED, mechanism OPEN |
| Staff moderator scope | OPEN (Doc 04 §22) | Doc 09 |
| Structured-data / OG detail | PROVISIONAL | Doc 16/SEO pass |
| CSRF mechanism | PROVISIONAL | Doc 09 |
| Exact font/palette values | PROVISIONAL (B.1/B.2) | in real composition during slices |
| 3D | EXPERIMENTAL | D.9 (prototype-gated) |

---

## 7.23 — What Doc 07 deliberately does NOT do

- No code, no install, no scaffold (planning only).
- No product redesign (Docs 01–06 are constraints; messaging NOT promoted; storefront NOT a card grid;
  backend NOT built before public UI).
- No final domain contracts (those are Doc 08).
- No security/testing/infra finalization (Docs 09–11).
- Does NOT begin Document 08.

---

**END OF DOC 07 (Stage: architecture documentation). Return to founder for review. Do NOT proceed to Doc 08.**
