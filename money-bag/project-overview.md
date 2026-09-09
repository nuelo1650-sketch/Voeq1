# Voeq — Project Overview
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Created 2026-09-08 under the Money Bag protocol (SOUL.md:70). Status: AWAITING FOUNDER CONFIRMATION.*

## What Voeq is
A campus marketplace for Nigerian university students. Vendors (student businesses — bakers, hair stylists, gadget resellers, fashion) get storefronts; students discover them through Explore, chat, and buy. Photos ARE the product: listing images sell, profile photos build vendor trust.

- **URL**: voeq.ng (live since 2026-09-07 launch)
- **Repo**: `C:\Users\Legacy\Documents\voeq` (remote: github.com/nuelo1650-sketch/Voeq1.git, branch master)
- **Who it's for**: students at campuses like NMU Okerenkoko / NMU Kurutie; vendors are students selling to their own campus.

## Where we are
Post-launch. The platform shipped with matrix 120/120 (playwright.verify.prod.config.ts) on prod. Live users exist — real vendors (Berlinsignature, MJ APPAREL & CO, Cassy's cakes and more) are trading. Every change now happens **with users on the platform** — audit first, careful migrations, no breaking changes.

## Money Bag scope (this phase)
**Explore + Landing + related pages** — the acquisition and discovery surfaces:
- `/` — Landing (LandingNav, LandingHero, TrendingRail, CategoryGrid, HowItWorks, TrustPillars, LandingFAQ, ForVendorsCTA)
- `/explore` — the heart of the app (locked design v4.1)
- Related: `/listing/[id]` (A2 detail), `/vendor/[id]` (S1 storefront), `/c/[slug]` (campus pages), `/how-it-works`, `/for-vendors`, `/become-vendor`, `/help`, `/saved`

## Why this phase matters
Landing sells the feeling (emotional architecture — one CTA, trust signals, serif headline); Explore is where the marketplace lives. These surfaces drive signups and first purchases. Post-launch they must get *finer*, not just fixed.

## Founder rules that govern this phase (verbatim intent)
- Explore is the heart of the app — storefronts, comments, analytics converge there.
- Landing = emotional architecture: feel something → click one button. Search bars/filters/multiple CTAs belong on Explore or below the fold.
- "same vibe, unique as the landing page" — the whole product rhymes with the landing (forest/gold-amber/cream, Fraunces + Inter).
- Footer ONLY on public pages (allowlist in SmartFooter) — NEVER dashboards/explore/auth.
- BrandLogo component (94px) everywhere — never a text wordmark.
- Pricing is free market — never police/validate/gate price values.
- Critical listing fields locked after creation (immutability rule).
- No dark theme (dead per founder call).
- Socials: real URLs only (Instagram @voeq.ng, TikTok @voeq.ng, WhatsApp channel 0029Vb8u4Md6mYPON8gMpi3i, support@voeq.ng). Never invent.
- Demo vendors keep "Demo:" prefix until founder says otherwise.

## Out of scope for this phase
Auth/onboarding flows, staff/admin planes (unless a change ripples), infra, trading platform. Those have shipped states; touch only if an Explore/Landing change forces it.

## Current prod state (verified 2026-09-08)
- Prod HEAD `df809b6`, working tree clean, pushed.
- Matrix 120/120 on latest deploy (`voeq-bmu9xxr9q` family).
- Latest relevant ships: filter persistence (9eb5b1a), publish=go-live + verification case + notification (890d802), landing rail → real listings (e2ef2fd), crawlable landing CTAs (d14abc9).

## What we are building next
**TBD — founder defines the changes in /architect.** This skeleton captures current state + process; `build-plan.md` gets its ordered steps after that conversation.
