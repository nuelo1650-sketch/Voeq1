# Slice 1 — Landing (Deep) Implementation Plan

> ⚠️ **SUPERSEDED BY FOUNDER REVERSAL — 2026-08-18.** This plan was approved and executed with
> **Landing = Deep**. The founder subsequently **reversed** that decision: **Cream is now the default
> environment across ALL public routes, including Landing**; Deep is an opt-in alternate only, never the
> silent default. The code was corrected (`layout.tsx` → `data-env="cream"`, `page.tsx` comment, and the
> e2e assertion flipped to cream with a separate Deep opt-in test). The authoritative reversal record is in
> **Doc 06 §2 Slice 1 reversal note**, with cross-references in Doc 05 A.3, Doc 07 §7.2/§7.6, Doc 12 line 68,
> and DESIGN_HANDOFF.md line 16. **Do NOT re-derive "Landing = Deep" from this plan.** The Deep-arrival →
> Cream-explore "flip once" continuity device is also collapsed (Landing→Explore is now Cream→Cream); Slice 2
> needs a new continuity strategy. See the Slice 1 audit + Doc 06 §2 for the replacement direction.

> **For Hermes:** Plan only. Do NOT execute until founder reviews + signs off.
> Execution follows the locked process: build → verify against Doc 06 §3 → intent-vs-implementation audit → fix → sign-off. Every slice gets its own plan first.

**Goal:** Build Voeq's first real product surface — the public Landing page at `/` — as the **Deep forest arrival moment**, with a **meaningful, data-gated contour signature** and a clear **entry to discovery**, and nothing else.

**Architecture:** Next.js App Router route `/` carries `data-env="deep"` on its root element (single-theme role flip, no second theme — Doc 05 A.3 / Doc 07 §7). Landing compositions live in `apps/web/components/landing/` and are built from the Slice 0 `@voeq/ui` primitives + `@voeq/contour` primitives. The contour is bound to the **real `ActivityRepo` data boundary** (Doc 07 §7.6); it renders only real events. Slice 0's token/ui/contour/data packages are reused unchanged — this slice adds *product composition* on top of the foundation, not new primitives or new infra.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · `@voeq/ui` · `@voeq/contour` · `@voeq/data` · `@voeq/design-tokens` · Vitest (unit) · Playwright (e2e). No new dependencies.

**Governing authorities (locked):** Docs 00–13. Specific: Doc 04 PG-PUB-001, Doc 05 A.3/B.2/Part D, Doc 06 §2 Slice 1 + §3 gate, Doc 07 §7.6 + route table, Doc 10 regression gates. Provisional items (fonts, exact palette) stay PROVISIONAL — token-only, single-binding `fonts.ts`, no lock. OPEN decisions (session-invalidation, OTP mechanics, Sightengine config, Redis, realtime transport) are NOT touched.

---

## 0. Scope guardrails (read first)

**Builds:**
- `/` route = Landing (PUB-001), **Deep** environment.
- Landing composition: hero (display type), campus context, contour signature (strongest), entry-to-discovery.
- Contour bound to `ActivityRepo` via the existing `packages/data` boundary.
- Dev-only, clearly-labeled activity seed so the contour is *demonstrably meaningful* in local dev (never shipped as product truth).
- Continuity *source* structure (so Slice 2's Explore transition can carry the contour — Doc 06 §2).

**Does NOT build (explicit exclusions — verified by audit):**
- Explore page, browse grid, listing tiles (Slice 2).
- Auth / login / register / OTP (Slice 5). No login form on Landing (PG-PUB-001 forbids it).
- Messaging / native chat (Slice 7).
- Storefront / vendor dashboard / staff (Slices 4/6/8).
- **3D / WebGL** — experimental (Doc 05 D.9), **absent** from Slice 1. A Landing 3D contour experiment is only *considered later* if it demonstrably improves arrival; otherwise cut. Plan asserts 3D is not present.
- Premature Landing→Explore *transition animation* (only structure the carry; the transition itself is Slice 2's gate).
- Generic "marketing landing page" drift: no signup CTA, no hero bullet features, no testimonials, no floating-card soup, no glassmorphism, no excessive gradients.
- No silently locking fonts/palette (remain PROVISIONAL, token-only).
- No resolving any OPEN decision.

---

## 1. The contour-meaning tension (REVIEW ITEM — does not block, but needs your eyes)

Doc 06 §2 gate: *"contour meaningful (real-ish activity data)"*. You also require *"no invented activity"* / *"no fake contour activity/geography"*.

**Resolution in this plan:**
- The contour is driven by `ActivityRepo.recent(campusZone)` — the **real data boundary** already defined in `packages/data` (Doc 07 §7.6/§7.7). No fabricated geography; `campusZone` is a neutral placeholder string, never a drawn map.
- **Production behavior:** `ActivityRepo` returns real events from the backend (Phase 9). Until then the mock returns `[]` → **zero nodes, zero motion** (D.5). This is the *honest* state and is itself the meaningful behavior (no fake liveliness).
- **Dev-only seed:** a clearly-labeled `lib/activitySource.ts` gated behind a non-production flag (e.g. `NEXT_PUBLIC_DEV_SEED !== 'false'` in dev only) returns `ActivityEvent[]` shaped exactly like the real contract (id, type, campusZone, refId, ts). It represents the *kind* of data the backend will deliver — it is **never** presented as live product data and is stripped from production builds. Purpose: let us *verify the mechanism* and see the arrival with contour present during development.
- **Two e2e assertions cover both sides:** (a) empty repo → zero nodes (proves no invented activity ships); (b) seeded repo → nodes render with `campusZone`/`refId` meaning (proves contour is meaningful). Both gates hold simultaneously.
- If you'd rather Slice 1 ship with the contour *empty by default even in dev* (purest "no invented activity"), say so and I drop the dev seed — the gate then reduces to "zero nodes, mechanism proven by unit test."

---

## 2. Tasks (bite-sized, TDD)

> Each task: write failing test → run to confirm fail → implement minimal → run to confirm pass → commit. Reuse Slice 0 infra; do not rebuild it.

### Task 1: Route — `/` becomes Landing (Deep), styleguide stays dev-only
**Objective:** Landing renders at `/` in Deep; `/styleguide` remains a dev/QA artifact (not a product page).
**Files:**
- Modify: `apps/web/app/page.tsx` (replace the `redirect("/styleguide")` with the Landing composition root carrying `data-env="deep"`).
- Keep: `apps/web/app/styleguide/page.tsx` (note in code comment: dev/verification artifact, not in Doc 04 IA).
**Step 1 (test):** `apps/web/tests/e2e/landing.spec.ts` — `goto("/")` → expect `document.querySelector("main, [data-env]")` to have `data-env="deep"`; expect page NOT to redirect to `/styleguide` (assert `location.pathname === "/"`).
**Step 2:** run `npx playwright test landing.spec.ts` → FAIL (currently redirects).
**Step 3 (impl):** rewrite `page.tsx` to render `<main data-env="deep">…Landing…</main>` (composition filled in Tasks 2–4).
**Step 4:** run → PASS.
**Step 5:** commit `feat(slice1): / is Landing (Deep); styleguide retained as dev artifact`.

### Task 2: LandingHero — display typography + one-time arrival motion
**Objective:** Brand arrival moment using display type; motion has a *cause* (arrival) = single entrance then rest.
**Files:** Create `apps/web/components/landing/LandingHero.tsx`. Use `@voeq/ui` `Type tone="display"`. Arrival motion: CSS `transform`/`opacity` entrance, one-shot (no loop), respects `prefers-reduced-motion` (global rule already collapses transitions).
**Step 1 (test):** unit `apps/web/tests/landing.test.ts` — render `LandingHero`, assert it contains display-type text; assert no `animation-iteration-count: infinite` computed style.
**Step 2:** run Vitest → FAIL.
**Step 3 (impl):** component with display `Type` + one-shot entrance class.
**Step 4:** run Vitest → PASS.
**Step 5:** commit `feat(slice1): LandingHero display type + arrival entrance`.

### Task 3: CampusContext — real-boundary campus block, graceful default
**Objective:** Show campus context (PG-PUB-001) sourced from the data boundary; if no data, show default campus + non-blocking notice (the doc's campus-service-fail path, satisfied vacuously now).
**Files:** Create `apps/web/components/landing/CampusContext.tsx`; bind to a `CampusRepo`/default from `packages/data` (use existing mock; add a `mockCampusRepo` returning a single default campus if not present). No fake specificity — neutral campus label.
**Step 1 (test):** unit — `CampusContext` renders a campus label; with empty repo renders default + retry notice element present (non-blocking).
**Step 2:** FAIL. **Step 3:** impl. **Step 4:** PASS. **Step 5:** commit.

### Task 4: ContourSignature — strongest contour, data-gated, one soft pulse
**Objective:** Landing's signature contour (strongest per Doc 05/07 §7.6): `ContourEdge` at section boundaries + `ActivityNode`(s) from `ActivityRepo`, each pulsing **once then static** (D.5), reduced-motion → static. Zero events → zero nodes.
**Files:**
- Create `apps/web/components/landing/ContourSignature.tsx` (client) — binds `useContourData`/`resolveContourData` fed by `ActivityRepo`.
- Create `apps/web/lib/activitySource.ts` — dev-only seed (REVIEW ITEM §1); production returns `[]`.
**Step 1 (test — the core gate):** unit `apps/web/tests/landing.test.ts`:
  - `resolveContourData([])` → `ActivityNode` count 0 (no invented activity).
  - `resolveContourData([{id, campusZone:"campus:default", refId:"x", intensity:0.6}])` → exactly 1 node, carries `campusZone`.
**Step 2:** FAIL. **Step 3:** impl. **Step 4:** PASS.
**Step 5:** commit `feat(slice1): ContourSignature data-gated, one-pulse, dev-seed`.

### Task 5: EntryToDiscovery — link to `/explore` (no auth, no grid)
**Objective:** The only primary action on Landing: entry to discovery (PG-PUB-001). A link/button to `/explore` — **not** a login form, **not** a browse grid.
**Files:** Create `apps/web/components/landing/EntryToDiscovery.tsx` (uses `@voeq/ui` `Button` as a link).
**Step 1 (test):** e2e — Landing contains an entry element linking to `/explore`; Landing contains **no** `input[type=password]`, no login form, no listing-grid container.
**Step 2:** FAIL. **Step 3:** impl. **Step 4:** PASS. **Step 5:** commit.

### Task 6: Environment + regression assertions (Doc 10)
**Objective:** Enforce Doc 10 gates: Landing is Deep; no environment leak; contour meaningful-empty; motion finite; reduced-motion; 3D absent; mobile+desktop.
**Files:** Extend `apps/web/tests/e2e/landing.spec.ts`:
- assert `data-env="deep"` on landing root.
- assert **zero** `ActivityNode` when repo empty (prod path) — proves no invented activity ships.
- assert **nodes present with meaning** when dev seed active (dev path) — proves contour meaningful.
- assert no infinite/idle animation loops (D.8).
- assert reduced-motion → contour pulse static, transitions collapsed.
- assert **no `canvas`/WebGL/Three** element present (3D absent, D.9).
- assert renders at 375px and 1280px.
**Step 1–4:** write → run → fail → implement (mostly composition wiring) → pass.
**Step 5:** commit `test(slice1): Landing environment + contour + motion + 3D-absent gates`.

### Task 7: Performance gate (extends Slice 0 probe)
**Objective:** Landing with contour must not regress Slice 0's perf baseline; the one soft pulse must not loop.
**Files:** Extend `apps/web/tests/e2e/performance.spec.ts` (or add `landing.perf.spec.ts`) using `performance.probe.ts`:
- normal + 4× throttle: **0 long tasks**, **0 layout/paint churn** during 10s window that includes the arrival pulse.
- FCP budget (throttled) recorded; floor per `PERFORMANCE_GATE.md` (Slice 1: FCP < 1.5s throttled; sustained FPS ≥ 50 during pulse; exact Android number UNMEASURED, noted).
**Step 5:** commit `test(slice1): Landing performance gate extends Slice 0 baseline`.

### Task 8: Full verification + audit + STOP
**Objective:** All gates green; produce intent-vs-implementation audit; stop for sign-off.
**Commands (all must pass):**
- `npm run typecheck` (5 workspaces)
- `npm run lint`
- `npm run test` (Vitest unit)
- `npm run build`
- `npx playwright test` (e2e, includes landing + perf)
**Step:** run; if any fail, fix; re-run. Then write the three-part audit (Blueprint / Actually built / Gap-deviation) + gate table + verdict, and **STOP**.

---

## 3. Files likely to change

| Action | Path |
|---|---|
| Modify | `apps/web/app/page.tsx` (Landing root, `data-env="deep"`) |
| Create | `apps/web/components/landing/LandingHero.tsx` |
| Create | `apps/web/components/landing/CampusContext.tsx` |
| Create | `apps/web/components/landing/ContourSignature.tsx` |
| Create | `apps/web/components/landing/EntryToDiscovery.tsx` |
| Create | `apps/web/lib/activitySource.ts` (dev-only seed, REVIEW §1) |
| Create/Modify | `packages/data/src/mock.ts` (add `mockCampusRepo` if needed) |
| Create | `apps/web/tests/landing.test.ts` (unit) |
| Create/Modify | `apps/web/tests/e2e/landing.spec.ts` (e2e) |
| Modify | `apps/web/tests/e2e/performance.spec.ts` (perf gate) |

No changes to: `tokens.css`, `fonts.ts`, `@voeq/ui`, `@voeq/contour` primitives, root configs. (Slice 0 packages reused as-is — adding product composition only.)

---

## 4. Verification matrix (maps to Doc 10)

| Gate (source) | How verified |
|---|---|
| Landing = Deep, no env leak (Doc 05 A.3, Doc 10 §54) | e2e: `data-env="deep"` on `/`; assert not on future Cream routes |
| Contour meaningful, no invented activity (Doc 07 §7.6, Doc 10 §63) | unit: empty→0 nodes; seeded→nodes w/ campusZone. e2e: prod path 0 nodes; dev path meaningful |
| Motion = cause→rest, no perpetual (Doc 05 D.1/D.5, Doc 10 §66) | e2e: no infinite loops; arrival = one-shot; node pulse one-shot |
| Reduced-motion (Doc 05 D.8, Doc 10 §159/198) | e2e: transitions collapsed; pulse static |
| 3D absent (Doc 05 D.9, Doc 10 §199) | e2e: no canvas/WebGL/Three |
| Mobile + desktop (Doc 04 LOCKED, Doc 10 §167) | e2e: 375px + 1280px render |
| Performance baseline held (Slice 0 → 1, Doc 10 §167/171) | e2e perf: 0 longtasks, FCP<throttled budget, FPS≥50 during pulse |
| Cumulative regression (Doc 10 §220) | Slice 0 gates re-run green in same suite |
| Continuity *source* (Doc 06 §2, D.4.1) | Structure only this slice; the continuity *test* is Slice 2's gate (noted, not built) |

---

## 5. Risks / tradeoffs / open questions for review

1. **REVIEW ITEM (§1):** dev-only contour seed vs. ship-empty-even-in-dev. Your call — both are plan-supported.
2. **Campus context is a placeholder:** no campus service exists; we render a neutral default + retry-notice structure. Real campus data is Phase 9. Not a product decision, just plumbing.
3. **`/styleguide` retention:** kept as a dev/QA artifact, explicitly *not* a Doc 04 product page. If you'd rather remove it now that Landing exists, say so.
4. **No real backend:** all data is mock/empty; the contour's "meaningful" path is proven via the dev seed + unit shape, not live data. This is honest and expected at Slice.
5. **Continuity to Explore is structured, not animated:** the actual Landing→Explore transition (contour-carry) is Slice 2's gate (Doc 06 §2). We do not pre-build it.
6. **No OPEN decision resolved:** session-invalidation, OTP, Sightengine, Redis, realtime transport untouched. The dev seed is data plumbing, not a product/security decision.

---

## 6. Done condition (Slice 1 PASS)

All of: typecheck/lint/unit/build green; e2e proves Landing is Deep, contour is meaningful-but-never-invented, motion is finite + reduced-motion-clean, 3D absent, mobile+desktop render, perf baseline held; intent-vs-implementation audit shows no forbidden surface, no OPEN resolved, no premature scope. Then **STOP for founder sign-off** — no Slice 2 until approved.
