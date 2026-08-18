# 06 — BUILD EXECUTION PLAN

> **Status:** PLANNING ONLY. No `npm install`, no scaffold, no source code yet. This document is the
> proposed *sequence and verification gates* for turning the locked design system (Doc 05 A–D) and the
> locked product scope (Docs 01–04) into a running Voeq. **Founder reviews + signs off before any code.**
>
> **Governing authorities (locked):**
> - Docs 01–04 = product/flow/scope/IA source of truth.
> - Doc 05 A–D = design authority (A🔒 B🔒-structure/🟡-aesthetics C🔒 D🔒 / 3D🟡).
> - Monorepo stays. Domain = voeq.ng. Messages = feature, not MVP. Public UI = priority (portfolio).
> - Vertical slices, verify each, then advance. QC principle: implementation convenience never overrides C.

---

## 0 — Non-negotiables carried from the locked system

1. **Stack (founder-approved):** Next.js (App Router) + React + TypeScript + Tailwind CSS. Monorepo.
2. **Data (founder-approved):** realistic *shaped* mock data first, behind a clean data boundary so the
   real backend swaps in later **without rebuilding the UI**. "Mock first" ≠ "fake everything indefinitely"
   — once public UI proves itself, progressively connect real infra.
3. **Two environments, one Voeq:** Deep (Landing/arrival) + Cream (everything else). Shared DNA; flip
   once. Implemented as *one* theme with role tokens, not two themes.
4. **Contour/activity = meaning, not wallpaper:** SVG primitives gated by real data (Doc 05 B.11/A.12).
5. **Motion = cause → response → relationship → transition → rest** (Doc 05 D.1). No perpetual decoration.
6. **Storefront is a stress test:** 15 listings + imperfect photos + trust + reviews + availability +
   messaging + business info must stay excellent (Doc 05 B.16/C.7).
7. **QC principle:** if a card-grid is easier than the editorial composition C prescribes → choose C. Cut
   motion that communicates nothing.
8. **3D = experimental**, absent from early slices; only a Landing contour experiment later, if it earns it.

---

## 1 — Repository layout (monorepo)

```
voeq/                      (monorepo root)
  apps/
    web/                   Next.js app (voeq.ng) — App Router, Tailwind, TS
  packages/
    design-tokens/         Doc 05 B tokens → CSS custom properties + Tailwind theme (roles, not hex)
    ui/                    Doc 05 C components (six-dimension specs → React components)
    contour/               Doc 05 B.11 contour/activity SVG primitives + real-data gating
    data/                 DATA BOUNDARY: typed repositories (mock now, real API later) + shapes
  docs/project-blueprint/  (this planning set — Docs 00–06)
```

- `packages/data` is the **only** place that knows whether data is mock or real. UI imports typed
  repositories (`getListings`, `getVendor`, `getActivity`) — swapping mock→real touches only this package.
- `packages/design-tokens` emits CSS vars (`--voeq-surface`, `--voeq-ink`, `--voeq-accent`, env variants)
  so components reference *roles*, satisfying the B.1 role-rule.
- `packages/ui` components implement the C.2–C.5 specs (job/hierarchy/states/responsive/composition/stress).

---

## 2 — Slice sequence (public-first, verify each)

Each slice is **done** only when it meets its verification gate (below). Nothing advances until the gate passes.

### Phase 0 — Global foundation (no product surface yet)
- Stand up monorepo + Next.js app + Tailwind.
- Install `design-tokens` (roles from B.1; exact hex PROVISIONAL, adjustable in real composition).
- Install fonts: **Fraunces (display) + Hanken Grotesk (UI)** — PROVISIONAL per B.2; wire as CSS vars,
  not hardcoded. IBM Plex Mono reserved for Staff codes.
- 8pt spacing scale, 12-col grid, 4px radius, container rule (B.3/B.4).
- `contour/` primitives (line ≤12% opacity edges, activity node, campus fingerprint) + data-gating stub.
- **Gate:** tokens render in a static styleguide page; both environments (Deep/Cream) switch via role
  flip; reduced-motion + 60fps budget observable. No product page yet.

### Slice 1 — Landing (Cream-first) [PUBLIC / portfolio]
- Doc 04 PG-PUB-001. Cream environment, contour signature (strongest), display typography, arrival moment.
- Continuity requirement locked (D.4.1): must read as *one world* with Explore.
- **Gate:** Landing renders in **Cream** (the default environment); contour meaningful (real-ish activity data);
  no perpetual animation; mobile + reduced-motion clean. Stress: it must *feel* like Voeq's arrival, not a
  generic SaaS hero.

> ⚠️ **REVERSAL — 2026-08-18 (founder call, confirmed):**
> This section previously read "Slice 1 — Landing (**Deep**)" with a "Landing renders in Deep" gate. That has
> been **reversed**. **Cream is now the primary/default environment across ALL public routes, including
> Landing.** Deep is an alternate/intentional environment (still fully supported via the styleguide flip and
> any future opt-in), but it is **never the silent default anywhere**, including Landing.
> - This OVERRIDES the original Slice 1 sign-off and supersedes the Doc 05 A.3 "Landing / arrival → Deep
>   forest" mapping (see Doc 05 A.3 reversal note), the Doc 07 §7.2 route table (`/` = Deep), Doc 07 §7.6
>   (Landing = Deep showpiece), and Doc 12 line 68 environment-mapping row.
> - **Consequence (founder-accepted):** the Deep-arrival → Cream-explore "flip once" continuity device
>   (Doc 05 A.3 transition rule; Doc 07 §7.2 "Landing→Explore flip happens once") is **collapsed** — Landing
>   is now Cream, so Landing→Explore is Cream→Cream. Continuity between Landing and Explore must be
>   re-established through **composition / motion / shared components**, NOT an environment-color flip.
>   **Slice 2 (Explore) planning MUST define a new continuity strategy before build** — do not re-derive
>   "Deep" from this doc.
> - The Slice 1 code/gate was built Deep-first and then corrected to Cream-first (see repo commit history).
>   The original Deep implementation is recorded as reversed, not as a defect-in-the-docs-only.

### Slice 2 — Explore (Cream) + the signature transition [PUBLIC]
- Doc 04 PG-PUB-002/003. Cream discovery; contour as edge-whisper (B.12 placement rule).
- **The Landing→Explore transition:** continuity LOCKED; contour-carry = PROPOSED motion (use simpler if
  better). Single directional move; 600–900ms first, 320ms after.
- **Gate:** transition preserves spatial/visual continuity (the D.4.1 test — not "dark→different site");
  Explore shows listing results via C.3.1 arrangements; filters use meaningful transition (D.2/D.4).

### Slice 3 — Listing Detail [PUBLIC]
- Doc 04 PG-PUB-005. Editorial object; gallery (B.6 frame); price/availability as data; message CTA.
- Shared-element open from Explore (relationship motion, D.2).
- **Gate:** opens from Explore with continuity; ugly-photo treatment holds; message CTA present (native,
  not WhatsApp — Doc 01/03 LOCKED).

### Slice 4 — Vendor Storefront [PUBLIC / THE STRESS TEST]
- Doc 04 PG-PUB-004. Deep hero band + cream body (intra-page flip). Dominant identity (C.2.2).
- **B.16 stress test exercised here:** 15 listings (≥5 imperfect photos), trust, reviews, availability,
  likes/follows, campus, categories, message CTA, activity — mobile + desktop.
- Listing arrangements chosen by density+intent (C.3.1): hero image-led, body editorial rows, "all"
  compact. Container rule (no card wall).
- **Gate:** the B.16 six criteria all pass on real-shaped mock data; richness organized not hidden
  (C.6 #6); above-the-fold answers who/what/why-message.

### Slice 5 — Auth + Shopper shell [PRODUCT]
- Doc 04 PG-AUTH-*, PG-SHOP-*. Single sign-in (Doc 03 LOCKED). Bottom nav (mobile) / top nav (desktop),
  notification surfaces (C.5.1).
- **Gate:** sign-in works on mock auth; nav + notifications render in Cream; no theme switch mid-task.

### Slice 6 — Vendor onboarding + Vendor Dashboard [PRODUCT]
- Doc 04 PG-VEND-007 (create/edit distinct) + PG-VEND-001 (attention queue, not generic analytics).
- 5-step onboarding (Doc 03). Dashboard = "how is my business doing / what needs attention" (Doc 04 LOCKED).
- **Gate:** 5-step flow completes to a vendor; dashboard shows attention queue + trended perf + storefront
  health; reflects the LOCKED job, not a stats dashboard.

### Slice 7 — Messaging [FEATURE, not MVP — built after public + auth + vendor]
- Doc 04 PG-MSG-*. Native composer (C.4.1); pending→sent→delivered (cause-effect, D.3).
- **Gate:** message thread works on mock; composer native; states animate per D.3; no WhatsApp exit.

### Slice 8 — Staff operational surfaces [PRODUCT, last]
- Doc 04 §3.7. Operational tier (B.12/B.15.3): no signature, Deep strategic for alerts.
- Moderation workbench: Queue→Case→Evidence→Decision→Consequence (C.5.3).
- **Gate:** moderator handles a case via the workbench flow; dense but legible; no 400-row table stare.

### Phase 9 — Progressive real-infra connection [post-public-proof]
- Replace `packages/data` mock repos with real API/DB, one domain at a time, starting with listings/
  vendors (the public surfaces that already proved the design). UI unchanged (data boundary holds).
- 3D experiment (D.9) only if a Landing contour prototype demonstrably improves arrival; else cut.

---

## 3 — Verification gates (what "verified" means)

Per founder: we don't blindly accept output. Each slice is verified against the locked system, not "looks
fine." A slice is **done** when:
- [ ] Renders in both environments via role-flip (no second theme).
- [ ] Uses Doc 05 tokens/components; implementation convenience did NOT override C (QC principle).
- [ ] Contour/activity only where content warrants (B.12/A.12); no decoration without cause (D.1).
- [ ] Motion follows cause→…→rest; reduced-motion + 60fps-on-mid-Android hold (D.7/D.8).
- [ ] Mobile + desktop both verified; bottom-nav on mobile (Doc 04 LOCKED).
- [ ] Imperfect-content test passes (B.6/B.16) where the surface is storefront/listing.
- [ ] Maps to its Doc 04 page ID + Doc 02 requirement IDs (traceability).
- [ ] Founder review confirms before next slice.

---

## 4 — Risks & how the plan contains them

| Risk | Containment |
|---|---|
| "Mock first" becomes "fake forever" | Phase 9 mandates progressive real-infra swap; data boundary means UI doesn't block on backend |
| Stack quietly changes philosophy | Monorepo + role-tokens + six-dimension components keep Doc 05 authority; QC principle enforceable |
| Storefront degrades under density | Slice 4 gate = B.16 six criteria on real-shaped mock; arrangement rules (C.3.1) prevent card-monotony |
| Landing→Explore reads as two sites | D.4.1 continuity LOCKED; slice 2 gate is the continuity test |
| 3D forced in for portfolio | 3D🟡 experimental, absent from slices 0–8; only a proven Landing experiment |
| Messages scope-creeps into MVP | Explicitly Slice 7 (after public + auth + vendor); feature, not MVP |

---

## 5 — What this plan deliberately does NOT do

- No code, no `npm install`, no scaffold (planning only, per founder).
- Does not lock exact font/palette (PROVISIONAL per B.2/B.1; decided in real composition during slices).
- Does not build Staff before public (public = portfolio priority).
- Does not include payments (deferred per Doc 02 Phase 1).
- Does not treat 3D as required.

---

## 6 — Founder sign-off gate

This plan proceeds to **Slice 0 (global foundation)** only after founder vetting against **everything
locked in Docs 01–05**, not a "looks good." Specific things to confirm:
1. Slice order (public-first, messaging Slice 7, Staff Slice 8) matches priority.
2. Monorepo layout + data boundary approach.
3. Verification gates are sufficient to catch a C-override or a philosophy drift.
4. Nothing here contradicts a LOCKED item in Docs 01–05.

**Awaiting founder approval. No execution until then.**
