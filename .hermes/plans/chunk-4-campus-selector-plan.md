# Chunk 4 — Inline Campus Selector (plan for founder vetting)

**Status:** DRAFT — Hermes proposes; founder vets; agent signs off; THEN code.
**Scope:** Landing only. Does NOT touch wordmark, contour, footer, trust strip, CTA copy, or storefront.
**Goal:** Replace the current `Surface` *card* selector (South African list) with an inline sentence-skin selector (`Discover what's open near [NMU ▾]`) over the Nigerian `CAMPUS_OPTIONS`, with the Conflict B NMU zone toggle. No card. No glassmorphism.

---

## 1. Spec citation (verify against docs)
- **Doc 05 A.19 (lines 544–547):**
  > "Inline campus selector (skin over the locked searchable selector). Styled as a sentence
  > ('Discover what's open near [NMU ▼]') — preserves `data-testid="campus-selector"` + popover/
  > bottom-sheet + chips + fuzzy alias from commit 418981b. **No card weight.** Examples Nigerian
  > (NMU default; UNILAG, UI, OAU, Covenant, FUTO)."
- **Doc 05 (lines 1252–1256):** skin over the locked component; rendered as `'Discover what's open near [NMU ▼]'` — underlined word, `Hanken Grotesk 600` `var(--role-accent)`, underline → `var(--role-accent)` on hover, custom chevron rotates 180° open. `data-testid="campus-selector"` preserved on the `<select>`.
- **Doc 04 (lines 98–100):** inline "sentence" styling, preserves `data-testid="campus-selector"`; "Can't find your campus? Add it" input → dynamic `unverified` persistence.
- **Conflict B** (PENDING founder call per USER profile): NMU two-campus Kurutie/Okerenkoko treatment.

## 2. Two drifts this chunk MUST fix (found in my own read of CampusContext.tsx)
1. **Wrong campus list** — current `CAMPUS_OPTIONS` = `[{nmu,"NMU"},{up,"University of Pretoria"},{wits,"Wits"},{uct,"UCT"}]` (South African). Locked spec = Nigerian. → replace list.
2. **Card, not sentence** — current renders `<Surface sunken>` + `<Stack>` + a `<Type>` label + a `<select>`. Spec = "No card weight", inline sentence. → strip `Surface`/`Stack`, render flowing text.

## 3. Copy (exact, from doc)
`Discover what's open near [NMU ▾]` — the bracket is the inline select; `NMU` is the default-selected label.

## 4. Data source — `CAMPUS_OPTIONS` (single source, lives in CampusContext.tsx)
No `packages/data/src/campuses.ts` exists; the only source is `CampusContext.tsx` (also imported by `EntryToDiscovery.tsx`). Keep it there.

Proposed new shape (adds `zones` only for NMU; backward-compatible with `EntryToDiscovery`'s `.find(c=>c.id===campus)?.label`):
```ts
export const CAMPUS_OPTIONS = [
  { id: "nmu",      label: "NMU",      zones: ["Kurutie", "Okerenkoko"] },
  { id: "unilag",   label: "UNILAG" },
  { id: "ui",       label: "UI" },
  { id: "oau",      label: "OAU" },
  { id: "covenant", label: "Covenant" },
  { id: "futo",     label: "FUTO" },
] as const;
```

## 5. Component change — `CampusContext.tsx` (diff sketch)
- **Remove:** `import { Stack, Type, Surface }`; the `<Surface sunken>` + `<Stack>` wrappers; the "Campus context" `<Type>` heading; the muted "(Default view …)" caption.
- **Add:** inline `<p data-testid="campus-context">` flowing sentence:
  `Discover what's open near` + `<select data-testid="campus-selector">` (transparent bg, no border except `1px solid var(--role-accent)` bottom, `color: var(--role-accent)`, `fontWeight: 600`, `appearance:none` + custom `▾` chevron) + optional inline zone toggle when `selected.zones` exists.
- **Keep:** `campus` / `onCampusChange` props (interface unchanged for LandingShell).
- **Add (Conflict B):** `zone` / `onZoneChange` props; when selected campus has `zones`, render `· [Kurutie | Okerenkoko]` as two underlined `<button>`s (`aria-pressed`, accent when active). Default `zone = "Kurutie"`.

## 6. State — where selection lives
**Recommendation: keep React state in `LandingShell`** (`useState("nmu")` already there). Extend to `const [zone, setZone] = useState<string>("Kurutie")`, pass `zone`/`onZoneChange` to `CampusContext`.
- **Rejected:** URL `?campus=` (shareable) — that's specced for *Explore* filters (Doc 07 §7.5), not the Landing selector; pulling it in now is scope creep + new `useSearchParams` wiring. **Deferred to Batch C.**
- **Rejected:** new `CampusProvider` context — one inline selector doesn't justify a global provider.

## 7. Wiring (what the selector feeds, honestly)
- **Now:** `EntryToDiscovery` already reads `CAMPUS_OPTIONS.find(c=>c.id===campus)?.label` → renders "Explore {label}". Changing labels to UNILAG/etc. updates the CTA copy automatically. **Real, not phantom.**
- **Zone:** selected `zone` currently has **NO downstream consumer** (no listing filter exists on Landing). It is selected-state only this chunk. Honest limitation — flag, don't fake.
- **Deferred:** CTA copy suffix ("Explore NMU · Kurutie") and actual listing filtering → Chunk 6 (CTA) / Batch C (Explore). Not this chunk.

## 8. A11y
Native `<select>` with `aria-label="Campus"` = browser-grade. Zone toggle = `<button aria-pressed>` (no ARIA widget lib). Reduced-motion: chevron static (no rotate animation). No new dependency.

## 9. Motion
None required. Select is instant; chevron is decorative. Honor `prefers-reduced-motion` (no rotate).

## 10. Visual constraints (locked)
No `backdrop-filter` / glassmorphism (B.5). No `Surface`/card, no box border, no shadow, no padding-as-card. Inline text + underlined select + tiny chevron. Sits in the 55% left column (already wired in `LandingShell`). Wordmark clamp + contour 320px floor untouched.

## 11. Verification
- `npm run typecheck -w apps/web` → exit 0
- Playwright `landing.spec.ts`: `campus-selector` present; options include NMU/UNILAG/UI/OAU/Covenant/FUTO (assert SA campuses GONE); select UNILAG → CTA reads "Explore UNILAG"; assert NO `campus-context` `Surface`/`Stack` card wrapper.
- Visual: 55/45 intact, contour floor 320px intact, wordmark clamp unchanged.
- `next build` → green.

## 12. Files touched (2)
1. `apps/web/components/landing/CampusContext.tsx` — rewrite (strip card, Nigerian list + zones, inline skin).
2. `apps/web/components/landing/LandingShell.tsx` — add `zone`/`setZone` state + pass to `CampusContext` (4 lines).

## 13. Do NOT (guardrails)
No card / `Surface` / `Stack`. No `backdrop-filter`. No hardcoded campus strings in components (use `CAMPUS_OPTIONS`). No new dependency. No touch to wordmark, contour, footer, trust strip, or CTA copy. No URL-param rewrite. No listing-filter build.

## 14. Risks / open questions (founder input needed)
- **Q1 — Conflict B mechanism:** proposed = inline zone toggle (`Kurutie | Okerenkoko`) shown only when NMU selected, default Kurutie. **This is a RECOMMENDATION, not a decision** — Conflict B is still an open founder call. Confirm mechanism, or tell me to defer the toggle to a dedicated micro-chunk.
- **Q2 — Rich selector discrepancy:** Doc references "locked searchable selector (commit 418981b): popover/bottom-sheet + chips + fuzzy alias." The CURRENT `CampusContext.tsx` is a plain `<select>`, NOT that rich component. I'll skin the *actual* plain `<select>` on disk. Flag if the rich component is supposed to exist and was lost.
- **Q3 — Font:** Doc names `Hanken Grotesk 600`; design system token is `var(--role-font-ui)`. I'll use `var(--role-font-ui)` @ weight 600 + `var(--role-accent)` (assumes the token resolves to Hanken). Confirm if a literal `Hanken Grotesk` family must be set.
- **Q4 — "Can't find your campus? Add it"** dynamic `unverified` input (Doc 04): NOT in current code. Deferred (out of Chunk 4 scope); noted for Batch C.

## 15. Commit message (for code phase)
`checkpoint 3: landing chunk 4 (inline campus selector — Nigerian list + Conflict B zone toggle, no card)`

---

**Founder to confirm:** Q1 (Conflict B toggle) + Q2 (rich-selector discrepancy) + Q3 (font) before agent signs off.
