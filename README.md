# Voeq

Campus marketplace — monorepo.

This repository is built slice-by-slice from the locked blueprint (docs/project-blueprint, Docs 00–13, audit PASS).

**Current state: Slice 0 — Global Foundation.** No product surface yet. The foundation is verified via `/styleguide` in `apps/web`.

Workspace layout:
- `apps/web` — Next.js application
- `packages/design-tokens` — role-based CSS variable system (Deep/Cream), PROVISIONAL values
- `packages/ui` — foundation primitives consuming tokens
- `packages/contour` — contour primitives, data-gated (no invented activity)
- `packages/data` — repository interfaces + mock implementation (mock→real boundary)

Sequencing is enforced: Slice 0 → founder sign-off → Slice 1 (Landing). Do not build product surfaces before their slice.
