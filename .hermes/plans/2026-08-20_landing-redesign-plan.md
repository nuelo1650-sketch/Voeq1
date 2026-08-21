# Voeq Landing Redesign — Locked Plan v3 (motion-only, no aurora)

> **For Hermes:** Plan only. Do NOT implement until David sends a standalone `Go.` (phased — see bottom).

**Goal:** Ship a minimalist, motion-driven landing — flat cream canvas, all "modern" feeling from placement/entrance motion + proportion, not color/gradient. Inspired by Steep's *proportions/shapes* (type scale, spacing rhythm, pill buttons, flat floating cards), applied in Voeq's locked palette (cream/emerald/gold + Fraunces). Aurora/grain/wash SCRAPPED (David: "too much for minimalist design").

**Architecture:** Pure CSS + existing `useReveal` IntersectionObserver. No new deps, no JS animation loops, no `getBoundingClientRect` in render. Retheme existing components; reuse `ListingCard` (price `₦`) for deferred browse.

---

## PROVENANCE FLAG (read me)
A prior draft (v2) claimed two files — `voeq_hero_mockup.html` / `voeq_hero_mockup_v2.html` — were "reviewed and approved" and named v2 as "visual source of truth." **Those files do NOT exist in the repo** (verified via `find` + `grep`: zero matches; only pre-existing `styleguide/page.tsx` and `docs/05-DESIGN_SYSTEM...md` mention "mockup"). That provenance is fabricated. This plan treats **David's words + the Steep reference he supplied + our locked tokens (verified on disk)** as the source of truth, NOT any mockup file.

---

## Locked Decisions (this session)
1. **Aurora SCRAPPED.** Flat `--role-bg` cream `#f7f4ec`, no gradient/wash/grain. (David: "scrapping the aurora background, it's too much for minimalist design.")
2. **Motion from placement, not color.** Visual interest = type + spacing + entrance/placement motion + the one signature (contour line).
3. **Steep = proportions/shapes ONLY, not palette/font.** Adopt: type-scale tiers, 8/16/24/32/40/64/80 spacing, pill buttons (`9999px`), flat floating cards (hairline border, no resting shadow). Do NOT adopt: Steep's ink-black/white/peach palette, heavy shadows, sans headline. **Fraunces + cream/emerald/gold stay.**
4. **Prices ON** (Voeq shows price; no payments processed). Reuse `ListingCard`.
5. **Landing first, browse after** (browse = separate follow-up).
6. **Mobile-first** — every task gets a breakpoint. Nav hamburger→overlay (globals:43-46) + `.how-steps` 1-col (globals:700) already exist.
7. **Phased Go** (per critique): Phase A = visual layer (no new UI surface); review live; Phase B = hero search bar; Phase C = browse.

---

## Current State (verified on disk)
- `globals.css:62-89` `.landing-bg` (cream `#f7f4ec`) + `.landing-atmosphere` (2-stop radial gradient + 3% grain). **Aurora to be removed.**
- `globals.css:145-161` `.wordmark-char` — `wordmark-rise` = opacity+translateY, stagger 0.3s, reduced-motion instant. **No blur yet.**
- `globals.css:179-192` `.contour-line-path` — self-draws via `stroke-dashoffset` 1.2s. **Already done, keep as signature.**
- `globals.css:556-698` — enrichment sections styled (cards, chips, FAQ, reveal via `data-reveal`).
- `useReveal.ts` — working one-shot scroll reveal, reduced-motion safe.
- **Tokens (verified in built css):** `--role-bg:#f7f4ec`, `--role-accent:#2f6b3f` (emerald), `--role-gold:#b8893b`, `--role-text:#1f2a22`, `--role-text-muted:#5c6b5f`, `--role-border:#ddd5c4` (hairline), `--role-on-accent`, `--role-surface`, `--role-font-display: var(--font-fraunces)...`, `--role-font-ui: var(--font-hanken)...`.
- **CTAs:** `.landing-cta` = `<a>` with `.cta-arrow` (→) in `EntryToDiscovery.tsx:15` + `LandingFinalCTA.tsx:13`. These are the buttons to pill-ify.
- `StorefrontGrid.tsx` / `ListingCard.tsx` — browse building blocks (price `₦`). **Deferred.**

---

## Inspiration (Steep) — Adopt vs Reject
| Adopt (proportions/shapes) | Reject (palette/identity) |
|---|---|
| Type-scale tiers (44/64/88px display, 15–20px body) | Achromatic ink-black/white/peach system |
| Spacing rhythm (8/16/24/32/40/64/80) | Heavy floating-artifact shadows |
| Pill buttons `border-radius:9999px` (filled + ghost pair) | Sans-only headline (Fraunces stays) |
| Flat floating card (hairline border, no resting shadow, entrance-motion only) | Peach accent (we use gold/emerald) |

---

## Landing Tasks

### Task 1 — Strip background system (aurora kill)
**File:** `globals.css:73-89` `.landing-atmosphere` (+ `::after` grain)
- Delete `.landing-atmosphere` and its grain overlay entirely. Canvas = flat `--role-bg` cream only.
- Remove any "frozen aurora" reduced-motion logic tied to atmosphere (none beyond the static gradient — but confirm no drift keyframe exists; there is none).

### Task 2 — Wordmark + nav entrance (motion-only)
**File:** `globals.css` `.wordmark-char` (≈145)
- Add `filter: blur(8px)`→`blur(0)` to `wordmark-rise` (keep opacity+translateY). Stagger `0.3s`→`0.06s` (~1.2s arrival).
- Nav mark + nav links: short entrance (0.6s, near-simultaneous with hero). Add `.landing-nav` entrance rule OR reuse `wordmark-char` pattern on nav items.
- Eyebrow label (if present) rises before headline.
- Reduced-motion (159 block): `filter:none`, instant.

### Task 3 — Steep-derived type scale + spacing tokens (OUR vars)
**File:** `globals.css` `:root` (top, after token import)
- Add scale as CSS custom properties re-pointed to OUR tokens:
  - Type: `--text-caption:15px; --text-body:17px; --text-body-lg:20px; --text-subheading:22px; --text-heading-sm:26px; --text-heading:44px; --text-heading-lg:64px; --text-display:88px;` (line-heights/letter-spacing per Steep, but applied to Fraunces for display).
  - Spacing: `--space-8:8px; --space-16:16px; --space-24:24px; --space-32:32px; --space-40:40px; --space-64:64px; --space-80:80px;`
- Re-point existing `.landing-section-title`, `.how-step-title`, `.landing-final-cta-title`, body copy at these tokens where sensible. **Token-layer change, not a component rewrite.**

### Task 4 — Pill buttons (OUR palette)
**File:** `globals.css` `.landing-cta` (EntryToDiscovery + FinalCTA)
- `border-radius: 9999px` (was 4px-ish). Padding tuned for pill.
- Primary (`.landing-cta`): filled `--role-accent` (emerald), text `--role-on-accent`; hover → slightly lift `translateY(-2px)` + soft shadow.
- Ghost secondary (nav "For vendors"/"Login" or a paired CTA): transparent, `--role-border` border, hover → `--role-gold` border/text.
- Apply consistently to hero CTA + Final CTA. Keep `.cta-arrow` →.

### Task 5 — Proof-row stat cards (adapted from Steep, flat)
**File:** NEW `LandingProofRow.tsx` + CSS
- 3-card row beneath hero CTA: e.g. "12 vendors live", "1 campus (NMU)", "Prices shown upfront".
- Flat white (`--role-surface`) bg, 1px hairline `--role-border`, 24px radius, **no resting shadow**.
- Entrance: fade+rise as a group after CTA (~1.1s), via `useReveal` or hero sequence.
- Hover: `translateY(-4px)` + soft emerald-tint shadow (hover only).
- **STATS MUST BE REAL OR LABELED PLACEHOLDER.** Do NOT ship fake live counts. Pull from data if available; otherwise explicit "—" / "coming soon" labeling. (Enforce in code + e2e.)

### Task 6 — Contour = sole signature (keep, confirm)
**File:** `ContourSignature.tsx` / `.contour-line-path`
- Already self-draws once on load (gold/emerald node pulses). With bg now flat, it's the single "alive" moment by default. **No logic change** — just confirm it reads on flat cream (node color contrast vs `#f7f4ec`).
- Deferred nice-to-have: extend the 1px stroke across section dividers (signature *system*). Not in Phase A.

### Task 7 — Section polish
**File:** `globals.css` `.how-step`, `.category-chip`, `.faq-item`, `.landing-final-cta`
- `.how-step`: numbered circular badge (1/2/3) via `::before` `--role-accent` (steps ARE sequential — confirmed). Subtle hover `translateY` lift.
- `.category-chip`: `box-shadow` on hover (keep color flip).
- `.landing-final-cta`: keep flat/calm (NO second glow — aurora is gone, CTA is the only focal action; restrained hover only).
- Keep `useReveal` scroll-fade.

### Task 8 — Mobile pass
**File:** `globals.css` new `@media (max-width:768px)` as needed
- Wordmark clamp already responsive; ensure blur-in doesn't overflow.
- Proof-row: wrap to 1-col on ≤768px.
- Chips ≥44px tap targets. Reuse nav hamburger + `.how-steps` 1-col.

### Task 9 — Verify
- `npm run typecheck` (web) → exit 0; `npm run build` → exit 0.
- e2e extend `landing.spec.ts`: (a) wordmark computed `filter` blur at anim start; (b) `.landing-atmosphere` REMOVED (assert element absent / zero gradient layers); (c) reduced-motion → all entrance `animationName === 'none'`, content visible; (d) 375px → proof-row stacks, nav hamburger visible, no horizontal overflow; (e) proof-row stats are real-or-labeled (assert no fabricated number like "10,000+").
- Visual: screenshot `:3001` normal + reduced-motion + 375px; confirm Fraunces renders (computed font-family contains "fraunces").

---

## Phase B — Hero search bar (CONCRETE SPEC, awaiting standalone `Go.`)

**Founder direction (this message):** drop the campus select entirely. Hero search = ONE
input + ONE pill button, no second field, no dropdown. Cleaner flow than Qayima's multi-field:
no campus filter before results; `/browse?q=…` defaults to ALL campuses, campus-specific
filtering happens after landing on `/browse` (Phase C), not before.

**Spec (grounded on disk):**
- **Submit target is `/browse`, NOT `/explore`.** Disk check confirmed `app/explore/` exists
  (the old "Explore NMU" target) but `app/browse/` does NOT yet exist (Phase C). So Phase B
  must ALSO create a **minimal `/browse` stub route** (`app/browse/page.tsx`) that reads
  `?q=` and renders a placeholder "results for '<q>'" + a note that campus filtering is coming.
  Without it, the form posts to a 404. (This stub is the only Phase C leakage — flagged, not hidden.)
- **Replaces `EntryToDiscovery` ("Explore NMU" <a class=landing-cta data-testid=entry-discovery>).**
  Search bar is the same action, more specific. Keep `LandingHero`'s "Post something" ghost as
  the one remaining secondary CTA beside it.
- **Component:** `LandingSearch.tsx` ("use client" — needs controlled input + submit handler).
  Renders:
  - `<form action="/browse" method="get">` (native GET → `/browse?q=…`, no JS routing needed,
    works without hydration).
  - `<input name="q" placeholder="Search textbooks, furniture, tickets…" aria-label="What are you looking for?">`
    — specific placeholder signals what Voeq sells (no category dropdown to do that job).
  - `<button type="submit" class="landing-cta">Search</button>` — reuses Phase A pill styling
    (9999px, ink→emerald hover). Label "Search" (founder's choice; "Browse" also fine).
- **Styling:** born in Phase A — same `var(--role-border)` hairline, same radius scale, NO new
  colors, NO new shadow language. Input gets the same border/radius as `.proof-card`/`--role-border`.
- **Entrance motion:** rises in with the rest of the CTA row, same delay slot as the existing
  CTA row (use `useReveal` or match the hero pair's reveal). No new motion vocabulary.
- **Mobile (375px):** input stacks ABOVE button, both full-width (matches proof-row stacking
  pattern from Phase A). Form is `flex-direction: column` under 768px.
- **Placement:** directly under the subhead (`discovery-proposition`), replacing the current
  `EntryToDiscovery` CTA row. "Post something" ghost stays beside the search form's button row.

**e2e updates required (existing tests assert the OLD action — they WILL break):**
- `landing.spec.ts` lines 60-66, 103-128, 145-153, 267-278, 379-393, 458-464, 515-533
  assert `data-testid="entry-discovery"` → `/explore` with "Explore NMU". These must be
  rewritten to the search bar: assert `form[action="/browse"]`, `input[name="q"]` present,
  placeholder text, submit button → `/browse?q=…`. Keep the "no fake stats / no auth surface"
  gates intact.
- The "primary CTA is .landing-cta with aria-hidden arrow" assertion (line 267) no longer holds
  (search button has no arrow) — adjust to assert the submit button carries `.landing-cta` and
  pill radius.

**Done condition:** typecheck+build green; `/browse?q=books` returns 200 with the query echoed;
form GET submits to `/browse?q=…`; mobile stacks; e2e updated + passing; no new colors/shadows;
entrance motion consistent with Phase A. Commit only after standalone `Go.`

---

## Browse (DEFERRED — Phase C, separate plan)
- Category grid: 5 tiles (food/books/beauty/apparel/services) → `/c/[slug]`, reuse `CATEGORIES` from `Filters.tsx`.
- Vendor cards: reuse `ListingCard` (price `₦` on, availability chip, verified/rating).
- Search-forward: reuse `Filters.tsx` (category + campus + query).
- No cart/SALE/strike. "Connect"/"Message vendor" CTA.
- Mobile: grid 3/2/1 + tap targets.

---

## Phased Go (per critique — cheaper to catch "still generic" after fewer tasks)
- **Phase A (COMPLETE, committed `f44170b`):** Tasks 1–9 — visual layer, flat cream, motion-only.
- **Phase B (separate `Go.`):** Hero search bar — ONE input + ONE pill button → `/browse?q=…`,
  replaces "Explore NMU", keeps "Post something" ghost. Plus minimal `/browse` stub (see spec).
- **Phase C (separate plan):** Browse (full results page, campus filter, category grid).

## Out of Scope (this pass)
- Browse full results (Phase C). Contour-signature-system extension (deferred). Dark theme. Real activity feed.

## Open Questions (answer with `Go.`)
1. ✅ Resolved (Phase A `Go.`): proof-row = labeled placeholders, no fake stats; one Go for 1–9; ghost CTA = hero pair.
2. **Phase B button label:** "Search" (founder's stated default) vs "Browse"? (Spec uses "Search"; trivial to flip.)
3. **`/browse` stub copy:** placeholder "results for '<q>'" + "campus filtering coming soon" — acceptable, or want different wording?

**Done condition:** (Phase A committed.) Phase B: typecheck+build green; `/browse?q=…` 200; form submits; e2e updated+passing; no new colors/shadows; entrance motion consistent. Commit only after standalone `Go.`
