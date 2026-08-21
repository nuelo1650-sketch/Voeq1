# VS1–VS7 — Expanded Vertical Slice Plan (detail-first)

**Status:** EXPANDED DRAFT — grounded in Doc 03/04/06/07/08/09. NOT committed to blueprint.
**Why this exists:** earlier VS1–VS7 draft listed only route rows + tiers → vague. Founder: *"expand into details like I can see here they are just vague; dont forget the problems from the last message."* This render adds, per slice: real PG IDs, real Doc 07 routes, Doc 06 §2 gate, and a **sub-artifact inventory** (screens/components/states) — including the 3 named gaps from the prior thread (OTP screen, consent/agreement box, email templates) plus other missing sub-artifacts raised per slice.
**Execution gate:** VS1 (Landing) is blocked on 5 founder decisions (see bottom). Committing this re-opens Doc 06 sign-offs → needs founder sign-off.

---

## The 3 named problems + resolution

1. **OTP screen** — implied in AUTH but never enumerated. → **VS2 sub-artifact**, grounded in Doc 03 `FLOW-AUTH-VERIFY` (3.3) / `FLOW-AUTH-RESET` (3.6): Voeq OTP, anti-enumeration pending-token, rate-limit lockout, Doc 13 §13.4/§13.6.
2. **Consent / agreement box** — `ConsentAcceptance` is a LOCKED **server-side** record (Doc 08 §8.3), NOT a frontend checkbox; gate `IDN-009` (Doc 03 §3.1 / Doc 09 §9.4). → **VS2 sub-artifact**: consent screen + versioned Terms/Privacy link; recorded server-side, not just UI state. Re-consent on Terms update = UNDECIDED policy (flagged).
3. **Email templates** — **ABSENT from the entire blueprint** (grep returned empty). → **VS2 owns** transactional email (verification / reset / OTP), but this is a **BLUEPRINT GAP**: no spec exists. Cannot build to a spec that doesn't exist — propose a new Doc 10 (Communications) or a Doc 03 §comms section before build.

---

## VS1 — Public Surface
**Pages (Doc 07):** `/` PUB-001 (Expressive, Slice 1) · `/explore` PUB-002 (Editorial, Slice 2) · `/category/[slug]` PUB-003 (Editorial, Slice 2) · `/vendor/[id]` PUB-004 (Editorial, Slice 4, B.16 stress) · `/listing/[id]` PUB-005 (Editorial, Slice 3 — **BUILT**, pushed `2f33b20`) · `/about` PUB-006 (LATER, Editorial) · `/terms` PUB-007 (Slice 5, Functional, consent destination) · `/privacy` PUB-008 (Slice 5, Functional, consent destination) · `/help` PUB-009 (LATER, Editorial) · `/for-vendors` PUB-010 (LATER, Editorial) · `/press` PUB-011 (LATER, Editorial).
**Gate:** S1 (Expressive) + S2/S3/S4 (Editorial) + consent-link to /terms /y.
**Sub-artifact inventory:**
- **Landing** (the remediation target): wordmark entrance (char fade-up ~2s, first-arrival only, `prefers-reduced-motion`→instant, `<h1>`); atmosphere (amber UL radial + deep-green LR vignette + ≤3% SVG grain, **no ambient drift**); 55/45 asymmetric layout; inline campus selector (sentence skin *"Discover what's open near [NMU ▼]"*, NMU default + Kurutie/Okerenkoko toggle per Conflict B, UNILAG/UI/OAU/Covenant/FUTO); trust strip (data-bound `{vendorCount}·{campusCount}·{studentConnections}`, zero literals, Student-Vouched language); CTA (warm-shadow + arrow + hover lift, wired to selector); signature footer (centered, contour-line border); mobile overlay nav (hamburger → full-screen, SVG icons not unicode).
- **Explore:** listing grid (B.16: 15 listings, ≥5 imperfect photos, mixed editorial rows + image-led grids, zero card-monotony); filters (URL-param state, shareable); weighted trending; contour edge-whisper (§A.12).
- **Category:** Explore variant (slug edge-cases, not just campus-slug).
- **Storefront:** B.16 stress (15 listings, zero card-monotony); Deep hero + Cream body; campus fingerprint (real geo or absent); native message CTA.
- **Listing:** PG-PUB-005 (**BUILT**) — continuity entrance `.explore-entrance`, framed 4:3 gallery, price/availability as data, Student Vouched, native CTA, sent-confirmation cause-effect.
- **Info pages:** About/Help/For-Vendors/Press = Editorial static; Terms/Privacy = Functional consent destinations (versioned, linked from IDN-009).
**Missing sub-artifacts raised:** info-page composition not specced beyond route rows (About/Help/For-Vendors/Press have no PG detail); storefront needs the 15-listing fixture (Doc 07 §162 references it); Landing trust-strip data source = mock boundary (not yet defined).

---

## VS2 — Identity & Access (`/auth/*`, AUTH-001..004)
**Tier:** Functional (Slice 5). **Gate:** S5. **Flow:** `FLOW-AUTH-SINGLE` (Doc 03).
**Sub-artifact inventory:**
- **Sign-in / register** screen (email + Google; Google resolves identity *then* OTP — C3; magic-link alternative).
- **OTP screen** (`FLOW-AUTH-VERIFY` / `FLOW-AUTH-RESET`): code entry, pending-token anti-enumeration, resend (rate-limited), attempt counter, lockout; invalid/expired error states; Google path also requires OTP.
- **Consent / agreement screen** (`IDN-009`): versioned Terms/Privacy acceptance; `ConsentAcceptance` record created **server-side** (Doc 08 §8.3), not just a checkbox; re-consent on Terms update = UNDECIDED policy (flag).
- **Campus gate** (`IDN-010`): campus selection post-consent.
- **Forgot / reset** screen (`FLOW-AUTH-RESET`): email → OTP → new password → confirmation.
- **Email templates** (**BLUEPRINT GAP**): verification, password-reset, OTP emails. No spec exists — author before build; apply Doc 05 type/color roles.
**Verification checklist:** OTP (enter→validate→session) · consent (unchecked=blocked, recorded server-side) · reset (expired/invalid→re-issue) · email templates render with Voeq DNA.

---

## VS3 — Onboarding
**Pages:** `/onboarding/shopper` ONB-001 (Slice 5, Functional, S5) · `/onboarding/vendor` ONB-002 5-step (Slice 6, Functional, S6).
**Sub-artifact inventory:**
- **Shopper:** interest selection + notification toggle → shopper home.
- **Vendor 5-step:** (1) profile → (2) campus (IDN-010, reuse VS1 campus list + NMU toggle) → (3) categories → (4) photos (mock upload, B.6 framing) → (5) Review & go-live: accept Vendor Agreement (versioned, STAFF-017), `canGoLive` check (business name, contact channel, profile photo, ≥1 active listing).
**Missing raised:** vendor "publicly visible only when ≥1 published listing AND consent accepted" (Doc 03 §276) — visibility derivation not yet a specced state/screen.

---

## VS4 — Shopper Apps (`/shopper/*`, SHOP-001..005)
**Tier:** Functional (Slice 5), S5. **Env:** Cream.
**Sub-artifact inventory:** dashboard (activity + saved searches) · messages list (shopper-facing; native not WhatsApp; full messaging = VS6) · saved listings · settings (prefs/notifications) · verification status (Student Vouched language).
**Missing raised:** notifications panel-primary (PG-SHOP-005 PROVISIONAL panel) — not fully specced.

---

## VS5 — Vendor Builder (`/vendor/*`, VEND-001..007)
**Tier:** Functional (Slice 6), S6. **Env:** Cream.
**Sub-artifact inventory:** dashboard (attention queue, not stat-grid) · listings mgmt (CRUD) · listing create/edit (VEND-007, large experience not sub-form) · settings · verification (trust flow → staff review) · campus config (reuse list).
**Missing raised:** dashboard "attention queue" framing needs the workbench spec; same B.16 stress as storefront.

---

## VS6 — Messaging (`/messages/*`, MSG-001/002)
**Tier:** Functional (Slice 7), S7. **Status:** FEATURE not MVP. **Env:** Cream.
**Sub-artifact inventory:** inbox (thread list, unread count, last-msg preview) · thread (native bubbles, send sim, sent confirmation, D.3 cause-effect) · continuity `.explore-entrance` on open from listing.
**Missing raised:** transport undecided (Doc 07 §7.12 — mock `MessagesRepo`; real transport blocked per founder rule).

---

## VS7 — Staff Ops (`/staff/*`, STAFF-001..005)
**Tier:** Operational (Slice 8), S8. **Env:** Cream + Deep strategic. **NO signature.**
**Sub-artifact inventory:** queue (vendor verification) · case (review/moderation) · analytics · config · campus zones (Conflict B — NMU two-campus).
**Missing raised:** staff role/permission matrix (super-admin vs moderator) = UNDECIDED (Doc 07 TODO); moderation audit log required.

---

## Cross-cutting (all slices)
₦/en-NG currency · single `CAMPUS_OPTIONS` source · Student Vouched language (no WhatsApp) · no `backdrop-blur` (B.5) · `prefers-reduced-motion` · Fraunces proposed-display only.

## Verification protocol (per slice)
`tsc` → slice Playwright spec → `next build` → manual (a11y/currency/motion) → commit `feat(VS{N}): …`.

## Open gates before execution
1. **VS expansion sign-off** — committing re-opens Doc 06 sign-offs (Doc 12 "re-verify, don't reopen"); founder confirm.
2. **Landing remediation 5 decisions** — inline-style scope / contour px / trust-strip data / compass ring / sign-off rhythm — **block VS1 Chunk 1**.
3. **Email-template blueprint gap** — author spec before VS2 build.
4. **Undecided policies** — re-consent on Terms update (Doc 08/09), staff role matrix (Doc 07), messaging transport.
