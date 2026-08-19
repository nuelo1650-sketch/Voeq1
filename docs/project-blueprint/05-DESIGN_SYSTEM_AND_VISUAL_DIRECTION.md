# 05 — DESIGN SYSTEM & VISUAL DIRECTION

> **Document status — ALL STAGES COMPLETE (founder-approved):**
> - **Part A — Design Strategy** 🔒 LOCKED
> - **Part B — Visual DNA / tokens** 🔒 structure LOCKED · 🟡 font + exact palette PROVISIONAL
> - **Part C — Components & composition grammar** 🔒 LOCKED (+ quality-control principle)
> - **Part D — Motion language** 🔒 LOCKED · continuity REQUIREMENT 🔒 · contour-carry PROPOSED · 3D 🟡 EXPERIMENTAL
>
> **No more design documents before we build.** Next = build execution plan, then feature-by-feature
> vertical slices (global foundation + public-facing surfaces first), verifying each slice before the
> next. See §QC principle (after Part C) — implementation convenience never overrides the locked system.
> **Author:** Hermes (design strategist), executed from Docs 00–04 + DESIGN_HANDOFF + founder direction.
> **Hard rule applied throughout:** color alone does not define the brand. Identity = the *combination*
> of type + composition + spatial rhythm + imagery treatment + interaction + contour/activity system.

## Document structure (4 stages, one canonical file)

- **Part A — Design Strategy** 🔒 LOCKED
- **Part B — Visual DNA / tokens** 🔒 structure / 🟡 aesthetics
- **Part C — Components & composition grammar** 🔒 LOCKED
- **Part D — Motion language** 🔒 LOCKED (3D experimental)

This prevents the first pass from being mistaken for a finished system. Each stage was reviewed before
the next began. **All four stages are now complete and locked (3D experimental).** No further design
documents before build.

---

# PART A — DESIGN STRATEGY

## A.0 — The problem with the last attempt (so we don't repeat it)

From `DESIGN_HANDOFF.md` (honest post-mortem), the prior exploration failed for four reasons, all of
which this strategy must avoid:

1. **Option-board, not a bet.** Breadth of directions instead of one well-executed vision. → This stage
   produces *one* recommended strategy, with rejected alternatives explained, not a menu.
2. **Generic stock photography sank the premium feel.** → Imagery is treated as a *system* designed for
   real, imperfect user uploads (see A.7), never stock placeholders.
3. **The signature was too timid.** The contour concept was dialed to 6–9% "for legibility" and read as
   texture, not phenomenon. → The signature now has explicit *meaning and rules of appearance* (A.12);
   its strength is permitted where content warrants it, not suppressed everywhere.
4. **Tight constraints converged into one muted register.** → We deliberately hold two environments
   (Deep forest + Warm cream) and refuse to let either alone carry identity (A.2, A.4).

---

## A.1 — Voeq's visual personality

**LOCKED (founder direction, carried from Doc 01 + chat):**

> Voeq = a minimal, editorial, modern **campus marketplace** with a distinctive visual identity.

Five tensions we hold *simultaneously* — none may win outright:

| Tension | We are… | …not… |
|---|---|---|
| Minimal, but not empty | disciplined whitespace, one idea per surface | a void with no content |
| Modern, but not SaaS | confident, contemporary composition | generic startup dashboard aesthetics |
| Premium, but not luxury cosplay | considered materials, restraint | gold-leaf / fashion-house posturing |
| Campus-native, but not "student app" cliché | real campus language, local context | emoji-bright student-portal look |
| Animated, but motion has meaning | motion encodes state/activity | ambient animation for its own sake |

**One sentence:** Voeq should feel like a *well-art-directed marketplace you'd want to keep open* — not a
magazine you admire once and close.

**The deeper test (founder's rule, LOCKED):** *Do not optimize for screenshots. Optimize for the product
being beautiful after 500 real vendors have filled it with imperfect content.* Every decision below is
judged against that, not against a hero render.

---

## A.2 — Design principles (the operating beliefs)

1. **Identity is combinatorial.** No single axis (color, type, motion) defines Voeq. The *combination* of
   type + composition + spatial rhythm + imagery treatment + interaction + contour system does.
2. **Two environments, one world.** Deep forest and warm cream are environments within a single visual
   language, not themes. (See A.4 hard constraint.)
3. **Editorial, not magazine.** Composition can be publication-grade, but usability wins the moment a
   vendor shows 15 listings.
4. **Restraint is the brand.** Gold is punctuation. Motion is purposeful. Decoration that doesn't serve
   the brief is cut.
5. **Design for the ugly photo.** The system must make a poorly-lit phone photo of jollof sit
   *beautifully*; a great photo should look *great*, never broken. (A.7)
6. **The signature means something.** The contour/activity system appears *only* where content is about
   location, activity, or arrival. (A.12 hard constraint.)
7. **Performance and reduced-motion are design constraints from hour one**, not retrofits.
8. **Avoid the forbidden list (LOCKED — founder):** generic SaaS aesthetics, glassmorphism, excessive
   gradients, floating-card soup, trendy AI-startup visuals, 3D/WebGL as flex.

---

## A.3 — Light/dark environment relationship (HARD CONSTRAINT B)

**LOCKED framing:** Deep forest and cream are **not separate themes**. They are two environments within
one visual world. A user landing on Deep forest and tapping into cream Explore must feel they entered a
different *room of the same building*, not loaded a different website.

**The binding agent — what is identical across both environments (must hold or the strategy fails):**

| Dimension | Shared across Deep + Cream |
|---|---|
| Typography | same display + body + data faces, same scale, same tracking |
| Grid | same column logic, same gutter ratio, same breakpoints |
| Spacing | same spacing scale (8pt base, named steps) |
| Components | same component vocabulary; only *surface tokens* flip (bg/text/border) |
| Imagery treatment | same frame/matte/overlay rules regardless of environment |
| Motion language | same easing, same durations, same hierarchy |
| Contour vocabulary | same marks, same meaning; only *intensity* varies by environment + context |

**Where each environment lives (PROVISIONAL — founder to confirm):**

| Surface | Environment | Rationale |
|---|---|---|
| Landing / arrival | **Warm cream** (Cream-first arrival, 2026-08-19 reversal) | brand moment, first impression, strongest signature expression |
| Explore / discovery | **Warm cream** | dense browsing needs light canvas; contour = spatial whisper |
| Vendor storefront | **Cream + Deep hero** | cream for density; Deep hero carries the campus-identity mark |
| Listing detail | **Warm cream** | reading + imagery; needs light |
| Shopper home | **Warm cream** | discovery feed, same job as Explore |
| Messaging | **Warm cream** | sustained reading; calm |
| Vendor dashboard | **Warm cream** | data density |
| Staff (Moderation/Audit/Config/Analytics) | **Warm cream (Deep used strategically inside)** | LOCKED: Staff is an operational environment — queues, tables, evidence, audit, analytics, config. Cream handles density; Deep forest is used *strategically inside Staff* for hierarchy, important states, navigation, or high-value moments — never as the surface. |
| Auth / account states | **Cream** (default arrival; Deep *strategically inside* only) | focused, low-distraction arrival — Cream keeps it calm; Deep reserved for in-flow high-value states |
> ↩️ **Auth row resolved 2026-08-19 (founder Cream-first reversal):** was "Deep forest"; now Cream-default, mirroring the Landing row above. Deep permitted *strategically inside* Auth (alerts/high-value states) but never the arrival surface. See the table reversal note below + Doc 07 §7.2 / Doc 12.

> ⚠️ **REVERSAL OF THIS TABLE — 2026-08-18 (founder Cream-first call, confirmed):**
> The **"Landing / arrival → Deep forest"** row above is **reversed**. Cream is now the **default
> environment across ALL public routes, including Landing**. Deep is an alternate/intentional environment
> (still fully supported via the styleguide flip and any future opt-in) but is **never the silent default
> anywhere**, including Landing and Auth. The "Explore / discovery → Warm cream" and downstream cream rows
> remain correct. This overturns what was previously marked LOCKED/PROVISIONAL-to-confirm; the founder has
> now confirmed the opposite. See Doc 06 §2 Slice 1 reversal note for the canonical record. Do not
> re-derive "Landing = Deep" from this table.

**The transition rule (LOCKED):** The Deep→Cream boundary occurs *once*, at Landing→Explore (and
conceptually at Storefront-hero→body). We do **not** flip environments mid-task. A user inside Explore
stays cream; inside a storefront stays cream; inside Staff stays cream; only the deliberate "arrival"
surfaces are Deep. This is what prevents theme-switch whiplash.

**Conceptual progression (LOCKED framing):** the environments tell a story —
**Arrive in Voeq (Deep) → enter the marketplace (Cream) → operate inside it (Cream).** Deep is the
*brand/arrival* environment, not an arbitrary second theme. Its scarcity is what gives it weight.

> ⚠️ **REVISION OF THIS PROGRESSION & TRANSITION RULE — 2026-08-18 (founder reversal, accepted):**
> Because Landing is now **Cream** (not Deep), the "Arrive in Voeq (Deep) → enter (Cream)" story and the
> "Deep→Cream boundary occurs once at Landing→Explore" rule are **collapsed**. Landing→Explore is now
> **Cream→Cream**. The founder accepted this consequence. Continuity between Landing and Explore must be
> re-established through **composition / motion / shared components**, NOT an environment-color flip.
> **Slice 2 (Explore) planning MUST define a new continuity strategy before build.** This is recorded here
> so the old "flip once" device is not silently re-derived in a future slice. See the **D.4.1 REPLACEMENT
> MECHANISM note** (search "REPLACEMENT MECHANISM — 2026-08-18") for the founder-decided three-part
> continuity proposal (contour-carry + shared anchor + transient Deep accent).

---

## A.4 — Core environments defined (color ROLES, not final hex)

Per founder: exact green/gold/cream *values* are not yet locked (Doc 01 / DESIGN_HANDOFF open). This
stage defines **roles**, not values. Hex comes in Part B.

**Warm cream environment — roles:**
- `surface` (primary canvas) · `surface-raised` (cards/panels) · `surface-sunken` (insets) ·
  `ink` (primary text, forest-derived dark) · `ink-muted` · `border` · `accent` (muted gold) ·
  `accent-strong` (forest, used as structural color) · `success` / `warning` / `error` / `info`.

**Deep forest environment — roles (the SAME roles, inverted/shifted):**
- `surface` (deep forest) · `surface-raised` (slightly lighter forest) · `surface-sunken` ·
  `ink` (cream-derived light) · `ink-muted` · `border` (low-contrast forest-light) ·
  `accent` (gold, now a true highlight) · `accent-strong` (cream, used structurally) · states same.

**Key principle (LOCKED):** Forest is used *aggressively as structural color* — navigation, major
section frames, hero moments, selected surfaces, typographic emphasis — in BOTH environments. It is not
"cream site + green buttons." In Deep, forest is the canvas; in Cream, forest is the structure. Gold
remains an accent in both — never a covering.

---

## A.5 — Typography — define BEHAVIOR first, keep the system OPEN

> Per founder (revised): do **not** lock a font pairing yet. Define the *typographic behavior* Voeq
> requires, then recommend actual faces later (Part B or a dedicated type pass). The personality cannot
> come from "a generic workhorse + an occasional fancy display font on top" — that is the hedging we are
> rejecting.

**Required typographic behavior (LOCKED as requirements; the faces that fulfill them remain OPEN):**

1. **A distinctive display voice** — recognizable at a glance, with character that survives scaling from
   hero to section-opener. This is the personality carrier, used with restraint.
2. **Extremely readable interface text** — body/UI must scan effortlessly in dense marketplace surfaces
   (15-listing grids, message threads, staff tables).
3. **Strong contrast between display and utility information** — the display voice and the utility/UI voice
   must feel like different instruments, not one family at two sizes.
4. **Numbers/prices that look excellent** — a dedicated treatment for prices, counts, and data so the
   marketplace's commercial information has typographic dignity (tabular figures, considered spacing).
5. **Dense-surface competence** — the system must hold up in Explore/Storefront/Messaging/Staff without
   degrading into uniform gray text.
6. **Mobile readability** — display must degrade to a strong smaller treatment; utility text must stay
   legible at small sizes and touch distances.
7. **Enough personality to not resemble Linear / Stripe / Notion / generic SaaS** — the *behavior* (not a
   tokenized "African" face) is what separates Voeq. Nigerian-ness comes from context/content/imagery/
   campus language, never from the typeface choice itself.

**What we will NOT do (LOCKED):** auto-reach for Inter; pick a font because it is fashionable; choose a
"System 2 neo-grotesque backbone + System 3 display landmark" recommendation (the prior safe hedge) —
that framing is **RETIRED**. The actual pairing is proposed later against these behavioral requirements
and is OPEN until then.

**Three behavioral directions considered (for clarity, not as a menu to pick from):**
- *Editorial-serif display + warm grotesque utility* — literary warmth; risk: cream-editorial cliché.
- *Confident neo-grotesque display + humanist utility* — modern, usable; risk: corporate if executed tame.
- *Display-as-composition + quiet workhorse utility* — type becomes a graphic object at landmarks; risk:
  precious without discipline.
None is selected. The recommendation will be made against the 7 behaviors above, not by naming a system
now.

---

## A.6 — Grid and spatial composition

- **Base grid:** 12-column on desktop, 4 on mobile, consistent gutter ratio (~1.5× column width).
- **Editorial license:** intentional asymmetry (e.g., a 7/5 split, an offset hero, a full-bleed image
  band) is permitted on *landmark* surfaces (Landing, storefront hero, section openers) — **not** on
  functional screens (Explore grid, dashboard, messaging), where conventional density wins.
- **Whitespace as structure:** generous vertical rhythm on arrival surfaces; tighter, content-first
  spacing on dense surfaces. One spacing scale (Part B) governs both.
- **Full-bleed moments:** reserved for imagery/hero/arrival only.
- **The compositional test:** a surface is allowed asymmetry only if it improves scan-ability or
  meaning — never for decoration.

---

## A.6.1 — Voeq Density Spectrum (LOCKED framework)

Voeq spans radically different information densities. A single "minimal" treatment applied everywhere
produces the classic failure: **beautiful landing → cramped marketplace → ugly dashboard.** The system
therefore has a **density strategy**: same DNA, different density per surface.

| Tier | Name | Surfaces | Treatment |
|---|---|---|---|
| 1 | **Expressive** | Landing, major brand moments | most whitespace, largest display type, strongest signature, full-bleed permission |
| 2 | **Editorial** | Explore, storefront, listing detail | strong composition + imagery; confident but contained; signature as whisper/structural |
| 3 | **Functional** | Messaging, settings, shopper home | calm, scannable, utility-first; minimal signature |
| 4 | **Operational** | Staff (queues, tables, audit, analytics, config) | maximum information per area; quiet surface, Deep used strategically for hierarchy/states; **no** signature (A.12) |

**Rules (LOCKED):**
- Density tier is *assigned by surface job*, not by aesthetic mood. A landing is Expressive; Staff is
  Operational — they do not negotiate.
- All tiers share the same type/grid/spacing/components (A.3/A.4). Density changes *how much* is on
  screen and *how loud* the composition is, never the underlying language.
- The spacing scale (Part B) must serve all four tiers — generous at Expressive, tight at Operational,
  without a second scale.
- The storefront pass/fail gate (A.13) is the proof the Editorial tier holds under real density.



## A.7 — Image / art-direction system (designed for the ugly photo)

**LOCKED principle:** the system must make ordinary user-uploaded images look good. This is the design
challenge worth solving; it is harder than the landing page.

**Treatment rules (PROVISIONAL, to be tokenized in Part B):**
1. **Consistent frame:** every vendor/listing image sits in a defined aspect ratio (PROVISIONAL: 4:3 for
   listings, 1:1 for avatars, 16:9 for storefront hero) with a matte (cream or forest, per environment).
2. **Unifying tone overlay:** a subtle environment-matched overlay/desaturation so disparate photos
   *cohere* within a surface (a bright and a dark photo side-by-side should not fight).
3. **Smart crop:** server/client crop to the ratio; never distort.
4. **Soft, non-glassy shadow** (or no shadow) — explicitly *not* glassmorphism.
5. **Missing-image state:** an art-directed empty plate (contour mark or monogram), not a gray box.
6. **Density behavior:** on a storefront with 15 uneven photos, the frame + overlay + consistent ratio
   is what keeps it composed — the grid does the work, the photos don't have to be good.

**Imagery content direction (PROVISIONAL):** real vendor photography is the eventual star (food,
sneakers, repairs, fashion, photography — the actual campus economy). Early on, art-directed typography
carries identity; as the marketplace fills, real imagery becomes increasingly central. We do **not**
use stock placeholders in any prototype.

---

## A.8 — Vendor storefront visual language

**The aesthetic stress test surface (see A.13 pass/fail gate).** Principles:
- **Campus as structural identity — investigated from REAL geography, not faked (LOCKED):**
  - We do **not** put "vendor is at NMU → random green squiggly map behind their profile." That is exactly
    the gimmick to avoid.
  - Instead, investigate **real campus geometry**: campus boundary, meaningful zones, pathways, landmarks,
    vendor density, approximate vendor clusters. Then simplify that geography into a **Voeq cartographic
    language** — *real place → abstract visual fingerprint*.
  - This is **not** a navigation map. It is an abstract mark: two vendors at different campuses could
    carry *subtly different structural marks* derived from their actual campus shape/zone distribution.
  - **Hard rule (LOCKED): if we do not have meaningful geographic data, do NOT fake it.** The *absence* of
    a contour mark is better than decorative fake geography. A storefront with no campus mark is
    acceptable; a storefront with a fake one is not.
- **Trust-first header:** verification, rating, response-time, open-now status are primary, not buried.
- **Offerings grid:** uniform frames (A.7) absorb photo unevenness; density stays calm via the spacing
  scale.
- **Deep hero, cream body:** the hero band is Deep forest carrying the campus-identity mark (where real
  data exists) + identity; the listings below are cream. This is the canonical Deep→Cream *intra-page*
  transition.
- **Message CTA:** persistent, prominent, native — never a "WhatsApp" exit (Doc 01/03 LOCKED).
- **Card discipline (see A.10.1):** the storefront decides *per section* whether to use editorial rows,
  asymmetric arrangements, image-led grids, or compact rows — not a uniform wall of cards.

---

## A.9 — Listing-detail visual language

- **Editorial object, not card expansion:** gallery leads; title set in display; price/availability as
  clear data; vendor identity + trust as a compact block; "message vendor" as primary action.
- **Imagery-first but composed:** gallery uses the A.7 frame; related listings reuse the same frame so
  the page coheres even with one great photo and several weak ones.
- **Density handled by hierarchy:** required info (title, price, vendor, campus, availability, actions)
  above the fold; conditional info (description, reviews, related) below, clearly sectioned.

---

## A.10 — Component philosophy

- **Components must disappear into the composition.** They are a vocabulary, not a showcase. No
  component should "look like a component library."
- **Cards are a tool, NOT Voeq's visual grammar (LOCKED — founder challenge).** Marketplaces naturally
  collapse into "card + card + card," and that is exactly how Voeq would become another generic
  marketplace. The system must **decide per surface whether a card is appropriate**, not default
  everything into rounded rectangles.
  - Explore may use cards (they fit browse grids) — but even there, considered.
  - Storefronts should mix: **editorial rows, asymmetric listing arrangements, image-led grids, compact
    listing rows, sectioned information, typography-led metadata** — not a uniform wall of cards.
  - The storefront stress test (A.13) partly judges whether the offering section escapes card-monotony.
- **No excessive rounded corners (LOCKED).** Radius is a deliberate, restrained decision (tokenized in
  Part B), used for friendliness where needed, not applied universally. Sharp or near-sharp corners are
  valid and often more editorial.
- **One disciplined set:** listing tiles, vendor identity blocks, badges, buttons, pills, pricing,
  ratings, galleries, reviews/comments, message composer, navigation, tabs, filters, sheets/modals,
  empty/loading/error states — defined in Part C, all sharing the same surface/type/spacing rules.
- **Variants by necessity, not by taste:** a button has ~2 weights (primary/ghost), not 6 styles.
- **Empty/loading/error are first-class:** designed states, not afterthoughts (ties to Doc 03/04 state
  vocabulary).

---

## A.11 — Motion philosophy and hierarchy

**LOCKED hierarchy:** `micro-interaction → transition → meaningful activity → hero moment`.

**Core principle (LOCKED — founder):** Motion must communicate **state, spatial relationship, or
cause/effect.** It is not "make it feel alive." Every animation should answer: *what changed, where, and
why?*

- **Micro:** saves, follows, tabs, message send-states — fast, <200ms, purpose-bound.
- **Transition:** navigation, filters, sheet open — directional, brief.
- **Meaningful activity:** the contour/activity system *is* the meaningful-motion layer (A.12) — it shows
  real campus activity, not ambient motion.
- **Hero moment:** Landing arrival choreography only — orchestrated once, not scattered.
- **Constraints (LOCKED):** respect `prefers-reduced-motion`; degrade on weak devices; never animate for
  decoration. Motion encodes *state or activity*, never "because we can."

**Good motion (examples, LOCKED as the bar):**
- vendor activity changes → activity indicator responds (state)
- opening a listing → image transitions into detail (spatial relationship)
- sending message → message progresses pending → sent (cause/effect)
- filtering Explore → results rearrange meaningfully (state + relationship)
- navigation → spatial continuity (relationship)

**Bad motion (LOCKED forbidden):** floating blobs; endlessly moving gradients; decorative particles;
cards randomly floating; scroll animations on every section. None of these communicate anything.

**3D / WebGL must pass the same test (LOCKED):** 3D is permitted only where it creates genuine value
(e.g., an interactive Landing contour moment). **If removing the 3D makes the interaction clearer, remove
the 3D.** It is not required; rejected if it hurts performance, clarity, accessibility, or mobile. A
beautiful 2D solution wins over unnecessary WebGL.

---

## A.12 — Contour / activity signature — MEANING + RULES OF APPEARANCE (HARD CONSTRAINT A)

**LOCKED meaning:** The contour/activity system represents **campus location, activity and density**.
**It may ONLY appear when the content itself relates to location, activity, or arrival.**

| Surface | Expression | Rule |
|---|---|---|
| Landing / arrival | **Strongest** | full expression of the campus contour + live vendor-activity marks |
| Explore / discovery | **Spatial whisper — edges only (see placement rule)** | contour lives at the *edges of content*, never behind it |
| Vendor storefront | **Structural campus identity mark** | the vendor's campus contour as a map-like mark in the header (from real data, A.8); structural, not decorative |
| Vendor / Staff dashboard | **Restrained activity signals** | reduced to tiny activity pulses using the same vocabulary |
| Messaging / account / legal | **Absent** | unless context genuinely warrants it (e.g., a campus-scoped message context) |

**EXPLORE CONTOUR PLACEMENT RULE (LOCKED — founder):** "Spatial whisper" is not enough; it needs a
placement law.
- **The contour lives at the edges of content, not behind it.** Permitted: section boundaries, page
  margins, transitions between discovery zones, an occasional cropped contour entering from an edge, tiny
  activity nodes associated with *actual* content.
- **Never:** giant background lines behind cards; decorative full-screen wallpaper; contour behind text
  reducing contrast; random animated paths.
- **Activity nodes must correspond to something real.** If three vendors are trending in a campus zone,
  three subtle activity points may appear (at the edge / near that zone's section). If there is no
  meaningful activity, **nothing appears.** The absence of a node is correct, not a gap to fill.

**What it represents (concrete):** contour = campus terrain/map abstraction; vendor dots/marks = real
activity (new listing, trending vendor, open-now); density = clustering of marks. It is a *visualization
of campus marketplace life*, not ornament.

**Anti-goal (LOCKED):** it must never become "an animated background behind every page." Its appearance
is gated by *content meaning*, not by empty space.

**3D/WebGL (A.13 of brief):** permitted only where it creates genuine value (e.g., an interactive
Landing contour moment). **Not required.** Rejected if it hurts performance, clarity, accessibility, or
mobile. A beautiful 2D solution wins over unnecessary WebGL.

---

## A.13 — The storefront PASS/FAIL gate (HARD CONSTRAINT C)

**LOCKED gate:** The proposed system must be evaluated against a **dense vendor storefront** containing
≈15 listings, uneven user-uploaded photography, trust signals, price info, reviews/comments, likes/
follows, availability, messaging CTA, and campus information.

**Pass:** the surface stays composed, scannable, and premium under that density — the frame/overlay/
grid absorb the photo unevenness; trust + actions remain prominent; the Deep-hero/cream-body transition
holds.

**Fail:** if the system looks beautiful only on the landing page but becomes visually chaotic under this
density, **the design direction fails** — regardless of how good the landing is.

(Implementation of the gate — actually rendering the 15-listing storefront — happens in Part C/page
composition, on founder go-ahead. The gate is stated here as a binding acceptance criterion.)

---

## A.14 — Mobile vs desktop expression

- **Mobile = first-class, not a shrink.** Distinct breakpoint behavior, not scaled-down desktop.
- **Shared:** typography, grid logic (4-col mobile), components, motion language, contour vocabulary.
- **Mobile specifics:** bottom navigation (Doc 04 LOCKED); sheets over modals; single-pane messaging;
  stacked storefront hero→body.
- **Desktop specifics:** two-pane messaging; multi-column Explore; side panels on staff; breadcrumbs on
  sub-views. Same IA as mobile (Doc 04 §16).

---

## A.15 — Accessibility / performance constraints (from hour one)

- **Contrast:** meet WCAG AA in BOTH environments (Deep forest must not fail light-text contrast).
- **Keyboard:** visible focus; full task capability without pointer.
- **Reduced motion:** `prefers-reduced-motion` disables all non-essential motion.
- **Touch targets:** ≥44px; spacing scale enforces it.
- **Slow networks / weak phones:** imagery lazy-loads + uses the matte frame as placeholder; motion
  cost-bounded; no mandatory WebGL.
- **Animation cost:** every motion has a performance budget; nothing janks on a 3-year-old Android.

---

## A.16 — How the design avoids looking like a template

- **Not** the three AI-default looks (cream+serif+terracotta; near-black+acid accent; broadsheet hairline
  rules) — we use forest+gold+cream by founder mandate, but refuse the generic *execution* of those.
- **Owned via:** (1) the contour/activity signature as genuine campus-specific meaning; (2) the
  Deep↔Cream environment rhythm bound by shared DNA; (3) display-type-used-as-composition on landmarks;
  (4) imagery treatment that makes real photos cohere. None of these are default SaaS moves.
- **The 500-vendor test (founder):** beauty under imperfect density, not on a hero shot.

---

## A.17 — Coherence across the journey (Landing → Explore → Storefront → Dashboard → Messaging)

The binding sequence:
1. **Landing (Deep):** contour signature strongest; display-type composition; arrival moment.
2. **→ Explore (Cream):** one deliberate environment flip; same type/grid/components; contour becomes
   spatial whisper. Feels like entering the marketplace *room*.
3. **→ Storefront (Cream + Deep hero):** Deep hero carries campus-identity mark; cream body for density.
4. **→ Dashboard (Cream):** activity pulses use contour vocabulary; otherwise quiet.
5. **→ Messaging (Cream):** no signature (content doesn't warrant it); calm reading surface.

Coherence is carried by the *shared DNA* (A.3/A.4), not by a single color. If any surface breaks the
shared type/grid/component rules, it breaks coherence — that is the review criterion.

---

## A.18 — Concrete visual quality bar for implementation

A surface passes implementation review only if **all** hold:
1. Uses the shared type/grid/spacing/components across both environments (A.3/A.4).
2. Forest used as structural color; gold as accent only.
3. Imagery uses the A.7 treatment — a bad upload still looks acceptable.
4. Signature appears only where content is location/activity/arrival (A.12).
5. Passes the storefront density gate (A.13).
6. Meets AA contrast in both environments; respects reduced-motion.
7. Looks composed after 500 vendors of imperfect content (founder's rule), not just on a hero render.
8. No forbidden aesthetics (A.2.8): no glassmorphism, excessive gradients, floating-card soup, AI-startup
   visuals, decorative 3D.

---

## PART A — DECISION STATUS SUMMARY

| Item | Status |
|---|---|
| Visual personality (5 tensions) | LOCKED (founder) |
| Two environments, one world | LOCKED framing; surface mapping PROVISIONAL |
| Color as ROLES not hex | LOCKED (values → Part B) |
| Typography BEHAVIOR (7 requirements) | LOCKED as requirements; actual font pairing OPEN (System 2 + System 3 recommendation RETIRED) |
| Density Spectrum (Expressive→Editorial→Functional→Operational) | LOCKED framework |
| Grid / spatial composition | PROVISIONAL (concrete scale → Part B) |
| Imagery treatment (ugly-photo system) | PROVISIONAL (tokens → Part B) |
| Storefront / Listing language | PROVISIONAL (composition rules → Part C); campus mark from REAL geography or absent (LOCKED) |
| Component philosophy (cards = tool, not grammar; radius restrained) | LOCKED principle; vocabulary → Part C |
| Motion hierarchy + state/relationship/cause-effect principle | LOCKED |
| Contour/activity signature meaning + rules (incl. Explore edge-placement, real-activity nodes) | LOCKED (Hard Constraint A) |
| Storefront pass/fail gate | LOCKED (Hard Constraint C) |
| Staff environment = Cream-primary (Deep strategic inside) | LOCKED |
| Mobile/desktop expression | LOCKED principle; behavior → Part C |
| Accessibility/performance | LOCKED constraints |
| 3D/WebGL policy (must earn existence) | LOCKED (value-only, not required) |

**Part A is LOCKED (founder-approved).** Its strategy is the foundation for everything below. Part B
(tokens) follows in this same document; Part C (components) and Part D (motion specs) follow on founder
go-ahead. Part A is not rewritten from here.

---

**END OF PART A (Stage 1) — LOCKED.**

---

## A.19 — Landing visual direction (the "rich arrival", Cream-first)

**LOCKED direction (founder-approved 2026-08-19, via the Voeq visual-gap review):**
The Landing is the single brand-arrival moment. It must feel like *arrival*, not a styleguide
demo — but within the locked blueprint's hard rules (A.1, A.2, Part D "3D experimental", the
forbidden list). The decisions below resolve the "Flatness Problem" raised in review.

- **Atmosphere, not flatness.** Cream base (`#f7f4ec`) + two *static* CSS layers: a soft amber radial
  glow upper-left, a soft deep-green radial vignette lower-right, plus a static ≤3% SVG grain
  (multiply). This adds warmth/depth without breaking "minimal, not empty." **No ambient drift loop** —
  a background that animates with no data behind it violates A.1 ("motion encodes state/activity, not
  ambient animation for its own sake") and A.18. The atmosphere is a still image.
- **Sculptural wordmark.** "Voeq" in Fraunces 600, `clamp(5rem, 14vw, 8rem)` (founder ceiling 8rem ≈128px — bold, not cosplay; Expressive tier allows oversized display; restraint elsewhere prevents posturing). Tracking `-0.04em`, line-height
  `0.88`, warm `text-shadow` depth, optional 2%-larger "V". **No 3D / rotateX.**
- **One-shot entrance ("ink settling into paper", A.18).** Staggered character fade-up (V→o→e→q,
  opacity+translateY, locked ease, ~2s total) on *first arrival only*, then still forever. Honors
  `prefers-reduced-motion`. **No rotateX in the entrance.**
- **Contour as hero (asymmetric counterweight).** Expressive tier (full-bleed permission) — contour is
  *strongest on Landing* per B.11 / six "strongest" citations. Desktop: left 55% = wordmark + tagline +
  inline selector + CTA; right 45% = contour field (frosted glass, SVG self-draw when data exists, calm
  heartbeat empty-state). **No CSS-3D perspective tilt** (Part D experimental — CUT).
- **Inline campus selector (skin over the locked searchable selector).** Styled as a sentence
  ("Discover what's open near [NMU ▼]") — preserves `data-testid="campus-selector"` + popover/
  bottom-sheet + chips + fuzzy alias from commit 418981b. No card weight. Examples Nigerian
  (NMU default; UNILAG, UI, OAU, Covenant, FUTO).
- **Trust strip (data-bound, no literals; professional in what we contain).** Live counts from the content boundary —
  `{vendorCount}` vendors · `{campusCount}` campuses · `{studentConnections}` connected. Reflects what the app actually does, not invented or vague figures. **No hardcoded
  numbers** (review's 247/12/4,891 discarded). Competition-status/review-framing counts (e.g. "X verified / Y applied / Z approved") avoided pending founder copy call (Conflict A). The strip carries **open states** (see §C.10.1 / Conflict D): active & mixed status, add/delete-now in progress, and legible "not yet live" states — the strip shows real operational status, not aspirational numbers.
- **Elevated CTA + signature footer.** Warm-shadow accent button with hover lift + arrow micro-
  interaction, wired to the selector ("Explore {campus}"); signature contour-line footer border.
- **Performance target (A.2):** all motion CSS-compositor only; 60fps target on mid-range Android;
  graceful reduced-motion + legacy degradation. Documented as a target, not a guarantee.
- **Mobile = "window"** with required overlay nav. Full-screen atmosphere; centered wordmark/selector/CTA; sticky CTA with
  safe-area padding; **hamburger → full-screen overlay nav is REQUIRED** (responsive necessity — at ~375px, 6 text links + wordmark overflow without it). Overlay built in code phase; docs now mark it required.
- **Badge terminology (Resolution A — VERIFIED → "Student Vouched", founder-approved here):** rename the
  "VERIFIED" badge to "Student Vouched" throughout the product/display language. "Student Vouched" = a
  student-backed trust signal, not a third-party certification claim. Removes the implication of external
  verification and keeps the trust language honest. Apply across Doc 04 PG-PUB-001 required content, the
  campus/listing trust signals, and any "X verified" reference (the trust strip avoids that framing
  entirely; see §C.10.1). **Compliance note:** no "verified" language remains as a claim on the landing.

> These are documented as the Landing's locked *visual direction*. Component-level tokens live in
> Part C (C.6–C.12). Build implements from Part C, not from this prose.

#### Conflict resolution log (founder-approved 2026-08-19, this doc pass)

- **Conflict A — VERIFIED → "Student Vouched":** RESOLVED. Rename approved; no "verified" claim remains on the landing. See C.10.1 reservation.
- **Conflict B — NMU two-campus:** RESOLVED. Single NMU entry + Kurutie/Okerenkoko toggle; not separate catalog rows. Client-design default.
- **Conflict C — Homepage trust strip:** RESOLVED. Data-bound, professional, no lies/vague numbers, reflects what the app contains (C.10).
- **Conflict D — Open states:** RESOLVED. Add/delete-now + active/mixed/not-yet-live states added (C.10.1).
- **Landing call — Wordmark:** `clamp(5rem, 14vw, 8rem)` (8rem founder ceiling).
- **Landing call — Mobile nav:** full-screen overlay nav now **required** (responsive necessity).

---

# PART B — VISUAL TOKENS (Stage 2)

> **Status:** Concrete foundation, translated from the actual approved strategy in Part A. **FOR REVIEW
> — not yet locked** (founder confirms before Part C). Every token below is justified against a Part A
> principle; none is chosen because it "looks premium." No individual pages are designed here; no
> mockups; no component library yet (that is Part C).
> **The goal (founder):** a restrained system capable of producing exceptionally beautiful pages — not
> maximum sophistication.

---

## B.1 — Color: exact palette + semantic roles

Per Part A §A.4: forest + gold + cream are the foundation; exact values are **PROVISIONAL tokens**
(founder review) — to be tested against real compositions before lock, not validated from swatches
alone. Two environments share the *roles*; only surface/ink invert. Gold is an **accent in both** —
never body text (contrast fails AA on cream), never a covering. **Gold = information / emphasis / activity,
not luxury decoration** (§A.4).

### B.1.1 — Warm Cream environment (primary working surface)
| Role | Hex | Justification (Part A) |
|---|---|---|
| `surface` | `#F6F2E9` | warm cream canvas, not white — "cream as principal canvas" (§A.3) |
| `surface-raised` | `#FCFAF4` | cards/panels sit *lighter* than canvas (subtle, non-glassy) |
| `surface-sunken` | `#ECE6D9` | insets, inputs, image mats |
| `ink` | `#16261C` | forest-derived near-black for text — "forest as structural color" even in text |
| `ink-muted` | `#4A574C` | secondary text (AA on cream) |
| `border` | `#DCD4C4` | warm low-contrast hairline — "restrained, no glass" |
| `accent` (gold) | `#B08D57` | muted gold — information / emphasis / activity, NOT luxury (§A.4) |
| `accent-strong` (forest) | `#1F4D2E` | structural green — nav, section frames, selected (§A.3/A.4) |
| `success` | `#2C6B3F` | within green family |
| `warning` | `#B5683A` | muted terracotta, not alarm-red |
| `error` | `#9E3B2E` | restrained, not pure red |
| `info` | `#2F6B5E` | muted teal-green, stays in family (no stray blue) |

### B.1.2 — Deep Forest environment (arrival / brand moments)
| Role | Hex | Justification |
|---|---|---|
| `surface` | `#16261C` | deep forest canvas — "Deep is brand/arrival, not dark mode" (§A.3) |
| `surface-raised` | `#1E3326` | slightly lighter forest for panels |
| `surface-sunken` | `#101C14` | insets |
| `ink` | `#F2EFE6` | cream-derived light text (AA on deep forest ✓) |
| `ink-muted` | `#B7C2B8` | secondary (AA on deep ✓) |
| `border` | `#2C4533` | low-contrast forest-light hairline |
| `accent` (gold) | `#C9A45E` | gold = information/emphasis/activity highlight on dark |
| `accent-strong` (cream) | `#F2EFE6` | cream used structurally on dark |
| `success/warning/error/info` | same hues, lightened ~8% for dark contrast | family consistency |

**Role rule (LOCKED):** a component defined once references *roles*, not hex. Switching environment
flips the role mapping; the component does not change. This is the binding agent of §A.3/B.

---

## B.2 — Typography: candidates + final pairing (behavior-first, §A.5)

Part A locked **7 behavioral requirements** and retired the System 2 hedge. Part B recommends the actual
pairing against those behaviors. **PROPOSED — founder to confirm.**

**Candidates considered (against the 7 behaviors):**
- *Display candidates:* Fraunces (variable, opsz axis — editorial character at hero, settable tight for
  landmarks), Space Grotesk (confident neo-grotesque), Clash/display-only faces (high character, weaker
  utility).
- *Utility/body candidates:* Inter (**rejected per founder**), Hanken Grotesk (humanist, warm, excellent
  small-screen), Public Sans (neutral, gov-grade legibility), Figtree (friendly humanist).
- *Data:* Hanken tabular figures; a mono (IBM Plex Mono / Space Mono) for staff codes/IDs only.

**RECOMMENDED PAIRING (PROVISIONAL CANDIDATE — not locked):**
- **Display:** **Fraunces** (variable, opsz 9–144). Used *only* at display sizes (landmarks, hero,
  section openers, storefront hero). Personality carrier; set with tight tracking + optical sizing at
  large sizes. *Why:* satisfies behavior #1 (distinctive voice) + #3 (strong display/utility contrast) +
  #7 (not-SaaS — a characterful serif display reads editorial, not startup). *Risk managed:* used
  sparingly + asymmetrically (behavior #3, §A.6), never as body — avoids the cream-editorial cliché.
- **Utility/body/UI:** **Hanken Grotesk** (400/500/600/700). Carries 95% of the product. *Why:* behavior
  #2 (extreme readability in dense surfaces), #5 (dense-surface competence), #6 (mobile). Warm humanist
  avoids Inter-corporate feel.
- **Data:** Hanken Grotesk **tabular figures** for prices/counts (behavior #4 — "numbers that look
  excellent"); **IBM Plex Mono** only for staff/technical codes (IDs, audit refs).
- Nigerian-ness is carried by *content/imagery/campus language* (§A.5), **not** by the typeface. No
  "African" face was selected for token-value; if one is later found to be the best tool, it would
  replace on merit, not symbolism.

**Type scale (PROPOSED, modular ~1.2 for density, 1.25 for expressive):**
| Token | Size (desktop) | Use |
|---|---|---|
| `display` | clamp(2.5rem, 6vw, 4.5rem) | hero/landmark (Fraunces) |
| `h1` | 2rem | page/section openers |
| `h2` | 1.5rem | section heads |
| `h3` | 1.25rem | sub-heads |
| `body` | 1rem (16px) | primary reading |
| `small` | 0.875rem | secondary |
| `caption` | 0.75rem | labels/meta |
| `data` | 1rem tabular | prices/counts |

Display uses Fraunces; all others Hanken. **Density trim (§B.12):** Operational tier drops display→h1,
body→0.9375rem.

**Font decision is PROVISIONAL — evaluation required before lock (founder):** Do **not** lock the pairing
from specimen sheets. Before Part C, evaluate **3–5 display/utility candidates** against *real Voeq
surfaces*: Landing hero, Explore, vendor storefront (15 listings), listing detail, messaging, Staff.
Questions per surface: does the display feel *owned* or merely "design-system editorial"? Does the
utility hold up in dense grids and long message threads? Does the pairing survive a bad-photo storefront?
**Typography must not become the identity** — it is one carrier among type + composition + imagery +
interaction + contour (§A.5). If Fraunces reads as generic-premium at scale, replace the display;
candidates to hold in reserve include a confident grotesque display (e.g., Space Grotesk) and a
characterful but disciplined serif. The lock happens only after the surface evaluation, not now.

---

## B.3 — Spacing & grid

**Base:** 8pt grid. Named scale (LOCKED tokens):
`xs=4 · sm=8 · md=16 · lg=24 · xl=40 · 2xl=64 · 3xl=96`.

**Grid (§A.6):** 12-col desktop (gutter = 1.5× column), 4-col mobile. Max content width `1200px`
(Expressive can go wider/full-bleed). One scale serves all four density tiers (§B.12 adjusts *how much*
is used, not the scale itself).

---

## B.4 — Border & radius (restrained, §A.10)

- `--radius: 4px` (default — near-sharp, editorial). `--radius-lg: 8px` (cards/panels, still restrained).
  `--radius-pill: 999px` (pills/avatars only).
- **No excessive rounded corners (LOCKED):** radius is a deliberate, sparing decision. Sharp/near-sharp
  corners are valid and often more editorial. Buttons default to `4px`, not pill (unless a pill is the
  intentional choice).
- **Not every surface gets a container (LOCKED principle, founder):** the storefront (and other surfaces)
  must be free to compose with **typography directly on the canvas, dividers, image compositions,
  editorial rows, compact utility controls, occasional cards, and activity markers** — not "everything is
  a white card with 8px radius." A container is used only when it earns its boundary (see card-boundary
  test, §B.13). This protects the entire Part A philosophy; a card-everything layout would invalidate it.
- Borders are hairline (`1px` `border` token), not shadows, for structure.

---

## B.5 — Shadows & elevation (minimal, non-glassy)

- **Cream env:** `--shadow-1: 0 1px 2px rgba(22,38,28,.06)` (barely-there lift); `--shadow-2: 0 4px 12px
  rgba(22,38,28,.08)` (raised panel). Elevation is mostly conveyed by `surface-raised` + hairline
  border, **not** shadow.
- **Deep env:** elevation via `surface-raised` + `border`; shadows near-zero (`--shadow-1` on dark =
  `0 1px 2px rgba(0,0,0,.3)`).
- **No glassmorphism (LOCKED §A.2.8):** no backdrop-blur panels pretending to be glass. Mats are solid.

---

## B.6 — Image treatment (designed for the ugly photo, §A.7)

**Tokens:**
- `img-ratio-listing: 4:3` · `img-ratio-avatar: 1:1` · `img-ratio-hero: 16:9` · `img-ratio-thumb: 3:2`.
- `img-matte` = environment `surface-sunken` (photo sits in a solid matte frame, not floating).
- `img-overlay:` subtle environment-matched desaturation/contrast unify disparate photos (a bright +
  dark photo cohere). Applied consistently, not per-photo.
- `img-missing:` art-directed empty plate — the **contour monogram** (§B.11) or vendor initial, never a
  gray box.
- Crop is server/client to ratio; **never distort**.
- **The rich-photo rule (LOCKED, founder):** the frame + matte + overlay + consistent ratio are what let
  a bad phone photo of jollof sit beautifully and a good one shine. The grid absorbs unevenness (§A.13
  gate). This is how Voeq "organizes richness instead of hiding it."

---

## B.7 — Iconography

- **Line icons**, `1.5px` stroke, `currentColor` (ink/accent), `24px` grid. Monochrome, not filled
  emoji-style. No multicolor icon sets (stays disciplined, §A.2.8).
- Icons are functional signposts, not decoration. Set defined in Part C.

---

## B.8 — Controls at token level (Part C builds on these)

Defined here as *tokens*, not full components:
- **Button:** `btn-primary` = `accent-strong` (forest) fill + cream text; `btn-ghost` = transparent +
  `border` + `ink`; `btn-text` = `ink` no border. Radius `4px`. Two weights only (§A.10).
- **Input:** `surface-sunken` fill + `border`; focus = `accent-strong` `2px` ring (not glow).
- **Toggle/checkbox/segment:** forest when active; no skeuomorphism.
- **Focus ring (LOCKED a11y):** visible `2px` `accent-strong` outline on all interactive elements
  (keyboard, §A.15).

---

## B.9 — Responsive behavior principles

- Mobile-first; breakpoints: `sm 480 · md 768 · lg 1024 · xl 1200`.
- Mobile = first-class (§A.14): bottom navigation (Doc 04 LOCKED), sheets over modals, single-pane
  messaging, stacked storefront hero→body.
- Desktop: two-pane messaging, multi-col Explore, side panels on Staff, breadcrumbs on sub-views — same
  IA as mobile (Doc 04 §16). **Density per tier (§B.12) drives how much fits, not the rules.**

---

## B.10 — Motion: timing & easing foundations (§A.11)

| Tier | Duration | Easing | Example |
|---|---|---|---|
| Micro | 120–200ms | `cubic-bezier(.2,.8,.2,1)` (standard) | save/follow/tab/send-state |
| Transition | 240–320ms | standard + slight emphasize | nav, filter rearrange, sheet |
| Hero | 600–900ms | `cubic-bezier(.2,0,.0,1)` (emphasized) | Landing arrival only |
| Activity | follows data event | spring-soft | contour node pulse on real event |

**Principle (LOCKED):** motion communicates *state / spatial relationship / cause-effect* (§A.11). No
floating blobs, moving gradients, particles, random card-float, scroll-everything.

**Reduced-motion (LOCKED §A.15):** `@media (prefers-reduced-motion: reduce)` disables transform/opacity
animation except *essential* state changes (which become instant or opacity-only ≤150ms). The contour
activity pulses become static dots. No exceptions for "delight."

---

## B.11 — Contour / activity visual primitives (§A.12)

The signature as **primitives** (not illustrations), gated by content meaning:
- **Contour line:** thin (1px), organic, `accent-strong` at **low opacity (≤12%)**, appears at *edges/
  section boundaries/margins* (Explore rule, §A.12). Never behind text.
- **Activity node:** small dot (`6px`), `accent` (gold) or `accent-strong`, with a soft pulse **only when
  a real event occurs** (trending vendor, new listing, open-now). Absent if no activity.
- **Campus fingerprint mark:** abstract path-derived mark (from **real** campus geometry per §A.8);
  used in storefront hero + as the image-missing monogram. **No real data → no mark (LOCKED).**
- **Density expression:** clustering of nodes = campus vendor density. Used in Landing (strongest) only.
- These primitives are the *vocabulary*; Part C applies them; Part D times the pulses.

---

## B.12 — Density-specific token adjustments (§A.6.1)

Same DNA, different density. Token overrides per tier:
| Tier | Spacing mult. | Type trim | Signature intensity | Surface |
|---|---|---|---|---|
| Expressive (Landing) | ×1.0 (generous) | full display | strongest | Deep |
| Editorial (Explore/Storefront/Listing) | ×0.9 | display→h1 | whisper/structural | Cream |
| Functional (Messaging/Settings/Home) | ×0.85 | body-led | minimal | Cream |
| Operational (Staff) | ×0.75 (tight) | body 0.9375rem | none | Cream (+Deep strategic) |

This is what prevents "beautiful landing → cramped dashboard": the *scale and loudness* shift, the
*language* does not.

---

## B.13 — Two locked implementation principles (founder, carried from review)

1. **Organize richness, don't hide it (LOCKED):** Voeq must feel *rich*, not sparse. A storefront carries
   identity + campus + verification + description + followers/likes + listings + availability + reviews +
   activity + communication + related discovery. The system's job is to *arrange* this richness with
   hierarchy and whitespace — never to strip it for minimalism. (This is the portfolio signal: serious
   product thinking under the aesthetics.)
2. **Card-boundary test (LOCKED):** *If removing the card boundary makes the information clearer, remove
   the card.* Cards are a tool (§A.10), not the grammar. This discipline — editorial rows, asymmetric
   arrangements, typography-led metadata where a box adds nothing — is itself a Voeq visual signature.

---

## B.15 — Composition grammar (the design language, not just tokens)

Tokens (B.3–B.12) are the *material*. The grammar is how they combine. **This is where Voeq becomes a
design language instead of a nice token set (founder).** Rules, not suggestions:

### B.15.1 — Hierarchy (what dominates, what recedes)
- **One dominant visual hierarchy / entry point per viewport (revised per founder):** On an Expressive/
  Editorial landmark the hero/image/contour owns the *entry point*. But a marketplace is not an editorial
  poster — dense screens legitimately hold **multiple task-critical elements prominent** (vendor identity,
  price, availability, message action). The rule: **one clear hierarchy, while task-critical information
  stays visually available.** Comparing 15 listings must NOT make price recede just because a heading is
  dominant. (C.6 codifies this for assembly.)
- **Utility recedes until summoned:** metadata (prices, counts, timestamps, status) uses `caption`/`small` +
  `ink-muted` + tabular figures; it is *present but quiet* until it is the thing the user needs (then it
  escalates to `body`/`data`). Note: "recedes" means *default low-emphasis*, not *hidden* — task-critical
  data (price on a listing grid) stays legible and available even when not the focal point.
- **Above-the-fold budget (editorial/functional tiers):** the surface must answer *who/what/why-now* in
  the first ~600px without scrolling — identity, the primary action, and the first meaningful content
  block. Density (Operational) is exempt (tables scroll by nature).

### B.15.2 — Asymmetry (when the grid breaks, on purpose)
- An image or hero may **break the 12-col grid** (full-bleed or 7/5 split) **only** on Expressive/
  Editorial landmarks (Landing, storefront hero, section openers) — never on Functional/Operational.
- A section may span **7 cols instead of 6** to create intentional tension; the asymmetry must improve
  scan or meaning (§A.6 test), not decorate.
- **Whitespace is composition.** Deliberate empty space (especially on Expressive/Editorial) is a
  structural element, not leftover. The spacing scale (B.3) supplies it; the grammar decides *where* to
  withhold content.

### B.15.3 — Information density (what each tier looks like)
- **Expressive (Landing):** one idea per screen; oversized display; contour strongest; full-bleed
  permission; near-zero utility text.
- **Editorial (Explore/Storefront/Listing):** composed groupings; imagery leads; signature as
  whisper/structural; comfortable density but never cramped.
- **Functional (Messaging/Settings/Home):** calm, list-led, utility-first; signature minimal.
- **Operational (Staff):** maximum information per area; tables, queues, audit; quiet surface, Deep used
  strategically; **no signature** (§A.12). This tier is judged on *legibility under load*, not beauty.

### B.15.4 — Content priority (how the system adapts to reality)
The grammar must absorb real-world variance without redesign:
| Condition | Required behavior |
|---|---|
| Vendor has 3 listings | hero + identity still carries; listings compact, not awkwardly sparse |
| Vendor has 15 listings | grouped by category/availability; scroll is fine; no card-monotony (§B.13) |
| Vendor has 100 listings | pagination/virtualized grid; filters surface; hero stays stable |
| Terrible photos | image treatment (B.6) keeps them acceptable; matte + ratio + overlay |
| No reviews | review block shows empty-state (designed, not missing); trust still via verification/response |
| Many reviews | threaded/compressed; ratings summarized; load-on-scroll |
| Mixed languages (campus slang, English) | type scale + measure handle it; no special casing |

This table is the bridge to Part C: components are specified to satisfy these rows.

---

## B.16 — Storefront stress-test specification (define before Part C, do NOT build)

Per founder: before Part C is approved, the system must be *able* to organize the following elegantly.
This is a **specification of what the design must accommodate**, not a component build.

**Required to coexist on ONE vendor storefront, mobile + desktop:**
- vendor identity (name, avatar/initial, campus fingerprint if real geo exists, verification badge)
- vendor description (short + long)
- likes / followers (counts, not boxes)
- campus identity (zone, not fake map)
- categories / tags
- 15 listings, ≥5 imperfect photos, with prices, availability, response indicator
- reviews / comments (rating summary + entries)
- activity (recent + trending markers, real-data-gated)
- primary action: **message vendor** (native, persistent)
- related / discovery links
- empty/loading/error states for each block

**Pass criteria (gates Part B readiness):**
1. The 15-listing block stays *composed* — mixes editorial rows + image-led grids + compact rows (no
   uniform card wall); survives uneven photos via B.6.
2. Above-the-fold answers *who/what/why-message-now* without scrolling (B.15.1).
3. Trust signals (verification, rating, response, open-now) are primary, not buried.
4. Richness is *organized*, not hidden — all required elements present with hierarchy (§B.13-1).
5. Mobile: hero stacks → identity → message CTA sticky → listings; no horizontal overload.
6. No signature where content doesn't warrant it; contour only at storefront edges/header (§A.12).

**If the proposed system cannot meet these, Part B is NOT ready** regardless of how good the tokens look
in isolation. This gate is exercised in Part C (where the actual storefront composition is built).



| Token group | Status |
|---|---|
| **Composition grammar (B.15)** | 🔒 **LOCKED** (hierarchy / asymmetry / density / content-priority) |
| **Storefront stress-test spec (B.16)** | 🔒 **LOCKED** (gates readiness; not built yet) |
| **Radius 4px** | 🔒 **LOCKED** |
| **"Not every surface gets a container"** | 🔒 **LOCKED** |
| Implementation principles (richness, card-boundary) | 🔒 **LOCKED** (founder) |
| Spacing/grid (8pt, 12-col) | PROPOSED (structure) |
| Shadows (minimal, non-glass) | PROPOSED |
| Image treatment tokens | PROPOSED |
| Iconography (line, mono) | PROPOSED |
| Controls (btn/input/toggle tokens) | PROPOSED (full components → Part C) |
| Responsive principles | PROPOSED |
| Motion timing/easing + reduced-motion | PROPOSED (principle LOCKED in Part A) |
| Contour primitives | PROPOSED (meaning/rules LOCKED in Part A) |
| Density token adjustments | PROPOSED |
| **Typography pairing (Fraunces + Hanken + Plex Mono)** | 🟡 **PROVISIONAL** — evaluated against Part C component situations, not in isolation |
| **Exact palette values** | 🟡 **PROVISIONAL** — test in composition before lock; gold = info/emphasis/activity, not luxury |
| Type scale | depends on font lock |

**Part B status:** *structure locked, aesthetics provisional.* Composition grammar, storefront
stress-test, 4px radius, and the container rule are LOCKED. Font pairing + exact palette remain
PROVISIONAL and are **evaluated against Part C component situations** (no standalone font exercise).
**Proceeding to Part C now** (founder go-ahead). No code, no mockups.

---

**END OF PART B (Stage 2) — STRUCTURE LOCKED, AESTHETICS PROVISIONAL.**

---

# PART C — COMPONENT SYSTEM & PAGE-COMPOSITION GRAMMAR (Stage 3)

> **Status:** Component definitions + the assembly grammar. **FOR REVIEW — not locked.** Structure from
> Part B is LOCKED; aesthetics (font + palette) remain PROVISIONAL and are judged *here*, against real
> component situations, not in isolation. **No code. No mockups. No implementation.** Part C answers two
> questions: (1) what is each component's job, hierarchy, states, responsive + composition behavior? and
> (2) **what is Voeq's visual grammar when these components are assembled?**
> Every component below is evaluated against **B.16 (15-listing storefront stress test)**, mobile/desktop,
> imperfect content, and the four density tiers (B.12). Fonts/palette stay provisional throughout.

---

## C.1 — How components are specified (the rule for this section)

Each component is defined by **six dimensions**, never as a naked UI list:
1. **Job** — what problem it solves for a Voeq user (tied to Doc 03 flow IDs where relevant).
2. **Hierarchy** — dominant / supporting / utility; its place in the B.15.1 order.
3. **States** — empty / loading / error / active / disabled (empty/loading/error are first-class, §A.10).
4. **Responsive** — mobile vs desktop behavior (bottom-nav sheets, two-pane, etc.).
5. **Composition** — how it combines with neighbors; when it gets a boundary, when it sits on canvas
   (container rule, B.4-LOCKED).
6. **Stress** — how it behaves in the B.16 storefront and at 3/15/100 listings, bad photos, no reviews.

Components are **situations**, not a catalog of 47 widgets.

---

## C.2 — Identity & navigation components

### C.2.1 — Top navigation (shopper/vendor app, cream)
- **Job:** orient + move between Explore / Home / Messages / You; surface search + notifications.
- **Hierarchy:** supporting (never competes with page content). Forest `accent-strong` for active route;
  `ink` labels.
- **States:** scrolled (condensed) / top; notification dot (real count only).
- **Responsive:** **mobile = bottom tab bar** (Doc 04 LOCKED); desktop = top bar + persistent side
  affordance. Same routes.
- **Composition:** sits on `surface`, hairline `border` bottom; no shadow. Does NOT get a card.

### C.2.2 — Vendor identity / header block (storefront hero, DEEP hero band)
- **Job:** answer *who is this vendor* + *why message them* in the first 600px (B.15.1).
- **Hierarchy:** **DOMINANT** on storefront. Name in `display` (Fraunces provisional), avatar/initial,
  campus fingerprint (if real geo, B.11), verification badge, rating, response indicator.
- **States:** no-logo → contour monogram (B.6/B.11); unverified → badge absent, not faked.
- **Responsive:** mobile stacks (avatar+name → meta → sticky message CTA); desktop 7/5 split with hero
  imagery/contour.
- **Composition:** Deep forest hero band carrying identity + contour mark; cream body below (the
  intra-page Deep→Cream flip, §A.3). This is the canonical arrival-into-marketplace moment.

---

## C.3 — Commerce components (the marketplace core)

### C.3.1 — Listing presentation (THE identity-defining component)
- **Job:** show one offering — image, title, price, availability, vendor — so a shopper decides to open or
  message.
- **Hierarchy:** imagery-led (B.6 frame), title `h3`/body, price `data` (tabular, always legible even
  when not focal — C.6 rule #1), availability as small status chip. **Price/availability/trust stay
  prominent on comparison screens; they do not recede just because a heading is dominant.**
- **States:** missing image → contour monogram; sold-out → struck/ muted; loading → shimmer in frame.
- **Responsive:** base grid 2-col mobile / 3–4 desktop; arrangement (below) is independent of breakpoint.
- **Composition — FOUR arrangements, selected by content density + user intent (NOT designer preference):**
  | Arrangement | Trigger (density + intent) | Form |
  |---|---|---|
  | **Image-led** | few listings / strong imagery / expressive discovery (Landing, featured) | large frame, minimal meta, imagery carries the row |
  | **Editorial row** | comparison + information density matters (storefront body, category view) | image + generous metadata row; price/availability/trust inline and prominent |
  | **Compact listing** | many results visible / user scanning or searching (Explore grid, search) | small thumb + tight meta; high information per area |
  | **Hybrid** | transition between discovery and comparison (filter results narrowing, scroll from hero into grid) | image-led at top of a section graduating to compact as density increases |
  - **The system chooses**, not the page author. A storefront hero may be image-led, its body editorial
    rows, its "all listings" view compact — driven by how many items and what the shopper is doing.
  - **Container rule (B.4-LOCKED) applies per arrangement:** image-led uses minimal/no boundary; editorial
    row may use a hairline divider, not a full card; compact uses the frame only. No uniform card wall.
- **Stress (B.16):** 15 listings → editorial rows in body + compact in "all" view, grouped by
  category/availability, scroll allowed, zero card-monotony; 100 → compact grid + filters surface, hero
  stable. The arrangement *rules* are what prevent random assembly.

### C.3.2 — Trust / verification signals
- **Job:** let a shopper judge safety/credibility before messaging (Doc 03 trust flows).
- **Hierarchy:** PRIMARY on storefront (B.16-3) — verification badge, rating, response-time, open-now.
  Never buried.
- **States:** unverified (honest absence), pending, verified, flagged.
- **Composition:** as inline marks + a compact "trust row" near identity; gold used as *emphasis* on the
  verified state (information, not luxury).
- **Stress:** survives "no reviews" (trust via verification/response, not stars alone).

### C.3.3 — Price & availability
- **Job:** communicate commercial terms instantly.
- **Hierarchy:** `data` tabular for price; availability as a status chip (`success`/`warning`/`error`
  family, B.1.1).
- **Composition:** price sits in the listing frame's meta strip; availability may use a hairline chip,
  not a filled pill, to stay restrained.

### C.3.4 — Likes / follows
- **Job:** lightweight social proof + save (Doc 03).
- **Hierarchy:** utility — counts, not boxes (B.16). Micro-interaction on tap (B.10).
- **States:** liked/unliked; count updates optimistically.

---

## C.4 — Communication & discovery components

### C.4.1 — Messaging entry / composer
- **Job:** the PRIMARY action on a storefront/listing — native message, never a "WhatsApp" exit (Doc
  01/03 LOCKED).
- **Hierarchy:** persistent, prominent CTA (sticky on mobile storefront, B.16-5).
- **States:** pending→sent→delivered (cause-effect motion, B.10 good-example); offline; blocked.
- **Responsive:** mobile single-pane (list↔thread); desktop two-pane (B.9).
- **Composition:** composer is a `surface-sunken` field + primary button (B.8); no glass.

### C.4.2 — Search / filter
- **Job:** find within campus marketplace (Doc 04 PG-PUB-002/003).
- **Hierarchy:** utility-led; the search field is a prominent but quiet surface.
- **States:** empty query, results, no-results (designed empty state), loading.
- **Composition:** filter as a sheet (mobile) / side panel (desktop); rearranging results uses
  meaningful transition (B.10).
- **Stress (Operational tier):** Staff uses same pattern for moderation queues — scale, not redesign.

### C.4.3 — Reviews / comments
- **Job:** social proof + accountability (Doc 03).
- **Hierarchy:** supporting on storefront; summarized rating at top, entries below (B.16).
- **States:** none (designed empty, not missing), few, many (threaded/compressed, load-on-scroll).
- **Composition:** typographic entries with avatar + rating; no heavy card per comment.

### C.4.4 — Activity / contour elements (signature primitives, B.11)
- **Job:** visualize campus location/activity/density — the one place the signature appears with meaning.
- **Hierarchy:** whisper on Explore (edges only), structural on storefront header, pulses on dashboard,
  absent on Messaging/Staff-unless-warranted (B.12/A.12).
- **States:** node appears ONLY on real event (trending/new/open-now); absent if none.
- **Composition:** contour line ≤12% opacity at edges; nodes are small gold/forest dots. Never behind text.

---

## C.5 — System & operational components

### C.5.1 — Notification surfaces (panel + page, Doc 04 §3)
- **Job:** surface account/campus/marketplace events natively.
- **Hierarchy:** utility; unread as a real count, not a decorative dot.
- **States:** empty (designed), unread/read, grouped by type.
- **Composition:** list-led, on canvas with dividers (container rule) — not a card stack.

### C.5.2 — Forms / inputs / toggles (tokens B.8)
- **Job:** capture signup, listing create/edit (PG-VEND-007), vendor onboarding (5-step, Doc 03).
- **Hierarchy:** utility; focus = `accent-strong` 2px ring (a11y, B.8).
- **States:** default / focus / error / disabled / success.
- **Composition:** fields on `surface-sunken`; labels `caption`; no decorative framing.

### C.5.3 — Staff operational surfaces (Operational tier, B.12/B.15.3)
- **Job:** moderation queues, audit, analytics, config (Doc 04 §3.7). Highest density; judged on
  legibility under load, not beauty.
- **Hierarchy:** maximum information per area; **no signature**; Deep forest used *strategically* for
  high-value states (§A.3).
- **Composition — Moderation workbench model (composition only, not implementation):**
  `Queue → Case → Evidence/Context → Decision → Consequence`. The moderator is **never** staring at a raw
  table of 400 reports. The surface helps answer, at each step:
  - **Queue:** triaged, ranked by severity/policy signal — what should I look at first?
  - **Case:** the selected report/account/listing isolated with its core facts.
  - **Evidence/Context:** related history, reporter credibility, previous actions, campus scope — *what
    happened and why am I seeing this?*
  - **Decision:** the safe actions available (warn / hide / suspend / escalate), each with a clear scope
    and guardrail (super-admin guardrails, Doc 04 §22).
  - **Consequence:** what changed after acting, fed back into the queue (the loop closes).
  This is consistent with the Staff job we already locked (operational control center, not CRUD). Analytics
  and config reuse the same dense-but-legible language; only moderation gets the workbench flow.
- **States:** queue empty/building/over-threshold (alert uses Deep strategically, not red alarm).
- **Stress:** the hardest density case — proves the system scales to "extremely high" without breakage.

### C.5.4 — Loading / empty / error states (first-class, §A.10)
- **Job:** never leave the user in a dead surface.
- **Hierarchy:** utility but designed.
- **States:** skeleton (within frame, B.6), empty (contour monogram / helpful copy), error (actionable,
  not a stack-trace).
- **Composition:** inherit environment; use contour monogram for image empties; no gray boxes.

---

## C.6 — The assembly grammar: what Voeq's visual grammar IS when these compose

This is the question that makes the portfolio piece (founder). The components above, assembled, produce
a consistent *grammar*:

1. **One dominant visual hierarchy per viewport (revised from B.15.1).** A storefront's hero owns the
   *entry point*; a listing's imagery owns its entry point; Landing's contour owns its entry point. But a
   marketplace is not an editorial poster — on a dense screen there can legitimately be **multiple
   task-critical elements held prominent** (vendor identity, price, availability, message action). The
   rule is: **one clear hierarchy / entry point, while task-critical information stays visually
   available.** Comparing 15 listings must NOT make price recede just because the page already has a
   dominant heading. The eye is guided, not fought; and it is never starved of the info the task needs.
2. **Utility recedes until summoned.** Prices, counts, timestamps, status sit quiet (`caption`/`small`,
   `ink-muted`, tabular) and escalate only when they're the answer the user needs.
3. **Containers are earned, not default (B.4-LOCKED).** Type sits on canvas; dividers separate; imagery
   leads; cards appear only where a boundary earns it (card-boundary test). The storefront is a
   *composition*, not a grid of boxes.
4. **The two environments share DNA, differing only in loudness (§A.3/B.12).** Deep arrives, cream works;
   the flip happens once. Same type/grid/components across both.

> ⚠️ **REVERSAL — 2026-08-18 (founder call, confirmed):** The "Deep arrives, cream works; the flip happens
> once" sentence above is **superseded**. Per the Doc 05 A.3 reversal (canonical), **Cream is now the
> default environment across ALL public routes, including Landing** — Landing no longer "arrives in Deep"
> and there is no Landing→Explore environment flip. The two environments still share DNA (same type/grid/
> components); only the *default* changed. See Doc 05 A.3 reversal note + Doc 06 §2 Slice 1 reversal note
> for the authoritative record. Do not re-derive "Deep arrival" from this line.

5. **The signature means something (B.11/A.12).** Contour = real campus activity, at edges, only when
   warranted. Its *restraint* is the statement: Voeq knows when NOT to decorate.
6. **Density is expressed, not hidden (B.15.3/B.13).** Expressive→Operational shift scale + loudness, not
   rules. A storefront with 15 uneven listings stays composed and *rich* — that's the proof.
7. **Motion communicates (B.10).** State, relationship, cause-effect. Reduced-motion is respected, not
   apologized for.
8. **Imperfect content is designed-for (B.6/B.16).** Bad photos, no reviews, 100 listings — the system
   absorbs them with hierarchy, not breakdown.

**The portfolio read:** open voeq.ng → land in Deep forest with a living contour → cross into cream
marketplace → a vendor storefront that is *rich but composed* (identity, trust, 15 listings, message CTA,
all organized, none buried) → message natively → a Staff console that is dense but legible. Same
grammar throughout. *That* is Voeq, not any single button.

> ⚠️ **REVERSAL — 2026-08-18 (founder call, confirmed):** The "open voeq.ng → land in Deep forest …
> cross into cream marketplace" sentence above is **superseded**. Per the Doc 05 A.3 reversal (canonical),
> **Cream is now the default environment across ALL public routes, including Landing** — the arrival is
> Cream, not Deep forest, and there is no Deep→Cream flip on entry. The *portfolio read* still holds as a
> description of the visual grammar (one world, rich-but-composed storefront, dense-but-legible Staff) —
> only the *entry environment* changed. See Doc 05 A.3 reversal note + Doc 06 §2 Slice 1 reversal note for
> the authoritative record.

---

## C.7 — Part C evaluation against the B.16 stress test (gate)

| B.16 criterion | How Part C satisfies it |
|---|---|
| 1. 15 listings composed, no card-monotony | C.3.1 four arrangement rules (image-led/editorial/compact/hybrid) + container rule — system chooses by density+intent |
| 2. Above-the-fold who/what/why-message | C.2.2 dominant hero (one hierarchy, task-critical info stays visible, C.6 #1) + sticky CTA |
| 3. Trust signals primary | C.3.2 explicit PRIMARY hierarchy |
| 4. Richness organized, not hidden | C.6 grammar #6; B.13-1 |
| 5. Mobile hero stack → sticky CTA → listings | C.2.2/C.4.1 responsive |
| 6. Signature only where warranted | C.4.4 + B.12/A.12 |

**If any component above cannot meet its C.7 row, Part C is not ready** — but every component is specified
to satisfy it; the gate is exercised when Part C is later built (no code yet).

---

## C.8 — Part C decision status

| Area | Status |
|---|---|
| Component spec method (6 dimensions) | 🔒 LOCKED method |
| Hierarchy rule (revised: one hierarchy, task-critical stays visible) | 🔒 LOCKED (B.15.1 + C.6 #1) |
| Listing arrangement rules (image-led/editorial/compact/hybrid) | 🔒 LOCKED rules (system-chosen by density+intent) |
| Staff moderation workbench model (Queue→Case→Evidence→Decision→Consequence) | 🔒 LOCKED composition model |
| Identity/nav (C.2) | defined; aesthetics PROVISIONAL |
| Commerce (C.3) | defined; aesthetics PROVISIONAL |
| Communication/discovery (C.4) | defined; aesthetics PROVISIONAL |
| System/operational (C.5) | defined; aesthetics PROVISIONAL |
| Assembly grammar (C.6) | defined — the portfolio differentiator |
| Stress-test mapping (C.7) | satisfied on paper; built later |
| Font + palette | 🟡 PROVISIONAL (judged against these situations, not isolated) |
| Generic component catalogue | 🚫 deliberately NOT added (founder) |

**Part C defines the system; it does not build it.** No code, no mockups. **Part C is ready for final
founder review → LOCK.** Per founder: do **not** start Part D yet. After C locks, Part D (motion
specifications) is next — where the 3D idea must earn its place rather than be forced in.

---

**END OF PART C (Stage 3) — 🔒 LOCKED.**

---

## 🔒 QUALITY-CONTROL PRINCIPLE (carried into all builds — founder)

Implementation convenience **must not override Part C.** When building:
- If a component is easier to implement as a card grid but C says editorial rows are appropriate → **choose
  the editorial composition.**
- If an animation looks impressive but communicates nothing → **cut it.**
- If a beautiful effect makes the storefront harder to scan → **cut it.**
- The composition grammar (C.6), arrangement rules (C.3.1), container rule (B.4), and signature rules
  (A.12/B.11) are the bar. "Faster to build" is never the reason to break them.

---

---

> **Landing component extensions — added 2026-08-19 (founder-approved visual direction, Doc 05 A.19).**
> These extend the locked Part C with the Landing/arrival components and are part of the locked design
> system for build. They are component tokens for an already-approved direction, not a new design stage.

## C.6 — Landing atmosphere (background layer)
- **Job:** give the cream arrival warmth + depth without animation (resolves the "Flatness Problem").
- **Tokens:** base `var(--role-bg)` cream `#f7f4ec`; static amber radial glow upper-left
  (`rgba(184,137,59,0.08)`); static deep-green radial vignette lower-right (`rgba(16,35,26,0.06)`);
  static SVG grain data-URI at ≤3% opacity, `mix-blend-mode: multiply`.
- **Banned:** any loop/keyframe drift on these layers (A.1 "motion encodes state, not ambient"; A.18).
  The atmosphere is a still image.
- **Responsive:** same layers on mobile, where the warm field reads as a "window" into campus.

## C.7 — Landing wordmark (sculptural)
- **Job:** the dominant arrival element — editorial authority, not a polite logo.
- **Tokens:** Fraunces 600; `clamp(5rem, 14vw, 8rem)` (founder ceiling 8rem ≈128px — bold, not cosplay; Expressive tier allows oversized display; restraint elsewhere prevents posturing); tracking `-0.04em`; line-height `0.88`; color `var(--role-text)` + warm `text-shadow`
  (`0 1px 2px rgba(184,137,59,0.08), 0 4px 12px rgba(31,42,34,0.06)`); optional 2%-larger "V".
- **Motion (A.18 "ink settling"):** one-shot on first arrival only — staggered character fade-up
  (V→o→e→q, opacity 0→1 + translateY 24px→0, locked ease, ~2s total), then still forever.
  `prefers-reduced-motion`: instant. **No rotateX / 3D.**

## C.8 — Campus selector (inline "sentence" treatment)
- **Job:** campus context as part of the prose, not a card.
- **Skin over the locked component (commit 418981b):** the searchable popover/bottom-sheet + chips +
  fuzzy alias + dynamic `unverified` persistence is unchanged. Presentation only: rendered as
  "Discover what's open near [NMU ▼]" — underlined word, `Hanken Grotesk 600` `var(--role-accent)`,
  underline → `var(--role-accent)` on hover, custom chevron rotates 180° open. **`data-testid="campus-selector"`
  preserved on the `<select>`.** Examples Nigerian (NMU default; UNILAG, UI, OAU, Covenant, FUTO).
- **No card / border / label** — reduces visual noise per "restraint is the brand" (A.2).
- **NMU two-campus (Conflict B, RESOLVED):** NMU is a **single default entry** with a **two-campus toggle**
  (Kurutie ↔ Okerenkoko), per the client spec design — **not** two separate catalog entries. "Leave the NMU
  — it's there by design of the client" (founder). The selector lists NMU once; the toggle switches physical
  campus context without a second catalog row.

## C.9 — Contour field (asymmetric hero)
- **Job:** the signature at its *strongest* (B.11, six "strongest" citations) — Landing's visual
  counterweight to the wordmark.
- **Layout:** desktop 55/45 split (text left, contour right, full hero height); mobile full-width
  300px. Expressive tier (full-bleed permission).
- **Tokens:** `var(--role-surface)` @40% + `backdrop-filter: blur(12px)`; 1px `var(--role-border)` @50%;
  `border-radius: 12px`; 380×420px desktop.
- **States:** populated → SVG self-draw (stroke-dashoffset), soft-glow nodes (radial, not circles),
  connecting lines `var(--role-accent)` @12%, slow 20s figure-8 node drift; empty → single calm
  heartbeat pulse + "The marketplace is quiet right now" (italic, `var(--role-text-muted)`). Abstract
  Nigerian topography (Niger delta curves, Jos plateau ridges) — art, not a map.
- **Banned:** CSS `perspective`/`rotateY` hover tilt (Part D "3D experimental" — CUT).

## C.10 — Trust strip (data-bound; professional in what we contain)

- **Job:** credibility via real counts — "other students are already here."
- **Tokens:** centered full-width band, `var(--space-6)` padding; `Hanken Grotesk 14px` uppercase
  `letter-spacing 0.08em` `var(--role-text-muted)`; numbers `Fraunces 2rem` 600 `var(--role-text)`;
  middot separators. **Trust strip is professional and truthful** — it reflects what the app contains/provides and real operational status, not aspirational or invented figures.
- **Content (DATA-BOUND, never literal):** `{vendorCount}` vendors · `{campusCount}` campuses ·
  `{studentConnections}` connected — sourced from the content boundary (seeded + live). Under the 250+
  Nigerian universities scope, `campusCount` is derived, not a fixed stat. **No hardcoded figures**
  (review's 247/12/4,891 are illustrative only — discarded). One-shot viewport-enter reveal (not a loop).
- **Open states (§C.10.1):** the strip must remain legible and honest when data is incomplete — active /
  mixed / in-progress statuses show real state, not "0" substitutes; where a count isn't live yet, show a
  clear "not yet available" framing rather than a guessed number. **Add/delete-now** is in scope: the strip
  reflects additions and deletions as they happen (e.g. campus/vendor changes), so it stays current.

### C.10.1 — Open states for the trust strip (Conflict D)

- **Active / mixed status:** when live data is partial, the strip shows what's real (partial counts, live
  status notes) rather than hiding incompleteness. Honest partial ≠ vague.
- **Add/delete-now:** additions (new campus, new vendor, new connection) and deletions (campus removed,
  vendor removed, connection lost) are reflected in the strip in real time — it tracks what we actually
  contain. Pending/soft-delete states show a clear "still under review / not yet live" state, not a stale
  number.
- **Reservation:** counts are *descriptive* of what's in the system; they are not competition framing (no
  "verified / applied / approved" ladders pending the VERIFIED→Student Vouched rename, Conflict A).

## C.11 — Landing CTA (elevated)
- **Tokens:** `inline-flex`, `padding 24px 48px`, `background var(--role-accent)`,
  `color var(--role-on-accent)`, `Hanken Grotesk 600 18px`, `border-radius 4px` (locked),
  `box-shadow 0 2px 8px rgba(47,107,63,0.15)` → hover `0 8px 24px` + `translateY(-3px)`;
  arrow `→` slides `translateX(6px)` on hover (aria-hidden). Text "Explore {campus}" wired to selector.
- **Motion:** hover lift (relationship/state, A.18) — not ambient. `prefers-reduced-motion`: no lift.

## C.12 — Signature footer
- **Job:** visual closing statement, not a link list.
- **Tokens:** top border = single contour-line SVG path, 1px `var(--role-text)` @4%; centered links
  `13px` `var(--role-text-muted)` (hover `var(--role-text)`); copyright `12px` @60%;
  `padding var(--space-8) top / var(--space-6) bottom`.

---

# PART D — MOTION LANGUAGE (Stage 4)

> **Status:** Motion *language*, not an animation catalogue (founder). **FOR REVIEW — not locked.** Built
> on Part A §A.11 (motion communicates state / relationship / cause-effect) + Part B §B.10 (timing/easing)
> + the LOCKED Part C. **No code. No mockups.** The shape is **cause → response → relationship →
> transition → rest**: every motion begins with a *cause* (user action or data event), produces a
> *response*, expresses a *relationship* between things, is a *transition* when moving, then comes to
> *rest*. Nothing animates without a cause. Font + palette remain PROVISIONAL; motion language is
> independent of exact aesthetics.

---

## D.1 — The motion language: cause → response → relationship → transition → rest

This is the grammar, analogous to C.6 for composition. Every animation in Voeq is legible as one of
these, in order:

1. **Cause** — a user action (tap, hover, filter) or a data event (new listing, message sent, vendor
   trending). No cause → no motion.
2. **Response** — the system acknowledges immediately (≤120ms perceived latency): a control depresses, a
   state flips, a node appears.
3. **Relationship** — the motion shows *how things relate*: a listing opening flows its image into the
   detail; a filter rearranges results around the new query; navigation moves spatially (not a crossfade
   that hides where you went).
4. **Transition** — movement between states/surfaces; directional, brief, reversible-feeling.
5. **Rest** — the motion settles cleanly into the final state with no lingering idle animation. A surface
   at rest is *still* (no perpetual motion, no "alive" loops).

**Bad motion (explicitly forbidden, §A.11):** floating blobs, endless gradients, decorative particles,
random card-float, scroll-everything. These have no cause → they are excluded by rule 1.

---

## D.2 — Interaction motion (hover / focus / listing / saves)

- **Hover/focus (cause: pointer/keyboard):** a 120–160ms response — control lifts subtly (surface-raised
  or border emphasis, NOT scale-bounce), focus shows the 2px `accent-strong` ring (B.8 a11y). *Relationship:* the emphasis tells you what you're about to act on. *Rest:* returns to baseline on leave.
- **Listing interaction (cause: hover/open):** hover = image frame brightens slightly (matte lightens);
  **open = the listing's image transitions into the detail view** (shared-element, relationship rule #3) —
  not a modal pop. *Rest:* detail view stable, no idle motion.
- **Saves / follows (cause: tap):** a 160–200ms response — the icon fills (gold, =emphasis not luxury),
  count updates; a single soft pulse *only* as acknowledgement. *Rest:* static. No loop.

---

## D.3 — Messaging & notification motion (state + cause-effect)

- **Message send (cause: send tap):** pending → sent → delivered, each a *state* change with a 120–200ms
  response; the bubble may nudge once on send (cause-effect). This is the §A.11 good-example made
  concrete. *Rest:* delivered state, still.
- **Notifications (cause: event):** a real notification enters with a brief slide-in (240–320ms,
  transition) + a single subtle accent dot; **no badge bounce loop**. *Rest:* sits until read.

---

## D.4 — Page & navigation transitions (the signature: Landing → Explore)

- **Navigation (cause: route change):** directional transition (240–320ms, standard easing). The rule from
  C: **Deep and Cream are two rooms of one building.** The Landing→Explore flip must *show* that.

### D.4.1 — THE signature transition: Landing (Cream-first arrival) → Explore (Cream)
- **Cause:** user taps "Explore" / scrolls past the arrival moment.
- **LOCKED REQUIREMENT — continuity:** the transition **must preserve spatial and visual continuity**
  between Deep and Cream, so the two read as *one world* (two rooms of one building), never as "dark page
  → different light website." This requirement is 🔒 LOCKED.
- **PROPOSED MOTION (not obligated):** the *preferred expression* is the contour-carrying animation — the
  Deep surface recedes while Cream arrives from the same spatial origin, with the contour line carrying
  across the boundary (a Landing node becomes an Explore edge). **This specific choreography is PROPOSED,
  not mandatory.** If testing shows a *simpler* transition communicates the relationship better, we use
  the simpler one — we defend the *experience* (continuity), not the animation. Contour-carry = PROPOSED
  MOTION.
- **Transition:** a single directional move; 600–900ms on first arrival, 320ms on subsequent. **Not** a
  hard cut, **not** a generic fade-to-white. (Exact choreography flexible within the LOCKED continuity
  requirement.)
- **Rest:** Cream Explore at rest, contour as edge-whisper (B.12). The shared contour vocabulary is what
  makes "same building" felt.
- **Why this is the test:** if the transition reads as "dark page → different light website," it failed
  the LOCKED continuity requirement — regardless of how fancy the animation was.

> ⚠️ **REPLACEMENT MECHANISM — 2026-08-18 (founder call).** The Cream-first reversal (see A.3 reversal
> note, line ~143) collapsed the Deep→Cream *color* flip that D.4.1 originally leaned on. The LOCKED
> continuity requirement ("one world, never dark→different-light-website") **still stands** — only the
> vehicle changed. The replacement is a combined, **PROPOSED (not yet built/tested)** three-part mechanism,
> to be validated during the actual Slice 2 (Explore) build with its own continuity verification gate:
> 1. **Contour-carry (PROPOSED / PRIMARY):** a Landing activity node visually morphs into an Explore edge —
>    the *same element* persists across the boundary, carrying the eye. (This was Doc 05's preferred
>    mechanism pre-reversal; it now does the primary continuity work alone, not alongside a color flip.)
> 2. **Shared spatial anchor (PROPOSED / PRIMARY):** 1–2 elements stay visually fixed in position across
>    Landing→Explore (to be identified in Slice 2 — likely the logo position and/or the contour line), so
>    the eye has a stable reference even as surrounding content changes.
> 3. **Deep as strategic transitional accent (PROPOSED / UNPROVEN):** during the transition motion itself,
>    a *brief* Deep-tinted moment may appear (e.g. the contour line flashes deep-green mid-motion). Deep
>    **never** becomes a page background or resting state again — it exists only as a transient in-motion
>    event, if at all. ⚠️ **UNPROVEN** — requires a motion prototype to confirm it reads as continuity
>    rather than a glitch. Do **not** treat this component as LOCKED like (1) and (2); validate before
>    Slice 2 sign-off.
> **Planning artifact only — Slice 2 is not started.** Components (1)+(2) are the proposed PRIMARY
> mechanism; (3) is UNPROVEN pending prototype. Slice 2 build must verify these actually deliver the
> "one world" requirement, same as any other slice gate.

---

## D.5 — Contour / activity motion (signature behavior)

- **Cause:** a *real* campus event (trending vendor, new listing, open-now). **No event → no node, no
  motion** (A.12/B.11).
- **Response:** node appears with a soft 1-pulse (spring-soft, ≤400ms), then *rests* as a static dot.
- **Relationship:** a cluster of nodes = campus density; the pulse says "something happened here," not
  "look at me decoratively."
- **Rest:** static. The pulse does NOT repeat. Reduced-motion: node appears as static dot, no pulse (D.8).

---

## D.6 — Loading / recovery motion

- **Loading (cause: fetch):** skeleton shimmer *within the image frame* (B.6), 1200ms loop max then
  honest empty/error. Not a full-screen spinner that hides the layout.
- **Recovery (cause: error → retry success):** the error state resolves to content with a 240ms
  transition; no celebratory animation.
- **Empty state:** appears without motion (or a single 200ms settle). The contour monogram (B.11) holds
  the space; no spinning nothing.

---

## D.7 — Mobile motion & performance budget

- **Mobile:** same language, shorter durations (micro 100–160ms, transition 200–280ms). Bottom-nav
  transitions are directional (tab content slides, not crossfades). Haptic-adjacent clarity without
  haptics.
- **Performance budget (LOCKED constraint):** motion must hold **60fps on mid-range Android** (the pilot
  NMU audience). Rules: animate `transform`/`opacity` only (compositor-friendly); avoid layout/paint-
  inducing properties; cap simultaneous animated elements (the contour pulse is 1-at-a-time, not a
  swarm); respect `prefers-reduced-motion` (D.8). If a motion risks jank on target devices, **cut it
  before shipping** — performance is a design constraint, not an afterthought (§A.15).

---

## D.8 — Reduced motion (LOCKED)

`@media (prefers-reduced-motion: reduce)`:
- All transform/opacity animation disabled except *essential* state changes, which become instant or
  opacity-only ≤150ms.
- The contour pulse becomes a static dot. The Landing→Explore transition becomes an instant environment
  swap (no 600–900ms choreography) — continuity preserved via the shared contour *at rest*, not motion.
- No exceptions for "delight." Reduced-motion users get the same information, faster.

---

## D.9 — The 3D experiment: prove it earns existence, or remove it

Per founder: 3D must justify itself, not be forced in for the portfolio.

- **Candidate:** an interactive **Landing contour moment** — the campus contour rendered in 3D/WebGL,
  where the user can subtly orbit/parallax the terrain and see vendor-activity nodes as living points.
- **The test (cause → value):** does the 3D make the *arrival* clearer or more meaningful than the 2D
  contour (D.4.1 / B.11)? Specifically:
  - Does it communicate **location/activity/density** better than the 2D edge-contour? (If no → cut.)
  - Does it hold **60fps on mid-range Android** (D.7)? (If no → cut or degrade to 2D.)
  - Does it respect **reduced-motion** (D.8)? (If it can't → cut.)
  - Does removing it make the interaction *clearer*? (If yes → it was decoration → cut, per §A.11/§A.13.)
- **Provisional verdict:** 3D is **OPTIONAL and unproven**. It is permitted *only* on the Landing arrival
  moment, *only* if it passes all four tests above. Recommendation bias: **start 2D**; add 3D only if a
  prototype demonstrably improves the arrival. Do not ship 3D "because we can." If the 2D contour already
  satisfies the signature (B.11), 3D is not needed.
- **This is the discipline:** the 3D experiment is the clearest test of the whole motion language — every
  other motion here has a *cause*; 3D must show its cause is worth the cost.

---

## D.10 — Part D decision status

| Motion area | Status |
|---|---|
| Language (cause→response→relationship→transition→rest) | 🔒 LOCKED principle |
| Hover/focus/listing/saves | defined; aesthetics PROVISIONAL |
| Messaging/notification | defined |
| Page/nav transitions | defined; **continuity REQUIREMENT 🔒 LOCKED**; contour-carry = PROPOSED MOTION |
| Contour/activity motion | defined (real-event-gated) |
| Loading/recovery | defined |
| Mobile + performance budget | 🔒 LOCKED constraints |
| Reduced motion | 🔒 LOCKED |
| 3D experiment | 🟡 EXPERIMENTAL — must pass D.9 tests or be killed |
| Font + palette | 🟡 PROVISIONAL (unchanged from B/C) |

**Part D is a motion language, not an animation catalogue.** Motion language 🔒 LOCKED; the specific 3D
implementation remains an experiment; contour-carry is the proposed (not mandatory) expression of the
LOCKED continuity requirement. No code, no mockups. **After D locks, Voeq's visual system (A–D) is fully
specified** and we move to the build execution plan — carrying the quality-control principle (implementation
convenience never overrides C; cut motion that communicates nothing).

---

**END OF PART D (Stage 4) — 🔒 MOTION LANGUAGE LOCKED (3D EXPERIMENTAL).**
