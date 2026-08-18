# 10 — TESTING & QUALITY STRATEGY

> **Status:** PLANNING / DOCUMENTATION ONLY. No code. Does **not** modify Docs 00–09. **Do NOT proceed to
> Doc 11 — REVIEW AND LOCK DOC 10 FIRST.**
>
> **Authoritative constraints:** Docs 00–09 (product LOCKED; design LOCKED; data model Doc 08; security Doc
> 09; build slices Doc 06). OPEN/PROVISIONAL/LATER items in those docs are carried forward, not silently
> resolved here.
>
> **Purpose (founder):** Doc 10 is where we make it *difficult* for implementation to accidentally turn
> Voeq into something else. Nine documents define what Voeq *is*; this document defines the quality system
> that **says NO** when a beautiful implementation violates a locked principle. "It renders" is not a
> passing criterion.

---

## 10.1 — Testing philosophy

- **Tests protect product behavior, security boundaries, design-system rules, and user journeys** — not just
  code correctness.
- **The QC principle (Doc 05, after Part C) is mandatory and testable:** *implementation convenience never
  overrides the locked product/design system.* A faster card-grid that violates the C.3.1 editorial
  composition is a **failing** build, not a pragmatic one.
- **Every test traces to a locked source.** A test with no anchor in Docs 00–09 is scope creep.
- **Don't maximize test count.** Each layer below exists to protect a specific class of regression; we add
  tests where the locked system is at risk, not everywhere.
- **A later slice must not silently weaken an earlier locked rule.** Regression gates are cumulative.

---

## 10.2 — Test layers (what each protects)

| Layer | Protects | Tool class (🔲 OPEN mechanism) |
|---|---|---|
| **Unit** | Component logic, arrangement selector, contour gate, repo transforms | 🔲 (Vitest/Jest class) |
| **Component** | Six-dimension spec per `ui` component; token usage | 🔲 |
| **Integration** | Repository boundary fulfills interface; route renders with fixture | 🔲 |
| **Repository/data-contract** | Mock satisfies Doc 08 types; swap-safe | 🔲 |
| **Route/page** | PG-ID page renders; environment correct; states | 🔲 (RTL/Testing-Library) |
| **E2E** | Critical journeys (§10.6) | 🔲 (Playwright class) |
| **Accessibility** | WCAG 2.2 AA behaviors (§10.8) | 🔲 (axe/Lighthouse class) |
| **Visual/regression** | Design drift, not pixel noise (§10.10) | 🔲 (snapshot-diff class) |
| **Performance** | Budgets (§10.9) | 🔲 (Lighthouse/WebPageTest class) |
| **Security** | "Client describes intent; server decides authority" (§10.7) | 🔲 (authz test harness) |

Each layer is justified by a locked risk; no layer exists "because frameworks have it."

---

## 10.3 — Design-system conformance (catches philosophy drift)

Automated + review checks that detect a violation of Doc 05:

- **Deep/Cream environment violations** — a Cream route must not render Deep tokens; Landing/Auth only may
  be Deep (Doc 05 A.3). Test: assert `data-env` per route.
- **Incorrect token usage** — components reference role tokens (`--voeq-surface`), never raw hex. Test: scan
  for hardcoded color literals in `ui`.
- **Typography regressions** — Fraunces/Hanken (PROVISIONAL) applied per B.2 scale; test type-scale tokens.
- **Spacing/grid violations** — 8pt scale + 12-col grid + 4px radius (B.3/B.4). Test: assert radius ≤4px on
  structured surfaces; spacing multiples of 8.
- **Excessive card/container usage** — the "containers are earned" rule (B.4). Test/heuristic: flag pages
  where >N% of surface area is bordered cards without composition reason.
- **Contour without meaning** — `ActivityNode` renders ONLY with a real event; no fake geography (A.8/B.11).
  Test: render contour with zero activity fixtures → assert zero nodes; assert `CampusFingerprint` absent
  when no real geo.
- **Motion language violations** — cause→response→relationship→transition→rest (D.1); no perpetual
  decoration. Test: assert no infinite/idle loops; reduced-motion disables non-essential motion (D.8).
- **Decoration drift** — no glassmorphism/blobs/aurora/particles (anti-cliché list). Test/heuristic: flag
  forbidden CSS patterns.

---

## 10.4 — Storefront = mandatory stress-test gate (B.16)

The §8.18 storefront fixture is a **formal quality gate**, not a demo. A slice is not complete until the
15-listing storefront passes on **mobile + desktop**:

- 15 listings; **≥5 intentionally poor-quality images** (fixture-supplied, not a domain field — Doc 08 §8.5).
- Trust/verification present; business information present; social proof present; reviews present;
  availability present; native messaging CTA present.
- **Gate criteria:** remains composed + usable; no card-monotony (C.3.1 arrangements exercised); above-the-
  fold answers who/what/why-message; richness organized not hidden (C.6 #6). This is the **B.16 six
  criteria** as automated + reviewed checks.

---

## 10.5 — Content-density testing (C.3.1 selector)

Explicitly fixture-driven, asserting the locked rule **content density + user intent → image-led /
editorial / hybrid / compact**:

| Scenario | Assert |
|---|---|
| 3 listings + discovery intent | image-led arrangement |
| 15 listings + comparison intent | editorial/hybrid |
| 100 listings + scanning/search intent | compact |
| no reviews / many reviews | social-proof layer adapts, no overflow |
| poor images / excellent images | B.6 treatment holds; layout stable |
| long titles / long descriptions | no break/overflow; truncation intentional |
| missing optional info | graceful, not broken (C.5.4) |
| unusual/long UGC | XSS-safe render (Doc 09 §9.14), no layout break |

The presentation selector (Doc 08 §8.21) is unit-tested against these mappings — this is what stops
"random assembly."

---

## 10.6 — Critical user journeys (E2E)

Defined, at minimum, as Playwright-class journeys mapped to Doc 04 PG IDs:

1. **Landing → Explore** (continuity, D.4.1) — asserts one-world transition, not two sites.
2. **Explore → Listing Detail** (shared-element open, D.2).
3. **Explore → Vendor Storefront** (B.16 stress).
4. **Google signup → Voeq consent → account completion** (08b §1.2; consent gate, not Google auto-complete).
5. **Email signup → consent → account completion.**
6. **Shopper → Vendor capability transition** (one Identity widens; no second account).
7. **Vendor onboarding (5-step) → storefront/listing creation** (Doc 03 FLOW-ONB-VEND).
8. **Listing creation/editing** (PG-VEND-007 distinct).
9. **Save / follow / like** (idempotent upsert, §9.8 Tier A).
10. **Review** (one-per-vendor upsert).
11. **Messaging** (Slice 7; pending→sent→delivered, §9.8 Tier B). **Safety tests (C11, Doc 13 §13.M.5/.M.6):**
  message send without participation → 403 if not a participant (IDOR, §9.7); spam/rate-limit per-identity
  burst enforced (§9.13); report message/conversation → staff case (§9.9); malicious-link/content server-side
  scan + sanitize (§9.14); notification preview shows sender + generic "new message" only, never body (§9.16).
  Messaging infra stays Slice 7 / not-MVP — these journeys/tests gate it when built.
12. **Account deletion** (deactivation + anonymization, §9.17).
13. **Terms/Privacy re-consent** (hard gate, §9.22 — blocks mutations until accepted).
14. **Staff moderation Queue → Case → Evidence → Decision → Consequence** (C.5.3).

---

## 10.7 — Security-quality tests (Doc 09 spine)

Every test enforces **"client describes intent; server decides authority"** (§9.10). Must include:

- **IDOR / ownership violations** — actor edits another vendor's listing / reads private message → 403.
- **Capability escalation** — Shopper calls `listing.create` → denied.
- **Moderator → Admin/Super Admin** — Moderator attempts `staff.config`/`capability.grant` → denied (§9.6).
- **Client-forged verification** — client sends `verified:true` → ignored; domain authoritative.
- **Client-forged roles** — client asserts `role:'staff'` → ignored.
- **Client-forged ownership** — client `vendorId` tampered → server ownership check fails.
- **Consent bypass** — mutation without `ConsentAcceptance` for current version → denied (§9.4/§9.22).
- **Google consent bypass** — Google-authed identity without consent record → account not completed.
- **Replay / double-submit** — duplicate idempotency key → single effect (§9.8 Tier B).
- **Unauthorized staff actions** — non-staff hits staff route → denied.
- **Audit tampering** — client attempts to write/alter `AuditRecord` → denied (§9.10 #8).

---

## 10.8 — Accessibility (WCAG 2.2 AA where applicable)

- **Keyboard navigation** — all interactive elements reachable; bottom-nav mobile, logical order.
- **Focus visibility** — 2px `accent-strong` ring (B.8 LOCKED) on keyboard focus.
- **Semantic structure** — landmarks, headings, lists correct.
- **Labels** — form inputs, icon buttons labeled.
- **Contrast** — AA in both environments; gold never body text (B.1).
- **Screen-reader behavior** — contour/activity announced meaningfully or hidden; images alt'd.
- **Reduced motion** — D.8: no non-essential motion; contour pulse → static.
- **Touch targets** — ≥44px on mobile (B.9).
- **Error recovery** — actionable copy, focus returned to error (C.5.4).

---

## 10.9 — Performance (meaningful budgets, not "fast")

- **Mobile-first; mid-range Android target** (D.7 LOCKED constraint).
- **60fps** for applicable motion on target device; animate `transform`/`opacity` only.
- **Image loading** — B.6 frame skeleton; ratio-cropped; no layout shift.
- **JS/client boundary discipline** — server components by default (Doc 07 §7.3); lean client bundle.
- **Route performance** — LCP/LCP-ish budget per public route (Landing/Explore/Storefront priority).
- **Interaction responsiveness** — tap→ack ≤120ms perceived (D.1 response).
Budgets are 🔲 OPEN exact numbers, but the *constraint* (60fps mid-Android, mobile-first) is LOCKED.

---

## 10.10 — Visual regression (design drift, not pixel noise)

Controlled reference surfaces (not screenshot obsession):
- Landing · Explore · Listing Detail · **15-listing Storefront** · Messaging · Staff moderation.

- Reference images captured per surface at fixed viewport(s). Diff against references on change.
- **Catches design drift** (token/environment/composition change) — **ignores** harmless rendering
  variance (anti-aliasing, font hinting). Threshold tuned to surface, not global.
- The 15-listing storefront reference is the key anti-drift anchor for the public portfolio piece.

---

## 10.11 — Motion testing (Part D language)

- **cause→response→relationship→transition→rest** — assert every animated element has a trigger; no
  orphan animation.
- **No purposeless perpetual animation** — scan for infinite loops; blobs/gradients/particles absent.
- **Real-event contour pulses once** — activity node pulses single time then static; reduced-motion →
  static dot (D.5/D.8).
- **Landing → Explore continuity** — transition preserves spatial/visual continuity (D.4.1 LOCKED
  requirement); not "dark page → different site."
- **Reduced-motion** — all non-essential motion disabled; environment swap instant (D.8).
- **3D remains optional** — if a 3D experiment ships, it must pass the four D.9 tests; otherwise absent.
  Test asserts 3D is not present unless explicitly enabled + passing.

---

## 10.12 — Data / fixture strategy (canonical, Doc 08 §8.18)

Single source of fixtures consumed across layers:
- Landing (real-ish activity), Explore (≥40 listings), Listing (rich), **3/15/100-listing storefronts**,
  imperfect images (≥5 poor in the 15), authenticated users, **multi-capability users** (shopper+vendor),
  **each staff role** (Moderator/Admin/Super Admin with scoped capabilities), reports/cases (full
  Queue→Case→Evidence→Decision→Consequence), **consent versions** (current + stale to exercise re-consent),
  **deleted accounts** (deactivated + "Deleted account" attributed reviews).
- Fixtures are typed by Doc 08 interfaces; the 15-listing fixture is the §10.4 gate input.

---

## 10.13 — CI / quality gates (what blocks progression)

- **Per-slice gate:** a slice is **not complete** if any required gate fails (design conformance §10.3,
  storefront stress §10.4, journey §10.6, security §10.7, a11y §10.8, perf budget §10.9 where applicable).
- **Cumulative regression:** a later slice cannot lower an earlier locked gate.
- **OPEN-mechanism choices (Doc 09)** do not block merges on policy — only on the LOCKED behaviors those
  mechanisms must enforce.

---

## 10.14 — Slice verification (Doc 06 sequence)

Each slice = **build → test → inspect → stress → approve → proceed**. No "build everything, test at end."

| Slice (Doc 06) | Key gates |
|---|---|
| 0 Foundation | tokens/environments render; reduced-motion; a11y baseline |
| 1 Landing | Deep env; contour meaningful; continuity source |
| 2 Explore + transition | continuity LOCKED; arrangement selector |
| 3 Listing Detail | shared-element open; ugly-photo treatment |
| 4 **Storefront stress** | **B.16 six criteria (mobile+desktop)** |
| 5 Auth/Shopper | consent gate (email+Google); `?next=`; single identity |
| 6 Vendor onboarding/dash | 5-step; attention queue; capability |
| 7 Messaging | pending→sent→delivered; idempotent |
| 8 Staff | workbench flow; Moderator scope enforcement |

---

## 10.15 — Failure taxonomy (which are release blockers)

| Category | Example | Blocker? |
|---|---|---|
| **Product contradiction** | card-grid overrides C.3.1 editorial composition | 🔴 BLOCKER |
| **Design-system regression** | Cream route renders Deep; hardcoded hex; forbidden decoration | 🔴 BLOCKER |
| **Accessibility failure** | AA contrast fail; no focus ring; unlabeled control | 🔴 BLOCKER |
| **Security failure** | IDOR; capability escalation; consent bypass; forged role/verify | 🔴 BLOCKER |
| **Data-contract failure** | mock violates Doc 08 type; swap would break UI | 🔴 BLOCKER |
| **Performance failure** | <60fps mid-Android on public route; jank from motion | 🔴 BLOCKER |
| **Content-density failure** | 15-listing storefront degrades; selector wrong arrangement | 🔴 BLOCKER |
| **Motion failure** | perpetual decoration; contour without event; continuity broken | 🔴 BLOCKER |
| Visual noise (harmless render delta) | font hinting diff | 🟡 non-blocker |
| OPEN-mechanism choice | picked NextAuth vs custom | 🟡 non-blocker (policy unaffected) |

The 🔴 BLOCKERs are precisely the "says NO" cases — a beautiful build that violates a locked principle
fails.

---

## 10.16 — Quality ownership

| Responsibility | Owner |
|---|---|
| Automated tests (unit/integration/security/E2E) | Engineering (CI-enforced) |
| Visual review / design-system conformance | Design review (founder + Hermes) + automated §10.3 |
| Security assertions | Engineering against Doc 09; founder reviews scope |
| Fixture integrity | Engineering; typed by Doc 08; founder reviews storefront fixture |
| Final slice approval | **Founder** (per Doc 06 §6 sign-off gate) |

No slice proceeds without founder approval at the §10.14 gate.

---

## 10.17 — Open / provisional decisions (carried forward, NOT resolved)

From Doc 09, explicitly carried (mechanisms only, no product policy):
- Session strategy (NextAuth vs custom) 🔲
- Verification method 🔲
- Rate-limit / CSRF mechanism 🔲
- Image scanner 🔲
- Self-conflict staff moderation block 🔲
- Reporter visibility vs reported 🟡
- Exact perf budget numbers 🔲 (constraint LOCKED)
- Test tooling choices 🔲 (Vitest/Playwright/axe class)

None of these are decided here; Doc 10 tests the LOCKED behaviors they must enforce.

---

## 10.18 — What Doc 10 does NOT do

- No code; strategy documentation only.
- Does not modify Docs 00–09.
- Does not silently resolve Doc 09 OPEN mechanisms.
- Does not weaken any LOCKED decision.
- **Does not proceed to Doc 11.**

---

**END OF DOC 10 (Testing & Quality Strategy). DO NOT PROCEED TO DOC 11 — REVIEW AND LOCK DOC 10 FIRST.**
