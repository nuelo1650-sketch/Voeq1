# MONEY BAG — PHASE D PLAN (listing + storefront alignment) — FOUNDER REVIEW
*2026-09-10 · Branch-only. NO surface redesign — the A2 listing and S1 storefront layouts STAY (locked: "leave listings the way it is", "leave store front too" applies to STRUCTURE; D = Money Bag alignment, not redesign).*

## What Phase D IS (and is not)
- **IS**: layering the approved Money Bag commitments ONTO the existing A2/S1 surfaces — image counters, Voeq Live seal, share upgrades, honesty rules, brand banner — without moving layout structure.
- **IS NOT**: a redesign. No re-layout, no re-positioning of A2/S1 sections. Every change is additive polish inside the existing structure.

## D1 — LISTING DETAIL (A15/A16/B8/B9)
Current state: A2 soft-editorial already shipped (305e4c7) + lightbox v2 + share dropdown + storefront CTA + comments. Gaps vs ledger:
1. **Voeq Live seal** — featured listings get the gold "✦ Voeq Live" seal on the gallery image (A15). Pure render from `listing.featured` — no new data.
2. **"Price agreed in chat" note** (B9) — small muted line under the price card: "Price agreed in chat — you set it with the vendor." Free-market rule in UX.
3. **Image counter "▹ 1/N"** (B8) — synced to the existing swipe track (dot state already exists; add the counter chip to the frame).
4. **Sticky CTA bar <768px** (A15) — fixed bottom bar on mobile: Message (primary) + save + share round buttons. Desktop untouched. Hides when the main Message CTA is in view (IntersectionObserver, cheap).
5. **Vendor card decision — SKIP.** A2 retired the boxy vendor card BY DESIGN (founder-picked); the byline carries vendor identity. Ledger A15's "vendor card" = the byline + storefront CTA already shipped. Not re-adding a card against the locked A2 decision.
6. **Comments v3** (A16): bought-this badges DEFERRED (no orders data exists yet — honest). Ship: "bought this" only when a real purchase can be verified (E-phase decision); vendor reply rendering stays as-is (response field exists but is rarely populated — renders when present, already).

## D2 — STOREFRONT (A17/A18/A19)
Current state: S1 goods-first shipped (50e4efe) + hybrid banner DECIDED (v1.6) but NOT built. Gaps vs ledger:
1. **BrandBanner (A17, Option C HYBRID — the founder promise, built IN FULL this phase):**
   - **DEFAULT state**: system-generated minimalist banner — flat forest-deep field, centered serif vendor name, ONE thin amber rule (30px), small letter-spaced category line in muted cream. v1.5-final aesthetic. Zero vendor effort; every storefront looks finished from second one.
   - **UPLOAD state, SAME PHASE**: the vendor cover-photo upload is NOT deferred to E. The storefront editor gains the cover slot NOW: upload (existing signed-Cloudinary pipeline) → same banner slot swaps to the vendor's cover image; "Remove photo" reverts to the brand banner. One slot, two states, polished equally — the founder's challenge was "can you seriously do it well", so the upload path ships WITH the banner, not after it.
   - Vendor DB field: `vendors.photoCover` — checked. If absent, migration D2a adds it (additive, idempotent, pgTable twin in same commit per the Phase A lesson).
   - Name typography: banner name is the QUIET small-caps caption (v1.7 — a watermark, not a headline); the IDENTITY CARD name stays the hero (Fraunces 900, clamp 1.55-2.3rem, verified dot inline). The name appears ONCE as a hero.
   - Identity card layout law (v1.8, already shipped): actions in ONE row (Message flex / Follow flex / Share 48px circle), separators never end a line, one font per line — regression-probe these.
2. **Identity card v1.8 polish** (A18): statbar stays (Listings / Rating "—" until 50 reviews / Reviews — already honest); add "On Voeq since {year}" replacing the plain REVIEWS cell? NO — keep 3 cells as-is, add member-year line under description from `agreementAcceptedAt` (real data). Meta line already all-sans (v1.8 shipped).
3. **Category pills COMPUTED from active listings** (A18) — currently shows vendor.categoryIds names; add computed-from-listings when categoryIds is empty. Small logic guard.
4. **Share bar** (A18): storefront already has share via hero? VERIFY — if missing, add compact Copy + WhatsApp share row (real URLs, same pattern as listing share).
5. **Reviews honesty (A19)** — ReviewsList currently renders the aggregate ★ + distribution bars. Per founder-locked A19: aggregate score + bars REMOVED until 50 reviews ("scores unlock after 50 reviews — keeps ratings honest"), individual review texts + star glyphs stay, vendor responses render when present. THE ONE PLACE A19 CHANGES EXISTING RENDER — founder-locked twice (v1.2 + ledger).
6. **Footer scope (A21)** — already correct (SmartFooter allowlist).

## D3 — SEO + META for these surfaces (rides along)
- Storefront pages: noindex for non-live vendors (staff-view already does this); canonical for live ones.
- Listing pages already have Product JSON-LD (shipped in SEO batch).

## ACCEPTANCE GATES
- typecheck 0 · vitest 96/0 + fairness 28/0
- NEW probe rt-mb-d.mts: banner renders from real data (no cover), banner SWAPS to cover when set, remove-photo reverts to brand banner, seal on featured listing, counter syncs, price-note present, sticky bar only <768, aggregate rating hidden <50 reviews + visible text reviews, computed category pills fallback
- All existing probes (rt-mb-floor/l2/b3/landing/sections/seo) still ALL PASS
- rt-a2-detail.mts + rt-ux-batch.mts still pass (A2/S1 contracts intact)
- Sweep @390px clean

## HONEST GAPS AFTER D (expected)
- Comments "bought this" badge: deferred until purchases exist (data honesty)
- Nightly-scored spotlight: E-phase cron

**YOUR CALL: approve as written, or adjust before I build.**
