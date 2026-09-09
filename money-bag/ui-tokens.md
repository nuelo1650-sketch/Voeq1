# Voeq — UI Tokens
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Source of truth: `packages/design-tokens/tokens.css` (verified 2026-09-08). This file is the readable snapshot — tokens.css wins on any conflict.*

## Surfaces
`--color-glass-white: #F5F1E8` · `--color-cream: #FAF6EC` · `--color-cream-light: #FBF8F0` · `--color-white: #FFFFFF`

## Structure (the forest family)
`--color-forest: #0F2A1D` · `--color-forest-mid: #2D5A3D` · `--color-forest-light: #4A7A5C` · `--color-forest-dark: #0B211A`

## Accent (the gold family)
`--color-amber: #E8A33D` · `--color-amber-dark: #D4922A` · `--color-amber-light: #F5C36A`

## Ink
`--color-ink: #0A0A0A` · `--color-ink-muted: #4A4A4A` · `--color-ink-subtle: #7A7A7A` · `--color-ink-deep: #0A0A0A`

## Status
`--color-status-open/live: #2D5A3D` · `--color-status-closing/pending: #D4922A` · `--color-status-closed/danger: #B85C3E`

## Glass
`--glass-bg: rgba(245,241,232,0.08)` · `--glass-bg-strong: rgba(245,241,232,0.15)` · `--glass-border: rgba(255,255,255,0.12)` · `--glass-blur: blur(20px) saturate(180%)`

## Spacing (8pt grid)
xs 4 · sm 8 · md 16 · lg 24 · xl 40 · 2xl 64 · 3xl 96 — legacy aliases: 1→8, 2→16, 3→24, 4→32, 5→48, 6→64, 8→8 (globals override; trust actual render)

## Radius
sm 8 · md 12 · lg 16 · xl 24 · pill 999 · legacy `--radius: 8`

## Shadows
sm `0 1px 2px rgba(15,42,29,.06)` · md `0 4px 12px rgba(15,42,29,.08)` · lg `0 8px 24px rgba(15,42,29,.12)` · glass `0 8px 32px rgba(15,42,29,.15)`

## Typography
- Display: Fraunces (`--role-font-display` — serif, landing heroes + prices + big titles)
- UI: Inter (`--role-font-ui`)
- Mono: IBM Plex Mono fallback
- Title clamp pattern: `clamp(1.35rem, 1.75rem)` (A2 detail); landing hero larger.

## Role mappings (use these in components)
`--role-bg / --role-surface / --role-text / --role-text-muted / --role-border` · `--role-accent(-strong/-subtle)` · `--role-gold` · `--role-danger` · `--role-on-accent` · error/success bg-text-border trios

## Grid + sections
`--container-max: 1200px` · `--section-gap: 96px` (48px mobile) · 12-col grid, gap md

## Motion
`--motion-fast: 160ms` · `--motion-med: 320ms` (respect prefers-reduced-motion)

## Hard rules
1. Components NEVER hardcode values — `var(--…)` only. Retune the brand by editing tokens.css alone.
2. New token? Add to tokens.css first, reference second. If a token was referenced but never defined it renders invisible (15-place `--color-danger` white-on-white lesson).
3. Mobile grid: `repeat(2, minmax(0,1fr))` — never bare `1fr`.
