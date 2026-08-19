# Voeq — Developer Build Specification
**Prepared for platform rebuild — reflects all current decisions as of this document's date**

---

## 1. What Voeq Is

Voeq is a campus marketplace **directory** — not e-commerce. Students discover vendors on their campus and connect directly with them. Voeq does not process payments, hold funds in escrow, or act as a party to any transaction (Phase 1). This is a **permanent, deliberate** decision (Jiji-style classifieds model), not a temporary limitation — see Section 6 for what changes in Phase 2.

First campus: **NMU (Nigeria Maritime University)**, which has two physical campuses — **Kurutie** and **Okerenkoko** — about 20 minutes apart by water with significant existing cross-campus activity.

Launch target: **October 7–10, 2026** (timed to returning students, not the Sept 27 fresh-student resumption).

---

## 2. Core Architecture

### 2.1 Category lives on the LISTING, not the vendor
- A vendor profile can have multiple listings, each with its own category.
- Buyer category search/filter shows matching **listings**, not vendor cards.
- Tapping a listing leads to that vendor's full storefront (all their listings, grouped into sections).
- No separate Products/Services tag — deferred as a post-launch addition if data shows it's needed.
- 20 categories: Food, Fashion, Tech, Beauty, Repairs, Printing, Laundry, Photography, Academic Services, Logistics, Furniture, Health & Wellness, Catering, Cleaning, Electrical, Plumbing, Tailoring, Supermarket, Pharmacy, Other.
- Vendors can list under "Other" if their offering doesn't fit an existing category.
- Considering adding an **"Accessories"** category (NMU is a regimental school — students look for regimental kits/items). Two vendors already identified in this space.

### 2.2 Vendor listing flow — 5 steps, continuous
1. Vendor name / basic info
2. Contact and location
3. Profile photo
4. First listing (category, photo, description, price)
5. Review → **Go Live** → lands on storefront where more listings can be added, each with its own category

- Sign-up is required before "List Business" can be started.
- Profile shows **"Incomplete"** until it has at least one listing, then shows **"Complete"** with a **"Go Live"** button available — mirrors Etsy's require-one-listing-before-shop-opens model.
- Add a **"Browse Listings"** page alongside the existing "Browse Vendors" page in the site menu.

### 2.3 Campus toggle
- Buyers can toggle between Kurutie and Okerenkoko (not locked to one campus).
- Cross-campus buying is supported (a Kurutie buyer can connect with an Okerenkoko vendor, and vice versa).
- Vendor registration includes an **eligibility section**: vendor selects **Campus Vendor** or **Off-Campus Vendor** status — this is the mechanism students use to identify whether a vendor is on-campus or off-campus.

### 2.4 Sign-in / authentication
- Email OTP only (not phone OTP).
- Buyers can also sign up via **Google**.
- **No matric number, no NIN collected anywhere.** This was explicitly dropped — a developer previously flagged that using .edu email or matric number alone as identification is phishing-prone; resolved by using email OTP only.
- Vendor "verification" is **self-reported** at listing time (vendor confirms they're presently operating on the campus they select) — Voeq does **not** independently verify identity or physical presence. Trust instead relies on "Student Vouched" tagging and reviews (not ID-based badges).
- **Important for copy/UX:** do not use the words "verified" or "no scams / no fake profiles" anywhere in vendor-facing or public copy — this overstates what Phase 1 actually does. Any UI text implying formal verification needs to be corrected.

---

## 3. Connection Model — MAJOR CHANGE IN PROGRESS

**WhatsApp redirection is being scrapped.** Voeq is moving to **in-app chat** for buyer–vendor connection instead of redirecting to WhatsApp.

- This is a real-time messaging feature to be built into the platform itself.
- Recommended approach given timeline pressure: a **managed chat SDK/API** (e.g. Stream, Sendbird, or similar) rather than a fully custom-built real-time system, to avoid extending the timeline further. A self-built WebSocket-based system (e.g. Node.js + Socket.IO) is also being considered by the developer directly, scoped tight (text-only, no read receipts/typing indicators/media at first) if going the custom route.
- **Connect-button analytics stay internal** (for founder's own tracking) for now, and are planned to become a vendor-facing paid-tier feature once payment integration launches (Phase 2).
- Implication: any copy referencing "WhatsApp" as the connection method should be written generically ("connect directly," "message the vendor") rather than naming WhatsApp specifically, since the underlying mechanism is changing.
- Note: WhatsApp is still very much in use for **community/marketing** purposes (a WhatsApp Channel + Community with General and Vendors groups) — this is separate from the in-platform connection feature and is not affected by this change.

---

## 4. Monetization / Legal Status (Phase 1 vs Phase 2)

### Phase 1 (current, through ~January 2027)
- **Free to list.** No fees of any kind through this period.
- **No payment processing, no escrow, no commission.** Voeq is not a party to any transaction.
- Revenue starts around **February 2027**, non-transactional only:
  - **Subscription:** free basic listing forever; paid tier ₦800/month for enhanced features (more photos, better search placement, analytics, priority support)
  - **Pay-as-you-go add-ons:** homepage feature ₦2,000/7 days, category top placement ₦1,500/7 days, monthly vendor spotlight ₦3,000, weekly demand report ₦1,500/month

### Phase 2 (deferred, pending proper legal research — no firm date)
- Listing stays free even in Phase 2.
- Revenue model expands to: **transaction commission**, an **optional** subscription (not mandatory), **pay-as-you-go features**, and **ads**.
- This is when payment processing / escrow infrastructure would be introduced — deliberately deferred until there's proper legal counsel, dispute-handling staff, and other structures in place. Not being built prematurely or solo.
- Future features under this later phase (flat-fee monetized, not commission-based in current thinking): **Waybill** (directory of independent runners bringing mainland items to NMU), **Housing/leasing/sublets** section (verified landlord listings), **Event ticketing**, **Supplier network** for vendor bulk purchasing.

**Do not build any payment/escrow/checkout infrastructure in this rebuild.** Phase 1 scope only.

---

## 5. Public-Facing Copy — Current Corrections In Progress

The live site had several overstated claims that are being corrected. Apply these standards to the rebuild:

- **No usage-claim numbers.** Do not say "used by," "thousands already using," or similar unless literally true. Correct language: "Launching at NMU — expanding to 100+ Nigerian universities" (capability framing, not usage).
- **Drop the "100+ Universities" stat card** from the homepage entirely (was previously alongside "20+ Categories," "Free," "Direct" — now just those three, or find a genuine replacement stat like "Verified" if one is added later).
- **Remove the "Coming soon to campuses near you" university name list** from the homepage entirely (was visual clutter) — do not replace with a ticker or counter, just remove the section.
- **CTA section line:** "Be one of the first to find what you need on campus." (replaces any "join thousands" language)
- **Vendor-recruitment section:** "Reach every student on campus" (replaces "Reach 10,000+ students")
- **Remove duplicated features block** — the "Verified campus vendors / Direct WhatsApp connect / Built for students" (or equivalent) content block currently appears twice on the homepage; keep one instance only. (Also update wording here to remove "verified" language per Section 2.4.)
- **Remove the "What is Voeq?" explanatory section from the homepage** — this content already lives on the About page and shouldn't be duplicated.
- **About page:** remove the duplicate "Pronounced 'Voke'" callout that repeats what's already stated in the intro line.
- **Footer:** remove the "Pronounced /vouk/ — like Vogue" line site-wide (inconsistent with the About page's "voke" pronunciation and redundant).
- **Meta description / OG tags:** currently still reference "100+ universities" — needs the same fix as the homepage hero line, since this text is what shows in search results and link previews (WhatsApp/Twitter/Facebook shares).
- **Logo duplication:** the sign-in (and likely sign-up) page currently shows the Voeq wordmark twice — once in the nav, once inside the auth card. Remove one instance.
- **Favicon:** currently not resolving correctly. Use the app icon (dark-background version, matching Instagram) rather than the full wordmark — simple, legible at 16–32px. Confirm a proper `<link rel="icon">` tag exists in the deployed HTML `<head>` and that the file path actually resolves (test by visiting the favicon URL directly). Export in standard sizes: 16x16, 32x32, plus 180x180 (Apple touch icon), 192x192/512x512 (Android).
- **Footer credit** reads "Powered by Legacy LM" (developer/CTO's coder alias) — correct as-is, no change needed.

---

## 6. Legal Documents — Current State

Terms of Service, Privacy Policy, and About page copy have been rewritten to:
- Remove "verified" / "no scams" language (vendor presence is self-reported, not independently verified).
- Use connection-method-agnostic language ("in-platform messaging," "connect directly") rather than naming WhatsApp specifically, since the connection model is changing.
- Remove housing/leasing/sublets references (Phase 2 scope, not current).
- State Voeq's current reality accurately: "Voeq is currently live at NMU. The goal is to grow campus by campus across Nigeria over time" — present state and future intent kept as separate, honest claims (not implying expansion is already underway).
- Confirm minimum age 13.
- Confirm Voeq is **permanently** non-transactional/discovery-only — not "moving toward e-commerce" language anywhere.

Full current drafts of ToS, Privacy Policy, and About page are available separately — ask if you need the latest text to implement directly.

---

## 7. WhatsApp Community Structure (reference only — not part of the site build, but linked from it)

- **Channel:** "Voeq" — broadcast only, everyone. Uses the wordmark as its icon (distinct from Community/Groups).
- **Community:** "Voeq Community" — parent container, plain icon-only logo mark (dark background, matches Instagram).
- **Group — General:** open to everyone (shoppers + vendors), icon uses the logo mark with a small chat-bubble accent.
- **Group — Voeq Vendors:** vendors only, admin-approval join, icon uses the logo mark with a small storefront accent.
- Footer should link to the WhatsApp Channel (and/or Community) under the Social section, alongside Instagram, TikTok, Twitter/X.
- Ownership of the Channel/Community is transferring from the Creative Director to the founder, with both as moderators.

---

## 8. Known Issues / Current Blockers

- **Onboarding and vendor dashboard pages are not working** on the current build — this is the reason for the rewrite. Both need to be functional and tested end-to-end (ideally with real test vendors, not just internal testing) before the delayed publicity push resumes.
- Current live site (voeq.vercel.app / voeq.ng in progress) still has category linked to the **vendor**, not the **listing** — this contradicts the finalized architecture in Section 2.1 and needs to be corrected in the rebuild.
- Search bar placeholder text ("Search vendors, services, o...") was observed truncating on mobile — worth checking during rebuild.

---

## 9. Out of Scope for This Rebuild

- Any payment processing, escrow, or checkout flow (Phase 2, deferred).
- Housing/leasing/sublets as a category (Phase 2).
- Native mobile app (currently mobile-first web only; app is a later-stage consideration).
- Products/Services tagging on top of categories (deferred post-launch).

---

*This document reflects decisions made through the current planning session. If anything here conflicts with a more recent conversation between the founder and developer, the more recent decision takes precedence — flag any discrepancy back to the founder before building.*
