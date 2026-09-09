# Operation Money Bag — COMMITMENT LEDGER (the thread ledger)
*Every promise, correction, and decision from the entire conversation — itemized, each with a build destination. Nothing left in the threads. This file is checked off item-by-item during the build; any item not traceable to a line here gets flagged by David's right to ask "was X done?".*

## A. DESIGN COMMITMENTS (from locked mocks — each ships as coded in the mock)
| # | Item | Mock | Build destination | Status |
|---|---|---|---|---|
| A1 | Two-row nav (logo + filled forest search pill + icons + signin/signup divider; row 2 categories + ✦ Voeq Live accent + Sell pill) | home-v7.1 | LandingNav rewrite + ExploreNav | ☐ |
| A2 | Mobile nav: logo + signin/signup + burger ONLY; drawer = search + Saved + Messages | home-v7.1 | MobileNavDrawer (new) | ☐ |
| A3 | Hero: centered mobile/editorial desktop, "Find it. Chat it. Get it." amber italic on "Get it.", eyebrow rules, "or sell on Voeq ›" | home-v7.1 | LandingHero rewrite | ☐ |
| A4 | Polaroid collage = REAL listings (name + ₦ + campus + live dot captions), swipeable 390px, 3-fan desktop | home-v7.1 | HeroCollage (new, reads /api/explore) | ☐ |
| A5 | Sand trust band: Campus verified / Chat before you buy / Meet-on-campus safe + "Market open — [campus]" pulse pill (real time) | home-v7.1 | TrustBand (new) | ☐ |
| A6 | Fresh drops: forest band, live pill, big cards 84% mobile / 2+peek desktop, 9s auto-advance (rail-local scroll only), pause-on-touch 12s, dots sync | explore-v1/home-v7.1 | Carousel shell + fresh drops data | ☐ |
| A7 | Vendor Spotlight: seal, avatar amber ring, stats pill, "Today's pick" frosted bar, ‹› arrows (manual resumes auto), 9s crossfade, fair-note | home-v7.1/live | VendorSpotlight (new) | ☐ |
| A8 | Grid: 2-up mobile / 4-up desktop, equalized heights, LIVE/NEW tags, imgcount, hover lift+zoom, staggered reveal 100ms | storefront/listing/home | ListingCard upgrades | ☐ |
| A9 | "What is Voeq?" sand band: 01 Find it / 02 Chat it / 03 Get it + vendor panel (3 steps, "No listing fees · no commission on meet-up sales · you set your prices") | home-v6/v7 | Landing sections | ☐ |
| A10 | Explore door: dashed pill "The full market — filters, categories, everything →" | home-v7.1 | Landing → /explore link | ☐ |
| A11 | Context strip: 📍 campus · live count · Campus/Areas/All-Nigeria segmented · Filters button w/ count badge; sticky | explore-v1 | ContextStrip (new) | ☐ |
| A12 | Filter drawer: bottom sheet <768 / LEFT SIDEBAR ≥768; Location single, Category multi, Price manual ₦ min/max (NO sliders ever), Trust checkboxes, Sort; Apply w/ count, Clear all; URL-param sync | explore-v1 | FilterDrawer (new) | ☐ |
| A13 | Live page: masthead seal, "Today's shelf, hand-picked.", picks w/ "Why it's here" one-liners, rank numerals 01/02/03, trust card ("earned… can't buy placement… refreshes 9am"), cross-suggestions w/ WORKING tabs (re-rank in place), category grid w/ real counts | live-page v3 | /explore/live | ☐ |
| A14 | Trending: red-hot kicker, week switch (w37/last/food/gadget/all), ranked board #1-7 mono ranks, deltas ▲▼ (need ≥20 events), RISING (not TRENDING) flames, "Load ranks 8-20", "loves" honest headline | trending v3.1 | /explore/trending | ☐ |
| A15 | Listing detail: A2 head + gallery swipe track + ▹ counter synced + tap-zoom lightbox + Voeq Live seal when picked + price card ("price agreed in chat") + sticky CTA bar (Message/save/share w/ dropdown: Copy/WhatsApp/X/Facebook/QR) + About + facts 2×2 + vendor card (socials chips inside, mono stats, Visit storefront + Follow) + More-from-market rail + comments v3 | listing-v1.3 | ListingDetail upgrade | ☐ |
| A16 | Comments v3: white pill post bar (send activates on text, Enter posts), rows w/ "bought this" badges + mono times, vendor reply = indented amber-border card w/ vendor tag, Follow button (notify on new comments), anon state ("Sign in to comment — it keeps the market honest") | listing-v1.3 | CommentsList/CommentForm upgrades | ☐ |
| A17 | Storefront: minimalist brand banner (forest-deep field, serif name, amber rule, category line — Option B generated) + HYBRID (cover upload unlocks later, same slot, editor control + revert) | storefront-v1.8 | StorefrontHero + cover field | ☐ |
| A18 | Identity card v1.8: avatar amber-ring overlap, hero name + verified dot, ONE meta line all-sans, actions row (Message/Follow/Share-square), statbar (Listings / Rating "—" until 50 reviews / On Voeq since), description, category pills COMPUTED from listings, socials row (WA channel/IG/TikTok/X — render only when data exists), share bar (Copy + WhatsApp) | storefront-v1.8 | StorefrontHero upgrade | ☐ |
| A19 | Storefront reviews: NO aggregate score, NO bars — "What buyers say — N reviews · scores unlock after 50 reviews", texts + star glyphs + vendor replies (amber-border indented) | storefront-v1.8 | StorefrontTrust rewrite | ☐ |
| A20 | Areas band (landing): "Beyond the campus gates" full treatment w/ proximity chips ("12 min from NMU"); explore keeps slim directory band | explore-v1 note | Landing section + explore band | ☐ |
| A21 | NO footer on explore/listing/storefront/admin/auth — footer ONLY landing + public info pages | founder rule | SmartFooter allowlist change | ☐ |
| A22 | Footer v2 (landing/info only): top strip (logo+dot, tagline, market-open pill desktop), 4 cols w/ NEW/SOON tags, Help card (support@voeq.ng mailto), socials (real URLs: IG @voeq.ng, TikTok @voeq.ng, WA channel 0029Vb8u4Md6mYPON8gMpi3i), legal row "© 2026 Voeq · Powered by Legacy LM" | home-v7.1 | SmartFooter upgrade | ☐ |
| A23 | No emoji icons anywhere in nav/cards (SVG line icons only); lucide verified names | home-v7.1 | All rewrites | ☐ |
| A24 | BrandLogo component 94px everywhere, never text wordmark | standing rule | all pages | ☐ |

## B. BEHAVIOR COMMITMENTS (motion, states, data honesty)
| # | Item | Build destination | Status |
|---|---|---|---|
| B1 | Slow marination timings: carousels 9s, crossfades 1.8s, pulse 3.2s, reveals 1.1s/90-120ms stagger — never faster | all animated components | ☐ |
| B2 | prefers-reduced-motion honored EVERYWHERE (mocks ignored it) | all animated components | ☐ |
| B3 | Free scroll ALWAYS: rail-local scrollTo only (scrollIntoView banned in carousels), user swipe pauses auto 5-12s, dots sync on manual scroll | all rails | ☐ |
| B4 | document.hidden pauses automation; cleanup on unmount (React) | all carousels | ☐ |
| B5 | Filter persistence: sessionStorage voeq:explore-filters PRESERVED (existing behavior), campus voeq:preferred-campus preserved, URL params add shareable layer | Explore rewrite | ☐ |
| B6 | Campus 4-state machine: first visit (Set your campus chip, All-Nigeria default) / returning (campus in placeholder + counts) / logged-in (identity chip, badge icons) / logout-keeps-campus | ContextStrip + nav | ☐ |
| B7 | Honest data: counts from DB, aggregate rating "—" until 50 reviews, deltas need ≥20 events, sold counts NOWHERE, empty sections COLLAPSE (no hollow boxes) | all data-driven sections | ☐ |
| B8 | Multi-image: ▹ 1/N counter + swipe track on cards AND listing gallery; lightbox reuses track URLs (cache-hit, w_900) | ListingCard + ListingDetail | ☐ |
| B9 | "price agreed in chat" price-note on listing (free-market rule in UX) | ListingDetail | ☐ |
| B10 | Voice: "Find it. Chat it. Get it." brand line; no fake commerce claims (no "buying/selling/sold" until real orders) | all copy | ☐ |
| B11 | Campus = user context, NEVER program identity (hero copy has no university names; campus appears as data on cards/meta) | all pages | ☐ |

## C. ALGORITHM COMMITMENTS (fairness — see plan §0)
| # | Item | Status |
|---|---|---|
| C1 | Landing showcase: nightly composite score (0.35 Wilson ratingConfidence + 0.25 engagement30d + 0.2 freshness + 0.2 completeness), 14d max slot + 7d cooldown, weekly shuffle among qualifiers | ☐ |
| C2 | Fresh drops: 72h recency FIFO, appears once, auto stage-time for every new vendor | ☐ |
| C3 | Grid: fair-share round-robin (no two consecutive same-vendor), 48h weekly visibility window per listing, listing_fairness table | ☐ |
| C4 | Voeq Live: earned (≥5 reviews + confidence), admin confirms, max 1/vendor/week, never paid, rotates 9am, vendor notified (live_pick type) | ☐ |
| C5 | Score weights versioned in snapshot table (tunable without code) | ☐ |

## D. INFRASTRUCTURE + WIRING COMMITMENTS
| # | Item | Status |
|---|---|---|
| D1 | Migrations (prod+test, idempotent): listing_fairness, voeq_live_picks, vendor_score_snapshot, areas (36 states+FCT, seeded waves) + vendors.area_id | ☐ |
| D2 | Nightly cron (cron-nightly.mts): scores + windows + live shortlist → snapshot tables + audit log | ☐ |
| D3 | /api/explore: scope/area/price/verified params + sections=1 payload (ONE request feeds floor) | ☐ |
| D4 | /api/live/today, /api/vendor/[id]/showcase, /api/staff/live-picks, follow-comments endpoint | ☐ |
| D5 | AUTH BUG FIX: /become-vendor redirect adds &intent=vendor; login page passes intent to signup + Google OAuth state; verify-otp already honors it; probe proves vendor onboarding | ☐ |
| D6 | Real listing seeds on prod (founder-approved, NO "Demo:" prefix, retirable script) | ☐ |
| D7 | Sitemap + robots: all new section pages, incremental per phase | ☐ |
| D8 | 48h canary (?next=mb) before home/explore cutover; phase-isolated deploys; additive migrations; rollback plan | ☐ |
| D9 | G1-G8 gap checks (§6.1): zero-CLS, counts=query, campus machine, reduced-motion, 6-width sweep, no scroll seizes, 3G LCP<4s, multi-tab races | ☐ |
| D10 | Verification scoreboard per phase: typecheck exit, vitest, raw probe output, sweep, matrix, deploy URL, explicit gap list | ☐ |

## E. OPEN FOUNDER DECISIONS (blocking items marked 🔴)
| # | Decision | Status |
|---|---|---|
| E1 | 🔴 GO on the plan | pending |
| E2 | 🔴 Voeq Live name confirmed for schema | pending (founder said "Live is the better word" — treat as YES unless corrected) |
| E3 | Featured supply: admin-curated (recommended) vs auto+confirm | pending |
| E4 | 🔴 Prod seed listings confirm (founder-approved set, retirable) | pending |
| E5 | Sound (thock on save/send): default-on-mutable vs mute-default — NOT in v1 scope unless founder wants | deferred |
| E6 | Sold-moment diegetic feature (vendor marks sold) — deferred until orders exist | deferred |

## F. FOUNDER BUG REPORTS + MISSED-ITEM SWEEP (added after founder's final-question review)
| # | Item | Detail | Status |
|---|---|---|---|
| F1 | 🔴 NON-CAMPUS VENDOR ACCOUNTS — founder asked "hope you didn't forget that" | AREAS in plan §2.1.5 + §1.1 routes + explore mocks, BUT the **vendor onboarding form** needs the area path wired: vendors WITHOUT a campus pick State→Area (+sub-area) instead of university; `vendors.area_id` set at onboarding; storefront shows area chip instead of campus; proximity line where campus is near. **ADDED to Phase B4 scope: onboarding/vendor form area field + seed-areas prerequisite + storefront area rendering.** | ☐ added |
| F2 | 🔴 GOOGLE AUTH DECIDES FOR USERS — founder: "we don't just let google auth decide for them" | ROOT CAUSE VERIFIED IN CODE: `startGoogleOAuth()` sends a random CSRF `state` only; callback creates `createPending({intent: null})` → after OTP the user lands in shopper onboarding by default. **FIX (Phase E1 expanded):** (1) `startGoogleOAuth(intent?)` embeds intent in the state payload (state = random+intent hint, cookie carries intent, callback reads it — CSRF intact); (2) signup-page Google button passes the page's selected intent; login-page Google button passes `?intent=` from URL; become-vendor links pass intent=vendor; (3) callback stores intent on the pending identity; (4) **safety net**: after OTP verify, if intent is STILL null, show a one-time "I'm shopping / I'm selling" choice screen — Google never decides. Probe: google-flow vendor intent lands in /onboarding/vendor. | ☐ added |

---
*Ledger rule: every build commit message references its ledger IDs (e.g. "A6, B3: carousel"). David can ask "was X done?" for any row and get the commit + probe as the answer. Unchecked rows at the end = the honest gap list.*
