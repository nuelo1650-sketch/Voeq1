# VS1 — Remaining Work Plan (single consolidated plan)

**Status:** DRAFT — for founder sign-off.
**Purpose:** consolidate the *scope + order* of all remaining VS1 (Public Surface) work so execution is no longer vague. Execution still proceeds chunk-by-chunk under the existing gate (INVESTIGATE → PLAN → SIGN-OFF → CODE); this document is the map, not a license to skip sign-offs.

**Source of truth:** `docs/project-blueprint/05-DESIGN_SYSTEM_AND_VISUAL_DIRECTION.md` + `vs1-vs7-expanded.md` + `landing-visual-direction-remediation.md`.

---

## Locked specs carried forward (do NOT regress)
- Wordmark display: `clamp(5rem, 14vw, 8rem)` (Type.tsx, LOCKED).
- Contour field: 220px, `min-width: 320px` floor (Doc 05 C.9).
- No `backdrop-filter` / glassmorphism (B.5) — frosted = translucent solid + inset shadow.
- Contour communicates, never manufactures (A.1/A.18): no animation without data behind it.
- `prefers-reduced-motion` honored everywhere.
- Fraunces proposed-display only; no Inter.
- Student Vouched language (no WhatsApp). ₦/en-NG currency (Chunk 7).
- Single `CAMPUS_OPTIONS` source; NMU default + Kurutie/Okerenkoko toggle (Conflict B).

---

## Already DONE (committed)
- Landing chunks 1–3 → `85dbbb1` (atmosphere + 55/45 + wordmark), `3122efa` (frosted contour panel + SVG self-draw).
- Listing detail `/listing/[id]` (PG-PUB-005) → built earlier (`2f33b20`).

---

## Remaining work, in proposed execution order

### Batch A — Finish the Landing page (chunks 4–6)
- **Chunk 4 — Inline Campus Selector** (`CampusContext.tsx`): sentence skin *"Discover what's open near [NMU ▼]"*. No card. NMU default + Kurutie/Okerenkoko toggle (Conflict B); UNILAG, UI, OAU, Covenant, FUTO. Preserve `data-testid="campus-selector"`. Wire selector → CTA + listing filter.
- **Chunk 5 — Trust Strip** (new `TrustStrip.tsx`): data-bound `{vendorCount} · {campusCount} · {studentConnections}`. `campusCount = CAMPUS_OPTIONS.length`; `vendorCount` + `studentConnections` from a mock data boundary module (approved Chunk 5 mockData proposal). ZERO literals. Student-Vouched language only.
- **Chunk 6 — CTA + Signature Footer** (`EntryToDiscovery.tsx`, `LandingFooter.tsx`): warm-shadow accent button, hover lift + arrow micro-interaction; footer centered, contour-line border (1px low-opacity), middot separators.

### Batch B — Landing merge + polish + e2e (chunks 7–8)
- **Chunk 7 — Merge + Polish**: merge `DiscoveryProposition` tagline into hero left col; ₦/en-NG currency (replace R/en-ZA in ListingDetail + anywhere self-flagged); SVG hamburger/close icons (replace ☰/✕).
- **Chunk 8 — Expand e2e** (`landing.spec.ts`, `landing.perf.spec.ts`): assert atmosphere layers, 55/45 ratio, wordmark animation, inline (not card) selector, contour lines, trust strip (data-bound, no literals), zero hardcoded numbers; full suite + `tsc` + `next build` green.

### Batch C — Explore + Category (Editorial, Slice 2)
- **Explore `/explore` (PUB-002)**: listing grid (B.16: 15 listings, ≥5 imperfect photos, mixed editorial rows + image-led grids, zero card-monotony); URL-param filters (shareable); weighted trending; contour edge-whisper (A.12).
- **Category `/category/[slug]` (PUB-003)**: Explore variant; slug edge-cases (not just campus-slug). Needs the 15-listing fixture (Doc 07 §162) — flag if absent.

### Batch D — Storefront (Editorial, Slice 4, B.16 stress) `/vendor/[id]` (PUB-004)
- Deep hero + Cream body; campus fingerprint (real geo or absent); native message CTA; same B.16 stress (15 listings, zero card-monotony). Heaviest page — build AFTER info pages.

### Batch E — Info pages
- **Terms `/terms` (PUB-007) + Privacy `/privacy` (PUB-008)**: Functional consent destinations. Versioned, linked from IDN-009. Placeholder copy with `<!-- PLACEHOLDER -->` (approved) until real legal copy lands.
- **About `/about` (PUB-006), Help `/help` (PUB-009), For-Vendors `/for-vendors` (PUB-010), Press `/press` (PUB-011)**: Editorial static. **Deferred** (approved) — no spec/copy; placeholder or out-of-scope until founder says go.

---

## Cross-cutting verification (every batch)
- `npm run typecheck -w apps/web` → exit 0
- `npx playwright test tests/e2e/...` → green
- `next build` → green before unblocking next slice
- Manual: a11y, currency, motion, Student-Vouched language, no glassmorphism

---

## Open items (flagged, not blockers)
1. Storefront 15-listing fixture source (Doc 07 §162).
2. Info-page copy (placeholder approved; real copy = separate draft).
3. Press/Careers deferred (no spec).
4. Re-consent on Terms update = UNDECIDED policy (Doc 08/09) — flag, don't build.

---

## Execution gate
- Landing chunks 4–8 keep per-chunk sign-off.
- Explore/Category/Storefront/Info move in Batches C–E; each batch gets its own plan review before code.
- No code past a batch's plan without sign-off.
