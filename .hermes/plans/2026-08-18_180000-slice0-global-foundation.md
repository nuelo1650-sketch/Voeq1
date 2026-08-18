# Slice 0 — Global Foundation Implementation Plan

> **For Hermes:** Use subagent-driven-development to implement this plan task-by-task. Do NOT begin until
> the founder signs off (Doc 06 §6: Slice 0 proceeds only after founder vetting). This plan establishes
> FOUNDATION ONLY — no product surface, no Landing page.

**Goal:** Stand up the Voeq monorepo with Next.js + React + TypeScript + Tailwind, the design-token system
(Doc 05), role-based CSS variables (Deep/Cream environments), contour primitives, mock-data package boundary,
and testing/lint/type-check/build infrastructure — verifiable via a static styleguide that flips between
both environments and honors reduced-motion + 60fps.

**Architecture:** npm-workspaces monorepo (pnpm absent on this host → npm workspaces, zero extra deps).
Packages: `design-tokens` (roles/hex, PROVISIONAL per B.1/B.2), `ui` (components/primitives consuming
tokens), `contour` (line ≤12% opacity edges, activity node, campus fingerprint + data-gating stub),
`data` (mock repos; mock→real boundary per Doc 07 §7.7). App: `apps/web` (Next.js App Router). Role flip =
CSS custom-property swap on `:root[data-env="deep"|"cream"]`, NOT a second theme. QC principle (Doc 05,
enforceable in gate): implementation convenience never overrides locked design/product.

**Tech Stack:** Node v22.23.1, npm 10.9.8, git 2.55 (verified present). Next.js 15 (App Router), React 19,
TypeScript 5, Tailwind CSS 4 (or 3 if pin preferred — DECISION below), Vitest + Playwright, ESLint,
Prettier. Fonts: Fraunces (display) + Hanken Grotesk (UI) — PROVISIONAL per B.2, wired as CSS vars.

**Locked constraints this plan must NOT violate:**
- Monorepo + role-token + six-dimension components keep Doc 05 authority (Doc 06 §4 risk table).
- Tokens render in BOTH environments via role flip; no second theme (Doc 06 §3 gate).
- Contour/activity only where content warrants (B.12/A.12); no decoration without cause (D.1).
- Motion follows cause→…→rest; reduced-motion + 60fps-mid-Android hold (D.7/D.8). Slice 0 has NO perpetual
  animation; contour primitives are static-capable.
- Storefront stress (B.16) is a Slice 4 gate, not Slice 0 work — do NOT build listings here.
- Exact palette hex / font pairing = PROVISIONAL, adjustable in real composition — do NOT over-fit.
- Mock→real data boundary intact: UI imports interfaces, never implementation (Doc 07 §7.7).

---

## Current context / assumptions

- Repo path: `C:/Users/Legacy/Documents/voeq/`. Currently contains `docs/` (blueprint 00–13, PASS),
  `batch-01/` (legacy recovery evidence), legacy `.docx`/`.zip` assets. **Not a git repo. No code.**
- Toolchain verified: Node v22.23.1, npm 10.9.8, npx, git 2.55. pnpm NOT installed.
- Authoritative specs: Doc 06 §2 (Slice 0, lines 59–67) + §3 (verification gate, 124–135); Doc 05
  B.1–B.4, B.11–B.12, D.1/D.7/D.8; Doc 07 §7.7 (mock boundary), §7.9 (auth arch, not built yet).
- No decisions locked on: exact Tailwind major version, workspace tool (npm chosen by default), test
  runner specifics. These are flagged as DECISIONS, not silent choices.

---

## Proposed approach

1. Init git + npm-workspaces root. No commits of docs changes (they're the blueprint, separate concern).
2. Scaffold `apps/web` as Next.js App Router (TypeScript, Tailwind, ESLint, no `src/` confusion).
3. Build `packages/design-tokens` with role-based CSS variables for BOTH environments + 8pt spacing,
   12-col grid, 4px radius, container rule (B.3/B.4). Hex PROVISIONAL.
4. Build `packages/ui` primitives that consume tokens (no premature component explosion — only the
   foundation primitives the gate needs: layout grid, stack, surface, type scale, focus ring).
5. Build `packages/contour` with the three primitives (line edges ≤12% opacity, activity node, campus
   fingerprint) + a data-gating stub (renders nothing meaningful without real activity data — B.12).
6. Build `packages/data` with the typed repo interfaces (Doc 07 §7.8/§7.7) + a mock implementation
   (B.16-shaped fixtures live here later; Slice 0 just defines the boundary + a trivial mock).
7. Static styleguide route `/styleguide` in `apps/web` that: renders tokens in both environments, flips
   via a role toggle (data-env), shows reduced-motion + 60fps observable. NO product page.
8. Wire testing (Vitest unit + Playwright for the styleguide gate), lint, type-check, build.
9. Verify against the §3 gate. Report. STOP. Await founder sign-off before Slice 1.

---

## Step-by-step plan

### Task 1: Initialize git repo + npm-workspaces root
**Objective:** Create the monorepo root with workspaces config; no code yet.
**Files:**
- Create: `C:/Users/Legacy/Documents/voeq/package.json` (root, `private:true`, `workspaces:["apps/*","packages/*"]`)
- Create: `C:/Users/Legacy/Documents/voeq/.gitignore` (node_modules, .next, dist, coverage)
- Create: `C:/Users/Legacy/Documents/voeq/README.md` (one line: Voeq monorepo — Slice 0 foundation)
**Step 1:** `cd C:/Users/Legacy/Documents/voeq && git init`
**Step 2:** Write root `package.json` (name `voeq`, private, workspaces).
**Step 3:** `git add -A && git commit -m "chore: init monorepo root (npm workspaces)"`
**Verify:** `git log --oneline` shows the commit; `cat package.json` shows workspaces array.

### Task 2: Scaffold Next.js app (`apps/web`)
**Objective:** Working Next.js 15 App Router app, TypeScript, Tailwind, ESLint.
**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.mjs`,
  `apps/web/tailwind.config.ts` (or v4 css-based), `apps/web/postcss.config.mjs`,
  `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` (temporary placeholder, replaced by styleguide in Task 7),
  `apps/web/app/globals.css`
**Step 1:** `cd apps/web && npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` (run in empty dir; accept prompts)
**Step 2:** Verify dev server boots: `npm run dev` (background) → curl localhost:3000 returns 200 → kill.
**Step 3:** Commit.
**Verify:** `npm run build` succeeds in `apps/web`.

### Task 3: Create `packages/design-tokens`
**Objective:** Role-based CSS variable tokens for both environments + spacing/grid/radius foundations.
**Files:**
- Create: `packages/design-tokens/package.json`, `packages/design-tokens/tokens.css`
  (`:root` default = Cream; `:root[data-env="deep"]` = Deep overrides; B.1 roles, B.3 8pt spacing,
  B.4 12-col grid + 4px radius + container), `packages/design-tokens/index.ts` (re-export + TS types)
**Step 1:** Define `tokens.css` with PROVISIONAL hex (forest-green/cream/gold per Voeq palette intent),
  spacing scale (--space-1 = 8px …), grid vars (--grid-cols:12, --radius:4px, --container-max).
**Step 2:** `:root[data-env="deep"]` block overrides color roles only (NOT spacing/grid — those are shared).
**Step 3:** Commit.
**Verify:** `cat tokens.css` shows both `:root` and `[data-env="deep"]`; no hardcoded hex outside the var system.

### Task 4: Create `packages/ui` (foundation primitives only)
**Objective:** Minimal token-consuming primitives — NO premature component explosion.
**Files:**
- Create: `packages/ui/package.json` (depends on `design-tokens`), `packages/ui/src/index.ts`,
  `packages/ui/src/Grid.tsx` (12-col, container-aware), `packages/ui/src/Stack.tsx` (spacing scale),
  `packages/ui/src/Surface.tsx` (environment surface bg via token), `packages/ui/src/Type.tsx`
  (display/UI font roles), `packages/ui/src/FocusRing.tsx` (B.8 2px accent-strong ring)
**Step 1:** Each primitive reads CSS vars only (no hardcoded values).
**Step 2:** Commit.
**Verify:** `tsc --noEmit` in `packages/ui` passes; no token value hardcoded in component bodies.

### Task 5: Create `packages/contour` (primitives + data-gating stub)
**Objective:** Three contour primitives, static-capable, gated on real data (B.12/A.12).
**Files:**
- Create: `packages/contour/package.json`, `packages/contour/src/index.ts`,
  `packages/contour/src/ContourEdge.tsx` (line ≤12% opacity edges), `packages/contour/src/ActivityNode.tsx`,
  `packages/contour/src/CampusFingerprint.tsx`, `packages/contour/src/useContourData.ts` (stub: returns
  null without real activity data → renders nothing meaningful, satisfying "no decoration without cause")
**Step 1:** Implement primitives to draw with ≤12% opacity edges; `useContourData` returns `null` by default.
**Step 2:** Commit.
**Verify:** `tsc --noEmit` passes; primitive with no data renders an empty/neutral node (no fake geo).

### Task 6: Create `packages/data` (mock boundary)
**Objective:** Typed repo interfaces + trivial mock; UI imports interface, never impl (Doc 07 §7.7).
**Files:**
- Create: `packages/data/package.json`, `packages/data/src/index.ts`,
  `packages/data/src/interfaces.ts` (ListingsRepo, VendorsRepo, ActivityRepo, AuthRepo, MessagesRepo,
  StaffRepo, SearchRepo — signatures only, per Doc 07 §7.7/§7.8),
  `packages/data/src/mock.ts` (trivial in-memory impl returning empty/shape-correct data)
**Step 1:** Define interfaces matching Doc 07 §7.7 list exactly.
**Step 2:** `mock.ts` returns empty arrays / shape-correct stubs (B.16 fixtures added in Slice 4, NOT here).
**Step 3:** Commit.
**Verify:** `tsc --noEmit` passes; `apps/web` can `import type { ListingsRepo } from '@voeq/data'`.

### Task 7: Static styleguide route (`/styleguide`)
**Objective:** Gate artifact — tokens render in both environments, role flip works, reduced-motion + 60fps observable. NO product page.
**Files:**
- Modify: `apps/web/app/page.tsx` → redirect or render the styleguide (rename to `apps/web/app/styleguide/page.tsx`; root page shows a holding note linking to /styleguide)
- Create: `apps/web/app/styleguide/page.tsx` (renders token swatches, both env roles, a Grid/Stack/Surface/Type/FocusRing demo, a ContourEdge demo, an env-flip toggle setting `document.documentElement.dataset.env`)
- Modify: `apps/web/app/globals.css` to import `@voeq/design-tokens/tokens.css`
**Step 1:** Styleguide renders a role-toggle button that flips `data-env` on `<html>`.
**Step 2:** Confirm both Cream (default) and Deep (toggle) show distinct token values via CSS vars only.
**Step 3:** Commit.
**Verify:** `npm run dev` → /styleguide shows both environments via toggle; no second theme file exists.

### Task 8: Testing + lint + type-check + build infrastructure
**Objective:** Quality gates run green; Slice 0 verifiable.
**Files:**
- Create: `apps/web/vitest.config.ts`, `packages/*/vitest.config.ts` (or root), `apps/web/playwright.config.ts`,
  `apps/web/tests/styleguide.spec.ts` (Playwright: loads /styleguide, asserts Deep vs Cream token delta,
  asserts reduced-motion media query respected, asserts no perpetual animation),
  `apps/web/eslint.config.mjs` (extends next/core-web-vitals), root `tsconfig.base.json`
**Step 1:** Add `test` (vitest), `e2e` (playwright), `lint`, `typecheck`, `build` scripts to root `package.json`.
**Step 2:** Write the Playwright styleguide spec asserting the gate (§3): both envs via role-flip, tokens from Doc 05, reduced-motion holds, mobile+desktop viewport both render.
**Step 3:** Commit.
**Verify:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm run e2e` all green.

### Task 9: Verify against Doc 06 §3 gate + report
**Objective:** Confirm Slice 0 meets its gate; STOP for founder sign-off.
**Files:** None new.
**Step 1:** Walk the §3 checklist:
- [ ] Renders in both environments via role-flip (no second theme) — Task 7
- [ ] Uses Doc 05 tokens/components; QC principle not violated — Tasks 3–4
- [ ] Contour/activity only where content warrants (data-gating stub returns null) — Task 5
- [ ] Motion follows cause→rest; reduced-motion + 60fps observable — Task 8 spec
- [ ] Mobile + desktop both verified — Task 8 Playwright viewports
- [ ] Imperfect-content test — N/A at Slice 0 (no storefront); noted
- [ ] Maps to Doc 04 page ID + Doc 02 req IDs — styleguide is foundation, not a page; noted
- [ ] Founder review confirms before next slice — THIS STEP
**Step 2:** Report PASS/FAIL with evidence (build log, e2e result).
**Step 3:** AWAIT FOUNDER SIGN-OFF. Do not start Slice 1.

---

## Files likely to change (summary)
- Root: `package.json`, `.gitignore`, `README.md`, `tsconfig.base.json`
- `apps/web/`: Next.js scaffold + `app/styleguide/page.tsx`, `app/globals.css`, test configs
- `packages/design-tokens/`, `packages/ui/`, `packages/contour/`, `packages/data/`: new packages

## Tests / validation
- Unit (Vitest): token package exports, contour data-gating returns null without data, data interfaces compile.
- E2E (Playwright, `apps/web/tests/styleguide.spec.ts`): /styleguide loads; Deep vs Cream token delta present;
  `prefers-reduced-motion` respected; no infinite animation; mobile (375px) + desktop (1280px) both render.
- Build: `npm run build` green across workspace.

## Risks, tradeoffs, open questions
- **Tailwind major version:** v4 (css-first, newer) vs v3 (mature, config file). Propose v4 unless you prefer v3.
- **Workspace tool:** npm workspaces chosen because pnpm absent. If you want pnpm, install it first.
- **Font loading:** Fraunces/Hanken Grotesk via `next/font/google` (PROVISIONAL per B.2) — requires network at build; flag if offline build needed.
- **No premature components:** deliberately only foundation primitives. Listing/storefront/auth components come in later slices.
- **Mock data:** B.16 fixture (15 listings, ≥5 imperfect) is a Slice 4 concern; Slice 0 mock returns empty shapes only.
- **3D:** explicitly absent from Slice 0–8 (D.9 experimental). Not touched.

## DECISIONS REQUIRED BEFORE EXECUTION (not silent choices)
1. Tailwind v4 vs v3? (propose v4)
2. npm workspaces OK (pnpm absent)? (propose yes)
3. Fonts via `next/font/google` acceptable (needs network at build)? (propose yes; fallback = system stack)
4. Package scope names: `@voeq/design-tokens`, `@voeq/ui`, `@voeq/contour`, `@voeq/data`, app `apps/web`? (propose yes)
