# 01-CREATIVE_DIRECTION_EXPLORATION.md — Voeq

> **Status:** CREATIVE EXPLORATION ONLY. Not approved. No final design system. No production code.
> **Author:** Hermes (Creative Director / Product / UX / Visual / Design-Systems)
> **Basis:** Founder brief dated this session + `00-HERMES_PROPOSAL.md` (under review) +
> recovered product (`docs/product-recovery/`).
> **Supersedes:** Any conflicting legacy assumptions. **WhatsApp is REMOVED** — native messaging
> is now a core capability.

---

## 0. HOW THIS EXPLORATION WAS PRODUCED (read this first)

The brief asked me to **use Figma**. I must be straight with you: **the Figma MCP is enabled in your
Hermes config, but its functions are NOT exposed as callable tools in this session.** I verified this
(`hermes mcp test figma` only prints a tool *name* list; none of those functions appear in my actual
toolset). I therefore **could not push frames into your Figma file from here.**

I did **not** fake a Figma exploration. Instead I produced **real, rendered HTML/CSS prototypes**,
screenshotted them, and verified them with vision — genuine visual exploration, more honest than a
theoretical description. All six prototype files live at:
`docs/project-blueprint/explorations/` (`A-home`, `A-vendor`, `B-home`, `B-messages`, `C-home`,
`C-discovery`).

**To get these into Figma:** open the `.html` files in a browser, or — better — once Figma MCP tools
are wired into my session (re-run the OAuth/login in an interactive shell and confirm the tools surface
in my function list), I can drive `use_figma` / `get_design_context` directly. That's a setup step,
not a design limitation.

---

## 1. MY PROFESSIONAL PUSHBACK ON THE BRIEF (stated before the directions)

You asked for disagreement where warranted. Here it is.

### 1.1 "ALIVE" is the dangerous word
The brief rejects decorative animated backgrounds (organic green lines, grain, gold glow,
cursor-reactive bg) — correctly — **yet still asks for "alive" and lists "subtle environmental
motion" as a candidate.** My opinion: for a *trust-product marketplace*, "alive" must come from **real
data moving** (live trending, message presence, campus activity), not a decorative layer. A decorative
ambient background is exactly the thing you just said you don't like, dressed differently. **I reject a
decorative ambient background entirely.** Direction C ("The Living Index") is my answer to "alive"
*without* decoration: motion is earned by real product data. Directions A and B keep motion
editorial/spatial.

### 1.2 Cream + green + gold is adjacent to the #1 AI cliché
My `frontend-design` skill explicitly warns that the most common AI-generated look is *"warm cream
background (~#F4F1EA) with a high-contrast serif display and a terracotta accent."* Your locked palette
(forest green / muted gold / cream) is **one hue-swap away from that cliché.** My push: **cream must be
paper/texture used deliberately, NOT a full-bleed wallpaper on every screen.** Forest green earns its
moments (ink, deep field sections). Gold stays *sparse* — a hairline, an active dot, a folio rule. If
all three are applied at full strength everywhere, it becomes the template you're trying to avoid. Each
direction below proposes a *different balance* of the same three colors precisely to avoid that trap.

### 1.3 Editorial can be over-pushed for a product UI
Magazine hierarchy belongs on the **public/marketing + vendor-profile** surfaces. The **browse grid,
native chat, and vendor dashboard** need product clarity — don't make a shopper hunt for the search bar
because it's set in 72pt italic. My push: editorial is the *voice* of discovery/marketing/profile; the
transactional surfaces stay calm, conventional, fast. I've scoped each direction's editorial intensity
accordingly.

### 1.4 "Smooth animation remains important" — yes, but disciplined
Animation is a finishing layer, not a foundation. Every direction specifies **what should NOT move**
(explicitly). Extra motion reads as "AI-generated"; restraint reads as "designed."

---

## 2. FOUR DISTINCT CREATIVE DIRECTIONS

Same locked palette. Four different personalities. Each is specified across the 11 required lenses,
plus a verified screenshot reference. (Direction D was added after the founder asked for one more
direction built with the aesthetics/animation/background craft skills.)

---

# DIRECTION A — "THE CAMPUS BROADSHEET"

### A.1 Name
**The Campus Broadsheet.** Voeq as a *printed campus publication* — a student-union magazine / a
well-set noticeboard, set in type.

### A.2 Design philosophy
Voeq is not a shop; it's a *noticeboard that learned to typeset itself.* The metaphor is editorial print:
forest green is **ink**, cream is the **paper stock**, gold is a **foil spine / folio rule**. Typography
carries the personality — large high-contrast serif headlines, monospaced folios and section numbers,
asymmetric magazine grids. Vendor photography is treated like magazine spreads, not thumbnails. The
product *reads* like an issue: a masthead, a cover vendor, an indexed directory, trending "articles,"
a manifesto. This is the most **premium + editorial** of the three, and the strongest fit for the
*founder's "editorial + premium" words.* Its discipline: it stays digital and fast (SSR, no print
gimmicks) so it never tips into "old magazine website."

### A.3 Emotional feeling
*Credible. Considered. Local. A little proud.* Like picking up a well-made campus magazine — you trust
what's inside because it's been *set with care.* Discovery feels like browsing a curated index, not
scrolling a feed.

### A.4 Typography
- **Display:** **Fraunces** (a characterful "old-style" optical serif with personality — *not* the
  cliché Playfair). Used for headlines, vendor names, pull-quotes. High contrast, optical sizing.
- **UI/Body:** **Inter** — neutral, screen-legible workhorse for everything functional.
- **Accent:** **IBM Plex Mono** — folios, section numbers (01–09), vendor meta, "VERIFIED" tags.
  Encodes the "printed index" idea (numbered sections are *true* here — the directory genuinely is a
  list).
- *Why:* serif display + mono folios is the editorial signature; Inter keeps the product usable.

### A.5 Color (roles, not arbitrary hex)
- **Cream = paper** (`#F4EFE2`): the dominant surface, used like a printed page — but sections still get
  rules/bands so it never feels like one flat wash.
- **Forest green = ink** (`#1E3A29`): all type, rules, borders, buttons. High contrast on cream.
- **Muted gold = foil** (`#9C7A2E`): folio rules, section numbers, "VERIFIED"/"LIVE" tags, the manifesto
  accent. **Sparse** — never a fill.
- Verified contrast: ink-on-paper meets AA comfortably; gold is decorative-only (never text you must
  read).

### A.6 Layout language
- **Whitespace:** generous column margins; content sits in a measured measure (34–40ch for lede).
- **Grid:** 12-col editorial grid; deliberate **asymmetry** (hero 7/5 split; index in 3 columns).
- **Full-bleed imagery:** vendor "cover" photos treated as magazine spreads (aspect 4/5, hard edge).
- **Typography as interface:** section headers are set in Fraunces with a mono kicker above.
- **Cards:** listings as a 2-col "spread" with a 2px top rule — not floating rounded cards.
- **Lists:** the category directory is a **numbered folio list** (01 Food · 142) — the signature.
- **Sections:** divided by hairline rules and one dark "manifesto" band (green ink inverted).

### A.7 Component language
- **Buttons:** square (radius 0), ink-solid or ink-outline. No pill, no shadow.
- **Inputs:** bottom-bordered or fully boxed in ink; mono placeholder.
- **Vendor card:** photo + Fraunces name + mono meta + italic pull-quote. Top rule.
- **Listing card:** 2-col spread, top rule, price in mono gold.
- **Badges:** gold foil tag, mono, uppercase (VERIFIED / LIVE / COVER).
- **Navigation:** top masthead with a 2px ink rule under it; wordmark in Fraunces.
- **Tabs / Modals / Dropdowns:** inherit the square, ruled, print language.
- **Notifications:** mono folio-style toasts ("✓ Saved to your index").
- **Chat UI:** (see Direction A chat in §5) — square bubbles, ink/gold rules.
- **Profile:** editorial masthead (vendor name in Fraunces, trust stats as a ruled row).

### A.8 Imagery
Real campus/vendor photography, **treated like editorial spreads** — warm, human, unretouched-feeling.
Food, hands at work, a hostel corner. Not stocky gradients. Vendor cover photo is the hero; listings
are smaller spreads. Grain is *occasionally* acceptable as a print texture on the manifesto band only
— not site-wide.

### A.9 Animation language
- **Page transitions:** a quick "section rule draws in" (a 1px line wipes left→right) on route change —
  like a newspaper rule being set.
- **Hover:** links shift to gold; cards lift 1px with a hardening of the top rule (no scale bounce).
- **Scroll:** headlines **set themselves** — words fade/rise in on enter (editorial reveal), staggered.
- **Component motion:** a folio number can tick; the manifesto line can fade up.
- **Image motion:** subtle scale (1.0→1.03) on hover only.
- **Navigation:** active section gets a gold folio underline.
- **Micro-interactions:** save/follow = a small ink checkmark draw.
- **Ambient motion:** **none.** (Per §1.1.)
- **What should NOT move:** background, nav bar, footer, trust stats, body text. No parallax, no float.

### A.10 Mobile experience
The broadsheet *condenses into a single-column issue*: masthead collapses to wordmark + menu; hero
becomes one column (headline → search → cover photo); the folio index becomes a clean stacked list;
trending cards stack. Type scales down but **keeps the Fraunces display** for vendor names (identity
must survive mobile). Bottom-tab nav (unified across roles — fixes the legacy inconsistency).

### A.11 Accessibility
- Cream/ink contrast ~12:1 (AAA for text). Gold used only for non-essential tags.
- Visible keyboard focus = a 2px gold outline (distinct from the ink rules).
- `prefers-reduced-motion`: all scroll/type reveals become instant; rules just appear.
- Touch targets ≥ 44px (buttons, folio rows).
- Readability: Inter body at 16px min; Fraunces reserved for display (never body text).

**Verified prototype:** homepage + vendor profile —
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_a06095d8a8884014998bddddb1f0a599.png
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_52d342ed17684988abd2ee4ac69f9c98.png

---

# DIRECTION B — "THE GREEN ROOM"

### B.1 Name
**The Green Room.** Voeq as a *quiet, confident, premium digital product* — a beautifully-set library /
a high-end campus commons. Calm is the luxury.

### B.2 Design philosophy
Less magazine, more *product*. Forest green becomes a **deep atmospheric field** used in moments (not
just ink); cream is the **calm UI canvas**; gold is a **precise interaction accent** (active state,
focus, unread dot). The personality is *still, grown-up, trustworthy.* Negative space does the work;
type is confident but quiet; components are hairline-bordered with small radii (explicitly NOT excessive
rounded cards). This is the most **"modern product"** of the three and the safest for usability — it
reads as a serious tool, not a poster. Its risk (and discipline): resist making it bland; the deep
green field + one expressive moment carries the brand.

### B.3 Emotional feeling
*Calm. Safe. Premium. Unhurried.* Like a well-designed members' library — you can think here. Trust is
signalled by restraint, not loud badges.

### B.4 Typography
- **Display:** **Manrope** (geometric-humanist, confident, slightly architectural) at 700, used with
  restraint for hero + section heads.
- **UI/Body:** **Inter** — the workhorse.
- **Accent:** **JetBrains Mono** — data (ratings, view counts, "OPEN NOW"), labels.
- *Why:* an all-sans, calm system; Manrope gives personality without serif preciousness; mono keeps the
  "product" feel for numbers.

### B.5 Color
- **Cream = canvas** (`#F6F3EC`): the calm UI surface for lists, cards, nav.
- **Forest green = field** (`#163025`): used as a *deep panel* (featured vendor, section blocks, Send
  button, active states) — green earns its moments, doesn't flood.
- **Muted gold = interaction** (`#C2A14E`): **only** on focus rings, active dots, unread indicators,
  hover borders. Sparse by rule.
- Discipline: most of the app is cream + ink text; green appears as deliberate "rooms"; gold only on
  interaction.

### B.6 Layout language
- **Whitespace:** the dominant tool — large vertical rhythm, centered or left hero with room to breathe.
- **Grid:** confident asymmetry; a signature **deep-green rounded panel** (radius ~22px) anchors the
  featured vendor like a "room" you step into.
- **Full-bleed imagery:** contained within the green panel / cards (never edge-to-edge noise).
- **Typography:** quiet, large-but-not-shouting; one expressive hero line.
- **Cards:** *quiet* — hairline border, small radius (14px), no shadow. (Directly answers "no excessive
  rounded cards": radius is restrained, border is the structure.)
- **Lists:** calm rows with hairline dividers.
- **Sections:** separated by space + the occasional green panel, not rules everywhere.

### B.7 Component language
- **Buttons:** pill (radius 999) for the calm feel, OR square — I recommend **pill for primary
  actions** (Search, Send, Become a vendor) to read "soft/approachable," with the dark-green fill as the
  one moment of weight. Ghost = hairline pill.
- **Inputs:** pill, cream fill, hairline border; focus → gold border.
- **Vendor card:** quiet card, hairline border, small radius; photo top; name + mono meta.
- **Listing card:** same family.
- **Badges:** small gold dot + mono label for "OPEN NOW" / verified.
- **Navigation:** minimal top bar, wordmark in Manrope 700; ghost + dark pill CTAs.
- **Tabs/Modals/Dropdowns:** rounded, hairline, calm.
- **Notifications:** soft pill toast, gold dot.
- **Chat UI:** (see §5) — cream thread, light bubbles for them, deep-green bubbles for me, rounded
  composer.
- **Profile:** green-panel hero with vendor portrait; trust stats as a clean row.

### B.8 Imagery
Warm, lifestyle, *human* photography — but framed calmly (contained in panels/cards, lots of surrounding
space). Food, a person at work, a quiet campus corner. No busy collages.

### B.9 Animation language
- **Page transitions:** soft spatial slide/fade between routes (like moving between rooms).
- **Hover:** cards lift 2px + border → gold; buttons darken slightly.
- **Scroll:** gentle fade-up on sections (subtle, not staggered type-setting).
- **Component motion:** the green panel can scale-in on load; unread dot has a soft pulse.
- **Image motion:** hover zoom (1.0→1.04) within the frame.
- **Navigation:** active item gets a gold underline; panels slide.
- **Micro-interactions:** save = heart soft-fill; send = bubble appears with a tiny scale.
- **Ambient motion:** **none** (per §1.1). The "alive" feeling comes from *presence* (typing indicators,
  unread pulses) — which is real data, not decoration.
- **What should NOT move:** background, nav, footer, body text, trust stats.

### B.10 Mobile experience
Collapses to a single calm column; the green featured panel becomes full-width; bottom-tab nav
(unified). Touch targets generous. The calm survives mobile because it's space-driven, not decoration-
driven.

### B.11 Accessibility
- Cream/ink text ~10:1; green panel text is cream-on-deep-green (~9:1, AA).
- Focus = gold ring (visible on cream and on green).
- Reduced-motion: transitions become instant; pulses stop.
- Touch targets ≥ 44px (pills are inherently large).
- Readability: Inter 16px min; no tiny mono for essential text.

**Verified prototypes:** homepage + native messaging —
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_7da7f26768ef433ab93447baac92c6ad.png
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_e1ab1ce01d9b4ea3abf2b03bb2ad46b2.png
*(Prototype note: the B messaging prototype's "Sign in" ghost-border is too subtle — cream-on-cream;
raise border contrast in the real system. Timestamps are placeholders.)*

---

# DIRECTION C — "THE LIVING INDEX"

### C.1 Name
**The Living Index.** Voeq as a **living index of campus activity** — the one direction that answers
"alive" *without* a decorative background.

### C.2 Design philosophy
The visual phenomenon unique to Voeq is **real campus commerce happening right now**: listings posted,
messages started, tastes shifting. So the interface *is* a live index. Forest green = **structure** (grid
rules, headers, the data panels); cream = **the page**; gold = the **live signal** (a gold pulse marks
what is *new / active / hot*). Typography is technical-but-warm: a condensed grotesk for display, mono
for all the live data (counts, times, deltas). Motion is **data becoming visual** — items rise as they're
created, a gold dot marks freshness, the grid subtly reorders by activity. This is the most *distinctive*
and the most *on-brief for "alive"* — and it earns every bit of motion from real product data. Its risk
(built-in discipline): strict rules on *what* animates, so it never becomes busy.

### C.3 Emotional feeling
*Alive. Current. A little addictive — in a good way.* Like watching the campus breathe. Discovery feels
like being *there* as it happens.

### C.4 Typography
- **Display:** **Archivo** (a grotesk with expanded/condensed range — data-forward, confident,
  architectural) at 700–800, tight tracking. Used for hero + vendor names + headers.
- **UI/Body:** **Inter.**
- **Accent:** **JetBrains Mono** — *everywhere data lives*: live counts, times, percentage deltas
  (▲40%), "NEW/HOT" badges, the activity rail. Mono is the "machine" voice of the living index.
- *Why:* Archivo + mono reads as "a system that's tracking something real" — exactly the brief's
  "data becoming visual."

### C.5 Color
- **Cream = page** (`#F5F1E6`): the calm base.
- **Forest green = structure** (`#20402E`): grid rules, headers, the dark live-rail and "campus pulse"
  panels, primary buttons.
- **Muted gold = live signal** (`#C9A24B`): **only** for "new/active/hot" — the pulsing LIVE dot, NEW/HOT
  badges, the hot bar fills, unread. Gold = "this just happened."
- Discipline: green structures, gold *signals*, cream holds it. No gold as decoration; no green as wash.

### C.6 Layout language
- **Whitespace:** present but secondary to *density of signal* — this direction is allowed more
  information per screen (it's a dashboard-like index).
- **Grid:** a strong **structured grid**; the signature is a **top live-activity rail** (dark green, mono,
  pulsing gold dot) that runs site-wide like a ticker.
- **Full-bleed imagery:** vendor grid photos are square-ish tiles; contained.
- **Typography:** Archivo headlines; mono data labels everywhere.
- **Cards:** vendor tiles with a 1px border; **live cards get a gold border + NEW/HOT badge.**
- **Lists:** the category directory is a clean indexed list with mono counts.
- **Sections:** a signature **dark "Campus Pulse" data panel** (gold bars computed from real views/
  messages) — "data becoming visual."

### C.7 Component language
- **Buttons:** rounded-rect (radius 7–10px), green fill for primary; mono labels okay.
- **Inputs:** boxed, green border on focus; mono placeholder.
- **Vendor card:** square-ish tile; gold badge if live; Archivo name; mono meta with green rating.
- **Listing card:** same family.
- **Badges:** gold block, mono, uppercase (NEW / HOT) — the live signal.
- **Navigation:** top bar; wordmark in Archivo 800 ("Vo**b**eq" — the b in green is a small brand mark).
- **Tabs/Modals/Dropdowns:** square-ish, green-accented.
- **Notifications:** mono toasts with a gold dot.
- **Chat UI:** (see §5) — carries the live rail; unread = gold dot + count.
- **Profile:** structured header with mono trust stats; live "OPEN NOW" in gold.

### C.8 Imagery
Candid, energetic campus photography — the index is *current*, so images should feel like they were
taken this week. Vendor tiles, event snaps, food being made. Slightly higher energy than A/B.

### C.9 Animation language
- **Page transitions:** quick fade/slide; the live rail persists (continuity of "alive").
- **Hover:** tiles lift 1px + border → gold if live; buttons darken.
- **Scroll:** new items *rise and settle* as they enter (data arriving); trending bars can fill on
  reveal.
- **Component motion:** the **LIVE dot pulses** (CSS); NEW badges can pop once; "campus pulse" bars
  animate width on load.
- **Image motion:** hover zoom within tile.
- **Navigation:** active = green underline; the rail stays fixed.
- **Micro-interactions:** save = gold check; send = bubble with scale.
- **Ambient motion:** **the live rail is the only persistent motion** — and it's *real data*, not
  decoration (per §1.1, this is the acceptable "alive"). No background, no grain, no glow.
- **What should NOT move:** page background, nav, footer, body copy, static vendor photos at rest.

### C.10 Mobile experience
The live rail becomes a compact top ticker; the vendor grid goes 2-col; NEW/HOT badges stay gold (signal
survives). Bottom-tab nav. Touch targets ≥ 44px. The "alive" feeling is *stronger* on mobile (a campus
ticker in your pocket).

### C.11 Accessibility
- Cream/ink ~11:1; green panels cream-text ~8:1 (AA).
- Gold is signal-only (never sole carrier of essential info — pair with text/number).
- Focus = green/gold outline; the pulsing LIVE dot **stops under reduced-motion** (respects the
  preference; pulse is decorative, so it must halt).
- Touch targets ≥ 44px.
- Readability: Inter 16px min; mono only for data labels, never long body.

**Verified prototype:** homepage + discovery —
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_962b621898694d5193392fbbb44c9d41.png
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_1f982964e8334eb4ada354b49cb04a7d.png

---

# DIRECTION D — "THE CONTOUR FIELD"  *(added: 4th direction, built with the aesthetics/animation/background craft skills)*

### D.0 Why a 4th direction
The brief's hardest open question was *"what visual phenomenon could belong uniquely to Voeq?"* — and
explicitly about **backgrounds**, which the founder had rejected as generic (organic green lines, grain,
gold glow, cursor-reactive). Directions A/B/C answered "alive" through type, space, and data. None
answered the **background itself** without either rejecting it (my pushback) or repeating the rejected
clichés. Direction D takes the question seriously: **the visual phenomenon unique to Voeq is campus
*terrain* — a mapped place.** NMU is on an island (Okerenkoko, Delta). So the background is a
**topographic contour field**: thin forest-green contour lines, layered, drifting slowly like a tide
and breathing like land. It is *earned by the subject* (a campus you can map), not decorative. Built
with real CSS keyframes (drift + breathe), **no gradient mush, no grain, no glow, no cursor-reactivity.**

### D.1 Name
**The Contour Field.** Voeq as a *mapped place* — the campus drawn as terrain beneath the directory.

### D.2 Design philosophy
Forest green becomes **contour lines on cream paper** — the page *is* a map of the campus, faintly. The
marketplace sits *on* the terrain. This is the one direction that makes the **background a first-class,
intentional element** without violating the founder's rejection (it is line-based topography, not
glowing grain). Motion is *geological, not digital*: contours drift like a slow tide and breathe like
land settling — 12–34s cycles, imperceptibly slow. Gold stays a **signal only** (live dot, verified
tags). The personality: *grounded, geographic, quietly alive.* Its risk (discipline): the contour must
stay at ~6–9% opacity — if it gets loud, it becomes the exact background clutter rejected. Verified in
prototype: vision confirmed it reads as "genuinely subtle and intentional, not generic decoration."

### D.3 Emotional feeling
*Grounded. Geographic. Like the campus has a shape.* Discovery feels like *finding a place on a map*,
not scrolling a feed. Trust comes from the sense that this is *real ground*, real vendors, a real place.

### D.4 Typography
- **Display:** **Fraunces** (serif, optical) — used for hero + vendor names; the hero headline reveals
  via an **ink-fill wipe** (green fills the letterforms left→right on load — "ink on paper/terrain").
- **UI/Body:** **Inter.**
- **Accent:** **IBM Plex Mono** — the live-signal labels, stats, chips.
- *Why:* serif + mono keeps the editorial credibility of A, but the *background* carries the identity
  instead of folios — so type can be quieter than A.

### D.5 Color
- **Cream = paper/terrain base** (`#F3EFE3`): dominant, but the contour lines live *on* it.
- **Forest green = contour ink + structure** (`#1C3826`): the background lines (low opacity), all type,
  buttons, the live card's mini-contour.
- **Muted gold = signal** (`#A47E2E`): **only** the live dot, verified tags, hover borders. Sparse.
- **Glass/etched cards:** surfaces use `rgba(cream,.7)` + `backdrop-filter:blur(2–3px)` so the contour
  *shows through* them — this is the one intentional, *earned* translucency (unlike slop glassmorphism:
  here it reveals the map beneath, and it degrades gracefully without blur).

### D.6 Layout language
- **Whitespace:** generous; the contour provides texture so empty space never feels empty.
- **Grid:** asymmetric hero (text left, a "live signal" glass card right that *contains its own mini
  contour* — the hero visual is the campus signal, not a stock photo).
- **Full-bleed:** the contour is full-viewport-fixed behind everything.
- **Typography:** hero reveals via ink-fill; section heads in Fraunces with mono kicker.
- **Cards:** quiet bordered cards (hairline, 14px radius) that lift 3px + gold border on hover.
- **Lists / Sections:** same editorial discipline as A/B.

### D.7 Component language
- **Buttons:** pill (search/composer) or square (legacy-consistent); green fill primary.
- **Inputs:** pill, cream-glass, green border on focus.
- **Vendor/Listing cards:** quiet, hairline, hover-lift.
- **Badges:** gold mono (VERIFIED / LIVE).
- **Navigation:** top bar; wordmark Fraunces.
- **The signature component:** the **"Live on campus" glass card** — a translucent panel showing
  570 mapped / 3 new / 12 messages / ▲40% tech, with a pulsing gold dot and a mini-contour in the
  corner. This is the contour *field* compressed into a widget.
- **Chat / Profile / Discovery:** inherit B/C skins (this direction is primarily a *background +
  hero* identity; surfaces reuse the shared primitives from §6).

### D.8 Imagery
Real campus/vendor photography as before — but now it sits *on the map*. Vendor photos feel located,
not floating.

### D.9 Animation language (the craft core)
- **Background — `tideDrift`** (verified keyframe): two contour layers slowly translate + rotate
  (26s / 34s, `ease-in-out`, `alternate`) — like a tide moving across the mapped campus.
- **Background — `contourBreathe`** (verified keyframe): a third layer scales 1.0→1.04 and opacity
  .35→.7 on a 12s loop — the land "breathing." All three layers are **≤9% opacity**, so motion is felt,
  not seen.
- **Hero — `inkFlow`**: the headline reveals by animating `background-size` of a green fill clipped to
  the text (`background-clip:text`), 1.1s, staggered words — ink settling onto the terrain.
- **Hover:** cards lift 3px + border→gold; buttons darken.
- **Live signal:** the gold dot pulses (box-shadow ring, 1.8s) — *real data*, allowed.
- **What should NOT move:** body text, nav, footer, vendor photos at rest, the contour layers' *color*
  (only transform/opacity animate — never hue/glow).
- **Reduced motion:** `@media (prefers-reduced-motion)` freezes all contour/ink/dot animation and
  shows the contour static — the map remains, the motion stops.

### D.10 Mobile experience
The fixed contour scales down gracefully (it's vector, no raster cost). Hero stacks; the live card
moves above the fold (`order:-1`); type keeps Fraunces. Bottom-tab nav (unified). Touch targets ≥44px.

### D.11 Accessibility
- Cream/ink text ~12:1 (AAA). Gold signal-only.
- The contour is `aria-hidden` + `pointer-events:none` + fixed behind content (never interferes with
  reading or interaction). At 6–9% opacity it does not reduce text contrast.
- Focus = gold outline. Reduced-motion halts all background motion (verified in code).
- No reliance on motion to convey meaning (the live dot also has text "Live on campus").
- **Slop self-audit (claude-design 10-tell): 0/10** — no tech gradient, no violet, no feature-tile
  grid, no accent rail, no unearned blur (the glass *reveals the map*, purposeful), no monument stat,
  no icon toppers, asymmetric (not center-stack), deliberate type, correct surface (hero on Decide).

**Verified prototype:** homepage —
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_342b939039184f4e9b95201a6e139a93.png

---

## 3. CROSS-DIRECTION SUMMARY

| Axis | A · Broadsheet | B · Green Room | C · Living Index | D · Contour Field |
|---|---|---|---|---|
| Personality | Printed, curated, proud | Calm, premium, safe | Alive, current, signal-driven | Grounded, geographic, quietly alive |
| Display font | Fraunces (serif) | Manrope (sans) | Archivo (grotesk) | Fraunces (serif, ink-fill) |
| Body | Inter | Inter | Inter | Inter |
| Accent | IBM Plex Mono (folios) | JetBrains Mono (data) | JetBrains Mono (live data) | IBM Plex Mono (signal) |
| Cream role | Paper (dominant) | Canvas (calm UI) | Page (base) | Paper/terrain base |
| Green role | Ink (type/rules) | Field (deep panels) | Structure (rules/panels) | **Contour lines + ink** |
| Gold role | Foil (sparse tags) | Interaction (focus/active) | Live signal (new/hot) | Signal (live dot/verified) |
| Editorial intensity | Highest (public+profile) | Medium (hero only) | Low (data-forward) | Medium (hero + contour) |
| "Alive" mechanism | Editorial type reveals | Presence (typing/unread) | Live data rail + signals | **Topographic background drift/breathe** |
| Background | None (paper) | None (canvas) | None (page) | **Topographic contour field (intentional)** |
| Best at | Brand/marketing, vendor profile | Calm product, trust, chat | Discovery, trending, engagement | Brand identity + the "background" question |
| Risk | Tips into "old magazine" | Tips into "bland" | Tips into "busy" | Contour gets too loud (keep ≤9% opacity) |

---

# 3B. "MODERN" — SILENCIO-INSPIRED GALLERY DIRECTIONS (requested: 3 variations)

### Why this section exists
The founder shared 6 reference designs (MODERN LUXE VIL, CELESTIA, two magazine/portfolio
templates, a fashion e‑com template, an interior-design studio). **Honest read:** five are competent
*clichés* — MODERN LUXE VIL is the exact #1 AI default (sage/beige serif, arched category tiles),
CELESTIA is a luxury-jewelry template, the rest are magazine/portfolio templates. They "look ok"
because they are competent, not because they are distinctive. The genuinely useful signal was the
**Silencio** reference the founder supplied: *silence as a design material* — extreme type contrast
(141px grotesque whisper next to 9px mono label), one warm accent, zero shadows/blur, hairline rules,
floating artifacts, museum labels. "Modern," to this founder, = **Silencio's gallery discipline.**

So the three "modern" variations below **translate Silencio's discipline onto Voeq's locked palette**
(cream = paper, forest green = ink, muted gold = the single signal) rather than copying the clichés.
All three are **rendered, screenshot-verified** as premium gallery/editorial — not generic SaaS.

### M1 — "Vitrine" (light gallery, literal Silencio on cream)
- **Field:** cream paper (`#F5F1E6`). **Ink:** forest green. **Signal:** gold (Verified tag only).
- **Type:** Inter weight 100/200 for the workhorse; display = `clamp(60px,12.5vw,141px)` weight 100,
  line-height .88, with one italic word as the accent. Mono (IBM Plex Mono 11px) as the museum label.
- **Discipline:** no shadows, no blur; sections separated by 1px hairline rules (not color blocks);
  vendor cards = floating artifacts (photo, small radius 7px, no frame); pill CTA (transparent, 1px
  border); huge hero + tiny label = the Silencio contrast move.
- **Verified:** vision confirmed "Silencio discipline achieved — premium/quiet gallery, not SaaS."
- **Prototype + screenshot:**
  `explorations/M1-vitrine.html` —
  MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_b7e8c1053e0a4423947bff7af941c73d.png

### M2 — "Dark Gallery" (inverted Silencio: forest green as the silence field)
- **Field:** deep forest green (`#163025`) as the page — the *silence* is green, not white. **Ink:**
  cream. **Signal:** gold (italic accent on hero + pill + Verified tags).
- **Same discipline as M1** but inverted: warm metallics (cream/gold) on cool dark green; hairline
  rules in darker green; vendor artifacts float on near-black photo tiles with hairline borders.
- **Why it works:** it's Aesop/COS *at night* — the locked palette's green finally becomes the hero
  surface, and gold reads as the only warmth. Distinct from generic dark-mode SaaS (which is blue/black
  + glow).
- **Verified:** vision confirmed "premium dark gallery (Aesop/COS at night), not generic dark-mode SaaS."
- **Prototype + screenshot:**
  `explorations/M2-dark.html` —
  MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_771bf142ca4f45ce851c644a9511c024.png

### M3 — "Editorial Object" (Silencio restraint + broadsheet serif voice)
- **Field:** cream. **Ink:** forest green. **Signal:** gold. **Display:** Fraunces (serif) instead of
  grotesque — the one point of departure from literal Silencio, giving it the *broadsheet* character
  of Direction A but with M1's restraint (asymmetric hero, not centered; ink rule under nav; serif
  vendor names + mono meta).
- **Discipline:** same no-shadow/hairline/artifact rules; the only "editorial" move is the serif
  display + asymmetric hero + "Issue 01" folio framing.
- **Verified:** vision confirmed "premium editorial object (magazine-meets-gallery), distinct from M1/M2."
- **Prototype + screenshot:**
  `explorations/M3-editorial.html` —
  MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_20697a05f71f40bc90965fa91c1afcef.png

### What these three share (the "modern" DNA, regardless of light/dark/serif)
1. **Extreme type contrast** — one huge quiet statement vs one tiny mono label. Typography does the
   talking; nothing else competes.
2. **One accent only** — gold appears *once* per region (a tag, an italic, a pill). It is signal, not
   decoration.
3. **Zero elevation fakery** — no shadows, no blur, no glow. Depth = hairline rules + whitespace.
4. **Floating artifacts** — vendors/products sit as museum objects, unframed, unshadowed.
5. **Curatorial voice** — "Featured this week," "Three of 570," "Manifesto — 01." Not "Browse 12,000
   listings." The directory is a *collection*.
6. **Whitespace as luxury** — the page breathes; silence is the material.

### My honest assessment of the references
- The 6 founder-sent designs are **not** the target — they are the *avoid* list (generic
  sage/serif/arched-tile clichés). I built the opposite of them, using the one reference (Silencio)
  that encoded real taste.
- **M2 (Dark Gallery) is my pick of the three "modern"** — it makes the locked forest green the hero
  surface (something A–D underuse), gold finally earns its "precious metal" role, and it's the most
  distinctive against the generic-light-gallery sameness of the references. M1 is the safest; M3 is the
  most "brand/publication."
- **Caveat (kept honest):** these three are *homepage/brand* explorations. The Silencio discipline
  must NOT be forced onto the transactional surfaces (browse grid, chat, dashboard) — there, density
  and speed win (Direction B's calm product language). Same rule as before: gallery restraint on the
  public/marketing + vendor-profile surfaces; product clarity inside.

---

## 4. TYPOGRAPHY RECOMMENDATION (cross-cutting)

- **Shared body = Inter** across all three (a neutral, screen-legible workhorse). The *display* face is
  what gives each direction its personality — that's a disciplined, intentional choice, not laziness.
- **One expressive display face per direction** (Fraunces / Manrope / Archivo) — never two display faces
  fighting.
- **Mono as the "system voice"** — used differently per direction (folios vs data vs live signal) but
  always present; it encodes "this is a real, tracking product."
- **Optical sizing / weights** matter more than the exact face. Whatever is chosen, set a strict type
  scale (e.g. 12 / 14 / 16 / 20 / 28 / 40 / 56 / 72) and a tracking rule (display tight, mono wide).

---

## 5. NATIVE MESSAGING — CORE CAPABILITY (WhatsApp removed)

WhatsApp is gone. Native messaging is now **first-class**, not an afterthought. All three directions
implement the same functional spec; only the *skin* differs:

- **Conversation list:** avatar + name + last-message preview + timestamp + **unread gold pill/count**.
  Active thread highlighted (B uses a gold left-border; C uses a gold dot; A uses an ink rule).
- **Conversation view:** bubbles — **them = light/cream card**, **me = deep-green fill** (consistent
  across all three so the "me" color is a brand constant). Read receipts ("Read" in gold/mono).
- **Composer:** rounded input + green Send; attach (Phase 2), emoji (Phase 2) as later additions.
- **Unread state:** gold dot/pill; clears on open. **Per §1.1, the unread pulse is real data — allowed.**
- **Mobile messaging:** full-screen thread, bottom composer fixed above the tab bar, swipe-back to list.
- **Desktop messaging:** two-pane (list + thread) as in the B prototype; A/C use the same two-pane on
  desktop, collapsing to a single pane on mobile.
- **Presence:** "typing…" and "usually replies within an hour" — the *alive* signal, allowed.

Verified messaging prototype (Direction B skin):
MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_e1ab1ce01d9b4ea3abf2b03bb2ad46b2.png

---

## 6. COMPONENT LANGUAGE (shared primitives, per-direction skin)

Defined once, themed per direction:
- **Buttons:** A square / B pill / C rounded-rect — but all have a single primary (green fill) and one
  ghost (hairline). No third style.
- **Inputs:** boxed, focus ring in the direction's accent (gold for A/B, green for C).
- **Cards:** A ruled-top / B hairline-quiet / C bordered-tile. Radius disciplined per direction.
- **Badges:** gold, mono, uppercase — meaning is consistent (VERIFIED / OPEN NOW / NEW / HOT / LIVE).
- **Nav:** unified bottom-tab on mobile for **all roles** (fixes legacy vendor-hamburger inconsistency);
  desktop sidebars per role.
- **Modals / Dropdowns / Notifications / Profile:** inherit the direction's rules.

---

## 7. ANIMATION LANGUAGE (shared discipline)

- **Page transitions:** 180–260ms ease; route change feels like a deliberate cut, not a spin.
- **Hover:** 1–2px lift or border/accent shift; **no scale-bounce, no glow.**
- **Scroll:** reveal-on-enter (staggered for A's type; subtle fade for B; rise-for-new for C). Respect
  reduced-motion.
- **Micro-interactions:** save/follow/send get one small, satisfying motion each.
- **Ambient:** **none decorative** (per §1.1). The only persistent motion allowed is *real-data*
  presence (live rail, typing, unread pulse) — and it halts under `prefers-reduced-motion`.
- **What must NOT move:** page background, nav, footer, body copy, static images at rest.

---

## 8. UX PHILOSOPHY (all directions)

Priorities, in order: **Discovery → Trust → Communication → Simplicity → Speed → Feedback →
Accessibility.**
- **Shopper:** Discover → Understand → Trust → Message, minimal friction. Search must be *findable
  immediately* (never hidden behind editorial flourish).
- **Vendor:** Set up → Publish → Manage → Communicate, minimal friction. Onboarding (5 steps per founder
  doc) shows a live preview **on mobile too** (legacy hid it — fixed).
- **Trust is the product:** verified badges, ratings, "OPEN NOW," reply-rate, and real reviews are
  surfaced *before* secondary info on every surface.
- **Feedback everywhere:** every action has a state (saved/followed/sent/error). Empty states are
  invitations, not blanks.

---

## 9. RESPONSIVE STRATEGY

- **Mobile-first** (pilot audience is mobile, campus networks often throttled).
- **Don't shrink — recompose:** each direction condenses its signature (A → single-column issue; B →
  calm stack + green panel; C → 2-col live grid + top ticker).
- **Nav:** unified bottom-tab on mobile (all roles). Desktop: role sidebars.
- **Type:** display faces survive mobile (identity depends on them); body ≥ 16px.
- **Performance:** route-level code-split; charts lazy-loaded (per proposal §11); images `next/image` +
  Cloudinary transforms; no write-on-read; skeletons, not spinners.

---

## 10. FIGMA EXPLORATION REFERENCES

As stated in §0, Figma MCP was **not callable** in this session. The visual exploration was done as
**rendered, screenshot-verified HTML prototypes** (genuine exploration, not theory). Files:
`docs/project-blueprint/explorations/`. Six screens verified:

| Direction | Homepage | Signature screen |
|---|---|---|
| A · Broadsheet | `A-home.html` | `A-vendor.html` (vendor profile) |
| B · Green Room | `B-home.html` | `B-messages.html` (native messaging) |
| C · Living Index | `C-home.html` | `C-discovery.html` (discovery) |

Screenshots embedded above (MEDIA links in each direction). To port into Figma: open the HTML in a
browser and screenshot, or wire Figma MCP into my session and I'll drive `use_figma` directly.

---

## 11. MY PREFERRED DIRECTION

**I recommend Direction B — "The Green Room" — as the base, with C's "live signal" mechanism borrowed
for the discovery/trending surfaces.**

**Why B as the base:**
1. It is the **safest for usability** at scale — a marketplace lives or dies on browse/chat/dashboard
   clarity, and B keeps those surfaces calm and conventional while still feeling premium.
2. It best embodies **"trust is the product"** — restraint *is* the trust signal. Loud editorial (A) or
   busy live-index (C) can dilute trust if overused.
3. It is the **least likely to become a cliché** — cream-as-canvas (not wallpaper) + green-earns-its-
   moments + gold-only-on-interaction directly answers my §1.2 pushback.
4. It is the **most "modern product"** — meets the "fast/digital/contemporary" half of the brief without
   sacrificing the editorial/premium half.

**Why borrow C's live-signal for discovery:** "Alive" is a locked word, and B's calm can feel static.
The *right* place for "alive" is **discovery/trending** (C's live rail + gold NEW/HOT signals), not the
whole app. So: **B everywhere, C's data-signals on browse/trending.** This gives you editorial+modern+
minimal+premium+alive+campus-native without a decorative background.

**A is not wasted:** use A's *editorial voice* for the **marketing homepage, vendor profiles, and the
"manifesto"/about surfaces** — those are where print personality sells. So the real recommendation is a
**hybrid**: B system + A voice on public/profile + C signals on discovery.

---

## 12. WHAT I WOULD CHANGE ABOUT THE FOUNDER'S CURRENT ASSUMPTIONS

1. **Drop "ambient motion" from the brief.** You already rejected the decorative background; "subtle
   environmental motion" is the same idea in disguise. Replace with *"motion earned by real data."*
2. **Reframe cream.** It should be *paper/texture*, not the default full-bleed background. Otherwise
   you're one hue-swap from the AI cliché you're avoiding.
3. **Cap editorial intensity to public + profile surfaces.** Don't let "editorial" compromise the
   browse/chat/dashboard clarity. A shopper must find search in <1s.
4. **Gold = signal/interaction only, never a fill or a wash.** Three directions all agree: gold's power
   is its scarcity.
5. **"Alive" belongs on discovery, not everywhere.** See §11.
6. **Unify mobile nav now** (bottom-tab for all roles). The legacy vendor-hamburger divergence is a
   real inconsistency; fix it in the design system, not per-screen.
7. **Don't ship dead "coming soon" stubs** (Events/Housing/Waybill). They broke trust in the legacy
   build. Link them only when built, or omit from nav.

---

# 3C. BACKGROUND-FIRST LANDING PAGES (the synthesis: Silencio + destroytoday → meaningful background)

### Why this section exists
The founder supplied two taste references — **Silencio** (silence as material) and **destroytoday**
(monograph; *color as meaningful punctuation, not atmosphere*) — and gave one explicit instruction:
**"focus on background for landing page than plain cream."** That resolves the open question from
Direction D: the landing background should be a **designed phenomenon**, not flat cream, but it must be
*meaningful* (destroytoday's lesson) and *not* a generic glow/gradient (the founder's earlier
rejection). Generic ambient backgrounds were explicitly vetoed; a *subject-earned* background is the
opposite of generic.

### The phenomenon (grounded in Voeq's identity, not decoration)
NMU is on an island (Okerenkoko, Delta). So the background = **the campus, mapped**: a topographic
contour terrain in forest green, with a **constellation of gold dots = live vendors** plotted on it
(some pulsing gold = new/active, some dim green = established). The landing page *is* a live map.
This is the one background that is *uniquely Voeq* — no other marketplace has "campus terrain + real
local vendors as constellations." It satisfies every constraint: earned by subject, no gradient mush,
no grain, no glow, no cursor-reactivity. Motion is geological (slow drift/breathe) + the live dot
pulse is *real data*, allowed.

### BG-1 — "Terra" (light: cream paper + green contour terrain + gold vendor constellation)
- Cream paper base; thin forest-green contour lines (layered, drifting 38s/52s + breathing 16s); gold
  dots scattered as the vendor map (pulsing = new, dim = established). Hero = huge thin grotesque +
  tiny mono label (Silencio discipline). Live stat bar (570 mapped / 3 new / 12 messages / ▲40% tech).
- **Verified:** vision — "background is a genuine designed phenomenon, not flat cream, not generic
  gradient/glow; highly readable."
- `explorations/BG-terra.html` —
  MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_f3563d7008b846d6a5dfc6c7f2a8a575.png

### BG-2 — "Dark Field" (dark gallery + contour terrain behind it)
- The founder's favorite "modern" look (M2 Dark Gallery) **with** the contour field behind it: deep
  forest-green page, cream/low-green contour terrain as texture, gold constellation dots, huge thin
  cream hero with gold italic "ground", gold pill CTA. The background finally gives the dark gallery
  its *atmosphere* without breaking the Silencio restraint (no shadow/blur — the contour is line-only).
- **Verified:** vision — "contour background reads as intentional cartographic texture, not noise;
  stays cleanly behind content; legibility excellent."
- `explorations/BG-darkfield.html` —
  MEDIA:/C:/Users/Legacy/AppData/Local/hermes/cache/screenshots/browser_screenshot_835a32b8c0d04f2d9326dfef51aa2dfb.png

### Engineering reality (kept honest, not a blocker)
These two are **static design proofs** — the contour SVG + dots are hand-placed to demonstrate the
*look*. A production landing page needs this to be **data-driven**:
- The vendor dots become **real coordinates** from the DB (lat/long or a normalized campus grid per
  NMU hostel/faculty), fetched on load, re-plotted as vendors join/leave → the "constellation" is
  literally live.
- The contour terrain can be a **static asset** (one SVG, cheap) or generated from a campus GeoJSON.
- Performance: SVG lines + ~12 CSS-animated dots = negligible cost; `prefers-reduced-motion` freezes
  it. This is not a heavy WebGL scene.
- This is **feasible** (Next.js + a small client component rendering dots from an API). It is a
  *build* task, not a research question — flagged here so it lands in the implementation plan, not
  silently dropped.

### My pick of the two
**BG-2 (Dark Field)** — it combines the founder's preferred modern aesthetic (dark gallery) with the
background phenomenon he asked for, and the contour reads even more intentional on dark. BG-1 is the
lighter, more "Silencio-pure" alternative.

---

**END OF EXPLORATION. Nothing herein is approved. Awaiting your review of the directions (A–D, M1–M3,
BG-1/BG-2) and the hybrid recommendation before any design system or implementation begins.**
