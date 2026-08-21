# Plan — Landing Visual Direction Remediation (Doc 05 A.19)

**Status:** PLANNED — gated on 5 founder decisions before Chunk 1.
**Source of truth:** `docs/project-blueprint/05-DESIGN_SYSTEM_AND_VISUAL_DIRECTION.md` §A.19 (read in full, lines 523–565) + Part B/C grammar.
**NOT built from:** the audit's paraphrased numbers — several diverge from the locked doc (see deviation table).

---

## Audit verdict (verified against actual files)

The audit's *code-side* drift claims are **correct** — confirmed by reading the files on `2f33b20`:
- `LandingHero.tsx` plain `<span>Voeq</span>`, no animation, no `<h1>`
- `ContourSignature.tsx` `FIELD = 220`, no lines/guide
- `CampusContext.tsx` `Surface` card w/ SA campuses
- `LandingShell.tsx` single centered `Column span={12}`
- `globals.css` no atmosphere layers
- `EntryToDiscovery.tsx` plain button, no arrow/hover
- `LandingFooter.tsx` old left-aligned flex

**Root cause:** I implemented the 4 *founder calls* (8rem wordmark, contour min-width, Student Vouched, mobile overlay) + Slice 3, and let "tests pass" imply the broader A.19 visual direction was done. It wasn't. Communication failure — owned.

## Audit spec vs locked doc (the audit is WRONG on these — do NOT build to them)

| Audit says | Locked Doc05 A.19 actually says |
|---|---|
| Contour field "380×420px" | "right **45%** = contour field" (no px) |
| "7:5 split" | "left **55%** / right **45%**" |
| Wordmark "45ms stagger, 700ms" | "staggered character fade-up … **~2s total**, first arrival only" |
| "circular guide (compass ring)" | **Not in spec** — "SVG self-draw when data exists, calm heartbeat empty-state" |
| "Inter Tight Bold, tracking 0.02em" | Fraunces 600, tracking **-0.04em** (Fraunces is *proposed*, not locked) |

Remediation builds from the **doc**, not the audit's paraphrase.

---

## Already Done (no rework)

- 8rem wordmark ceiling (`packages/ui/src/Type.tsx`)
- Contour `min-width: 320px` desktop floor (`globals.css`)
- "Student Vouched" rename (`ListingCard.tsx`, `Filters.tsx`, `ListingDetail.tsx`)
- Mobile overlay nav (`LandingNav.tsx` + `globals.css`, wired + tested)
- `ContourEdge` `intensity` prop
- Slice 3 Listing Detail (`/listing/[id]`, PG-PUB-005) — pushed `0c47218`/`2f33b20`

---

## 8 Chunks (each: edit → `tsc` → Playwright → checkpoint)

| # | Chunk | What | Files |
|---|---|---|---|
| 1 | **Atmosphere + Asymmetric Layout** | Static amber radial glow (upper-left) + deep-green vignette (lower-right) + ≤3% SVG grain (multiply). 55/45 grid split in `LandingShell`. No ambient drift. Cream base `#f7f4ec`. | `LandingShell.tsx`, `globals.css` |
| 2 | **Wordmark Entrance** | Char-split "V o e q" fade-up (~2s total, locked ease, first-arrival only). `prefers-reduced-motion` → instant. Wrap in `<h1>` (semantic fix). | `LandingHero.tsx`, `globals.css` |
| 3 | **Contour Hero Redesign** | Frosted panel in 45% column (translucent surface, **no `backdrop-blur`** per B.5). SVG self-draw connecting lines when data exists. Single calm-pulse dot + honest empty copy when no activity. | `ContourSignature.tsx`, `globals.css` |
| 4 | **Inline Campus Selector** | Sentence skin *"Discover what's open near [NMU ▼]"*. No card. Nigerian campuses (NMU default w/ Kurutie/Okerenkoko toggle per Conflict B; UNILAG, UI, OAU, Covenant, FUTO). Preserve `data-testid="campus-selector"`. | `CampusContext.tsx` |
| 5 | **Trust Strip** | Data-bound `{vendorCount} · {campusCount} · {studentConnections}`. No literals. Student-Vouched language only. | New `TrustStrip.tsx`, mock data boundary |
| 6 | **CTA + Signature Footer** | Warm-shadow accent button, hover lift + arrow micro-interaction. Footer: centered, contour-line border (1px, low opacity), middot separators. | `EntryToDiscovery.tsx`, `LandingFooter.tsx`, `globals.css` |
| 7 | **Merge + Polish** | Merge `DiscoveryProposition` tagline into hero left col. ₦/en-NG currency (replace `R`/en-ZA). SVG hamburger/close icons (replace `☰`/`✕`). | `LandingHero.tsx`, `ListingDetail.tsx`, `LandingNav.tsx` |
| 8 | **Expand e2e** | Assert: atmosphere layers, 55/45 ratio, wordmark animation, inline (not card) selector, contour lines, trust strip, footer. Full suite + `tsc` + build all green. | `landing.spec.ts`, `landing.perf.spec.ts` |

---

## 5 Founder Decisions (BLOCKING — Chunk 1 waits on these)

| # | Question | Options | Hermes Rec |
|---|---|---|---|
| 1 | **Inline-style scope** | A) Fix only semantic/a11y/currency, leave inline-style arch (fastest). B) Refactor to CSS modules as touched (slower, cleaner). | **A** — separate CSS-module pass later; doc mandates visual output |
| 2 | **Contour field size** | Doc says "45% column" (no px). Fill column w/ 320px floor, or fixed desktop px? | **Fill 45% column** — responsive, no arbitrary px |
| 3 | **Trust-strip data** | `vendorCount`=mock vendors · `campusCount`=`CAMPUS_OPTIONS.length` · `studentConnections`=derived from mock vouch events OR hidden if no source | **Derived from mock** — shows mechanism, no lies |
| 4 | **Circular guide** | Not in A.19 spec. Drop, or add as nicety? | **Drop it** — spec is law |
| 5 | **Sign-off rhythm** | Chunk-by-chunk checkpoints (review after each), or one "Go" for all 8 then single review? | **Chunk-by-chunk** — recommended after the drift we caught |

### Spec facts already confirmed (no decision needed)
- **Campus list IS in the doc** (A.19 line 547): "Examples Nigerian (NMU default; UNILAG, UI, OAU, Covenant, FUTO)." Conflict B resolved: single NMU entry + Kurutie/Okerenkoko toggle.
- **Currency:** Doc05 is silent on ₦. `ListingDetail.tsx` self-flags `R`/en-ZA as "likely ₦" pending founder. Chunk 7 switches to ₦/en-NG as a product-accuracy fix; flag if you disagree.
- **No `backdrop-blur`** (B.5 no-glassmorphism) — frosted panel uses translucent solid, not blur.

---

## Verification gates (every chunk)
- `npm run typecheck -w apps/web` → exit 0
- `npx playwright test tests/e2e/landing.spec.ts` → green (growing per chunk)
- Final: full suite + `next build` green before unblocking Slice 4

## Anti-patterns enforced
- No ambient/drift animation (A.1/A.18) — atmosphere is a still image
- No compass ring (not in spec)
- No Inter (rejected per founder); Fraunces is proposed-display only
- No glassmorphism (B.5)
- Trust strip: zero hardcoded numbers
