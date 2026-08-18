# 04-INFORMATION_ARCHITECTURE_AND_PAGE_MAP.md — Voeq Rebuild

> **Status:** INFORMATION ARCHITECTURE ONLY. Not UI design. Not components. Not routes-as-code. Not
> architecture/DB. Not implementation.
> **Bridge:** Product Requirements (Doc 02) → User Flows (Doc 03) → **IA / Page Map (this doc)** →
> Design → Architecture → Build Batches.
> **Inputs (authoritative):** `01-PRODUCT_DECISIONS.md`, `02-PRODUCT_SCOPE_AND_REQUIREMENTS.md`,
> `03-USER_EXPERIENCE_AND_FLOWS.md`. Legacy recovery = evidence only; legacy routes NOT reproduced.
> **Locked context:** domain `voeq.ng` · shopper terminology · native messaging · WhatsApp REMOVED ·
> Phase 1 = discovery + communication · Phase 2 payments deferred · direction = editorial / modern /
> minimal / campus-native / fast / high-quality.

---

# 1. IA PRINCIPLES

1. **Shallow hierarchy.** Max 2–3 levels. `voeq.ng/explore` → filter, not `explore/category/vendor/…`.
2. **Hard public/private boundary.** Public = discovery (open, indexable). Private = authenticated
   app (shopper/vendor/messages/staff). You never need to log in to *see* the marketplace.
3. **Campus context is persistent, not a page.** The active campus is a global scope shown in the
   header; it is never a separate "campus page" you navigate into.
4. **One coherent app, not two.** Mobile and desktop share the same IA; only layout density differs
   (§16). No "mobile site" vs "desktop site."
5. **Messaging is first-class, both ways.** A top-level entry point *and* contextual entry from every
   vendor/listing. Not buried in a profile.
6. **Consolidation over fragmentation.** Settings, reviews, and moderation each live in ONE coherent
   experience, not five legacy sub-pages. Fewer, better experiences (quality bar).
7. **No dead ends.** Every page has a way back + an escape to discovery/home. Auth always returns to
   the intended destination.
8. **Progressive disclosure.** Heavy actions (onboarding, listing create, staff tools) sit behind
   intent, not on the front path.
9. **SEO where it earns it.** Public discovery surfaces (home, category, vendor, listing) are
   indexable; authenticated surfaces are not.
10. **States are experiences, not afterthoughts** (§15). Loading/empty/error/unavailable are designed
    states of real pages, not generic fallbacks.

---

# 2. TOP-LEVEL PRODUCT AREAS (decision)

Evaluating the candidate set, the genuinely distinct top-level areas are:

| Area | Top-level? | Rationale |
|---|---|---|
| **PUBLIC** | Yes (navigable) | The open marketplace: landing, explore, vendor, listing, legal. |
| **AUTH** | Defined area, **not** a nav-top | A gate/flow, not a place users "live." Surfaces exist but aren't in the app nav. |
| **ONBOARDING** | Transient state, **not** top-level | Flows entered post-auth; user exits into shopper/vendor. Not a persistent area. |
| **SHOPPER** | Yes (navigable, when authed) | Personalized home, saved/following, profile, settings, notifications. |
| **VENDOR** | Yes (navigable, when vendor) | Vendor's own dashboard + management. Distinct from public storefront. |
| **MESSAGING** | Yes (navigable + contextual) | First-class; list + thread + contextual entry. |
| **STAFF** | Yes (separate surface, `/staff`) | Moderation/admin; role-scoped. |
| **ACCOUNT** | **Folded, not top-level** | Account/settings consolidated inside SHOPPER and VENDOR (consolidation decision). No separate "account" area. |

**Decision:** top-level navigable areas = **PUBLIC, SHOPPER, VENDOR, MESSAGING, STAFF.** AUTH,
ONBOARDING, ACCOUNT are defined but not separate nav areas.

---

# 3. COMPLETE PAGE / EXPERIENCE INVENTORY (FINAL PAGE-DEFINITION AUDIT)

Stable page IDs (`PG-<area>-NNN`). Every page traces to Doc 02 requirements + Doc 03 flows (§18).
Priority: MUST / SHOULD / LATER. Status: LOCKED / PROVISIONAL / OPEN / LATER / REMOVED.

Principle of this audit: **every meaningful page must have a clearly understood *job*** — purpose,
required content, actions, states, permissions — so a future build batch can be scoped without
rediscovering the product. This is Information Architecture, NOT visual/component design.

Classification vocabulary used per page:
`standalone page` · `route variant` · `composite page` · `contextual experience` · `modal/state` ·
`transient flow`.

For each page the following fields are defined: Purpose · Role · Required visible content · Primary
actions · Secondary actions · Interactive elements · Key relationships · Editable vs read-only ·
Permissions · Empty state · Loading state · Error/recovery state · Mobile · Desktop · Requirements ·
Flows · Dependencies · Intentionally excluded.

---

## 3.1 PUBLIC

### PG-PUB-001 — Landing  · standalone page · LOCKED
- **Purpose:** First impression + single entry into campus discovery; establishes Voeq's identity and
  the campus context immediately.
- **Role:** All (public, pre-auth or signed-out).
- **Required visible content:** Brand/wordmark; tagline conveying "campus marketplace"; the active
  campus selector (default NMU) shown prominently; primary CTA "Explore {campus}"; secondary entry to
  For-Vendors; minimal legal links. Background may be the designed campus-terrain phenomenon
  (design-phase decision, not product).
- **Primary actions:** Explore (→ PG-PUB-002); select campus.
- **Secondary actions:** For-Vendors; About/Help/Legal; Login/Sign-up (if signed out).
- **Interactive elements:** campus selector; CTAs; nav.
- **Key relationships:** → Explore, For-Vendors, Auth, legal.
- **Editable:** none (static + campus scope).
- **Permissions:** public.
- **Empty state:** N/A (always populated).
- **Loading:** minimal (static shell; campus content lazy).
- **Error:** campus service fail → still show landing with default campus + retry notice.
- **Mobile:** single-column hero + bottom legal/nav. **Desktop:** wider hero, top nav.
- **Requirements:** PUB-001. **Flows:** FLOW-SHOP-NEW-01, FLOW-DISC-HOME. **Deps:** DISC-004 (campus).
- **Intentionally excluded:** no login form on landing; no browse grid (that's Explore); no marketing
  bloat.

### PG-PUB-002 — Explore (browse + search + filter + trending)  · standalone page · LOCKED
- **Purpose:** The core discovery surface — find campus vendors/listings by browsing, searching,
  filtering, and trending. The primary "marketplace" view.
- **Role:** All (public; personalized if authed).
- **Required visible content:** active campus indicator; search field; filter controls (category,
  price min/max, min rating, verified-only, featured); sort control; result grid of vendor/listing
  cards (each with trust signals); a "Trending on my campus" rail; recently-viewed rail (deduped).
- **Primary actions:** open a vendor; open a listing; apply filter/sort; search.
- **Secondary actions:** switch campus; save/follow from card; share.
- **Interactive elements:** search box (debounced), filter chips/drawer, sort dropdown, cards,
  pagination/infinite scroll, trending rail.
- **Key relationships:** ← Landing; → Vendor storefront, Listing detail, Category. Search is a *mode*
  of this page (query in URL), not a separate page.
- **Editable:** filter/sort/search state (user-scoped, not persisted as content).
- **Permissions:** public (personalization requires auth).
- **Empty state:** "No vendors yet on {campus}" with CTAs (browse other campuses / become a vendor) —
  never a blank grid.
- **Loading:** skeleton grid + rail skeletons; instant-first (cache).
- **Error/recovery:** fetch fails → retry affordance; cached last-good if available; partial results
  shown with "some content couldn't load" + retry (no fake success).
- **Mobile:** single-column scroll, filters in a bottom sheet. **Desktop:** multi-column grid,
  persistent filter sidebar.
- **Requirements:** PUB-002, DISC-001..008. **Flows:** FLOW-DISC-HOME/SEARCH/FILTER/SORT/TREND.
  **Deps:** VEND-002/004 (data), TRUST-007 (signals).
- **Intentionally excluded:** checkout/cart (Phase 2); vendor management; messaging compose (contextual
  only).

### PG-PUB-003 — Category  · route variant of Explore · LOCKED (as a route, not a distinct architecture)
- **Purpose:** Explore pre-scoped to one official category — shareable, SEO-indexable category page.
- **Role:** All.
- **Required visible content:** same as Explore, with category fixed/preset and shown in heading.
- **Primary/secondary/actions:** identical to Explore (it IS Explore with `?cat=`).
- **Classification note:** this is a **route variant**, not an architecturally separate page. It shares
  PG-PUB-002's definition. Kept as a distinct URL for SEO/shareability.
- **Requirements:** PUB-004, DISC-005. **Flows:** FLOW-DISC-CAT.

### PG-PUB-004 — Vendor Storefront  · standalone page · FIRST-CLASS (LOCKED)
Conceptual hierarchy (LOCKED): **Vendor identity → trust → business information → social proof →
offerings → communication.**
- **Purpose:** The vendor's business destination — everything a shopper needs to evaluate and contact
  the business. **Storefront = the business; distinct from an individual listing (PG-PUB-005).**
- **Role:** All (public; vendor can view own).
- **Visibility precondition (🔒 LOCKED, Doc 13 §13.4):** the storefront is **not publicly
  visible/searchable until** `≥1 published listing` **AND** `required Terms/consent acceptance`. A vendor
  without a published listing (or without accepted consent) has no public storefront yet.
- **Required visible content (identity → … → communication):**
  1. **Vendor identity:** name, profile photo, primary category, campus.
  2. **Trust:** verified badge (if set), rating (avg + count), responsiveness ("responds in ~Xh"),
     open-now status, badges.
  3. **Business information:** description, operating hours, relevant business details (contact =
     native messaging handle, not phone/WhatsApp), campus/sub-area.
  4. **Social proof:** reviews (vendor-scoped), follower count.
  5. **Offerings:** grid of the vendor's active listings (→ PG-PUB-005).
  6. **Communication:** "Message vendor" (→ PG-MSG-002), Follow, Save (where appropriate), Share,
     Report.
- **Conditional/optional:** response-time SLA only if data exists; "other vendor offerings" only if
  multiple listings; campus map only if applicable.
- **Primary actions:** Message vendor; browse a listing; Follow.
- **Secondary actions:** Save, Share, Report, view reviews.
- **Interactive elements:** message CTA, follow/save toggles, listing cards, review list, hours,
  share sheet, report flow.
- **Key relationships:** ← Explore/Listing/Search; → Listing detail, Conversation view, Reviews.
- **Editable:** only by the vendor (via PG-VEND-003); read-only to shoppers.
- **Permissions:** public read; vendor manages own.
- **Empty state:** vendor with no listings → profile + "no listings yet" + message CTA (still useful).
- **Loading:** skeleton; identity + trust first, then listings.
- **Error/recovery:** vendor not found / suspended / banned → public "unavailable" state (not 500);
  browse excludes it.
- **Mobile:** single-column: identity+trust header, then offerings, then sticky message CTA.
  **Desktop:** two-column: identity/trust/business left, offerings grid right; or full-width header.
- **Requirements:** PUB-005, VEND-002, TRUST-001/002/007/008/009. **Flows:** FLOW-VEND-STORE,
  FLOW-MSG-START, FLOW-TRUST-SIG. **Deps:** MSG, TRUST, DISC.
- **Intentionally excluded:** editing controls (those are PG-VEND-003); checkout; other vendors'
  content; private analytics.

### PG-PUB-005 — Listing Detail  · standalone page · FIRST-CLASS (LOCKED)
- **Purpose:** Present ONE offering in full so a shopper can decide and act. **Explicitly NOT a
  lightweight extension of Explore or the Storefront** — it is a distinct, information-rich experience.
- **Role:** All (public).
- **Required visible content:**
  - **Required:** listing title; image gallery (≥1 photo); price / price range (min required); category;
    vendor identity (name + link to storefront); campus context; availability/open status where
    relevant; save; share; message vendor; report.
  - **Conditional/optional (show only when applicable):** rich description; vendor verification/trust
    signals (badge, rating, responsiveness); likes; follows (vendor); comments/reviews/discussion
    (vendor-scoped reviews surface here contextually); related listings; other vendor offerings;
    relevant activity/trust information (e.g. "X shoppers saved this").
- **Primary actions:** Message vendor; Save.
- **Secondary actions:** Share, Report, Follow vendor, open vendor storefront, open related listing.
- **Interactive elements:** gallery (swipe/thumbnails), save/share/report, message CTA, vendor card,
  related-listings rail.
- **Key relationships:** ← Storefront/Explore/Search; → Storefront, Conversation view, Report.
- **Editable:** none (read-only to shoppers; vendor edits via PG-VEND-007).
- **Permissions:** public read.
- **cannot be edited by shopper** (clarified): only vendor via PG-VEND-007.
- **Empty state:** N/A (single object) — but unavailable state covers missing.
- **Loading:** photo + title skeleton first.
- **Error/recovery:** not found / soft-deleted / vendor not-live → "unavailable" public state, not
  error page.
- **Mobile:** vertical: gallery, then info, sticky message/save bar. **Desktop:** gallery left, info
  right; related rail below.
- **Requirements:** PUB-006, VEND-004. **Flows:** FLOW-LIST-DETAIL, FLOW-MSG-START. **Deps:** VEND,
  TRUST, MSG.
- **Intentionally excluded:** checkout/cart (Phase 2); vendor management; comments that aren't
  vendor-scoped reviews.

### PG-PUB-006 — About  · standalone (info) · LOCKED
- **Purpose:** Explain what Voeq is and its campus mission.
- **Role:** All. **Required content:** mission, what Voeq does, pilot campus. **Primary:** link to
  Explore/For-Vendors. **Perms:** public. **States:** static; loading/error trivial. **Mobile/Desktop:**
  readable long-form. **Req:** PUB-007. **Excluded:** product docs, support forms (those are Help).

### PG-PUB-007 — Terms  · standalone (info) · LOCKED
- **Purpose:** Versioned Terms of Service; the document referenced by the consent gate.
- **Role:** All. **Required:** current TOS version + text. **Perms:** public. **Req:** PUB-008,
  STAFF-017. **Excluded:** interactive settings.

### PG-PUB-008 — Privacy  · standalone (info) · LOCKED
- **Purpose:** Versioned Privacy policy.
- **Role:** All. **Required:** current policy. **Perms:** public. **Req:** PUB-009, STAFF-017.

### PG-PUB-009 — Help  · standalone (info) · LOCKED (SHOULD)
- **Purpose:** How-to / FAQ / contact path for users (replaces legacy "Contact us").
- **Role:** All. **Required:** FAQ topics (discovery, messaging, accounts), contact path (in-app
  support/messaging, not a form-heavy system). **Primary:** open relevant help topic; start in-app
  contact. **Perms:** public. **Req:** PUB-010. **Excluded:** ticket system (later); vendor onboarding
  docs (those are For-Vendors/contextual).

### PG-PUB-010 — For-Vendors  · standalone (info + CTA) · LOCKED (SHOULD)
- **Purpose:** Recruit vendors — value proposition + entry to vendor signup.
- **Role:** All (prospective vendors). **Required:** why join, what Voeq offers campus vendors, CTA
  "Become a vendor" → Register (vendor intent). **Perms:** public. **Req:** PUB-011. **Excluded:**
  vendor management UI (that's VENDOR area).

### PG-PUB-011 — Press  · standalone (info) · LATER
- Deferred. Announcements surface. Not Phase 1.

---

## 3.2 AUTH (gate, not nav-top)

### PG-AUTH-001 — Register  · standalone (transient flow) · LOCKED
- **Purpose:** Create an account (email OTP/magic or Google), capturing shopper/vendor intent.
- **Role:** Prospect. **Required content:** identity input (email or Google), intent choice (shopper /
  vendor), anti-enumeration behavior. **Primary:** submit → verify state. **Secondary:** switch to
  login. **Interactive:** email field, Google button, intent toggle. **Relationships:** → verify
  state → gates → onboarding → destination. **Editable:** own inputs. **Perms:** public. **Empty:**
  blank form. **Loading:** submitting state. **Error:** inline field errors; OTP-without-pending
  rejected; rate-limit lockout. **Mobile/Desktop:** full-screen step. **Req:** IDN-001..011. **Flows:**
  FLOW-AUTH-REG, FLOW-AUTH-DUP, FLOW-AUTH-SINGLE. **Deps:** IDN-003/004/009/010. **Excluded:** auto-merge
  by email (REJECTED, Doc 03 §3.5).

### PG-AUTH-002 — Login  · standalone · LOCKED
- **Purpose:** Sign in; return user to intended destination (`?next=`).
- **Role:** Prospect/User. **Required:** identity + verify; `?next` preserved. **Primary:** authenticate.
  **Secondary:** recover, register. **Perms:** public. **States:** as Register. **Req:** IDN-002.
  **Flows:** FLOW-AUTH-LOGIN, FLOW-AUTH-SINGLE.

### PG-AUTH-003 — Recover  · standalone · LOCKED
- **Purpose:** Password reset flow.
- **Role:** User. **Required:** email → **Voeq OTP verification** (anti-enumeration response, Doc 13 §13.6).
  **Primary:** reset complete → login. **Perms:** public. **Req:** IDN-005. **Flows:** FLOW-AUTH-RECOVER/RECOVER-EXP.
- **Note (C4):** recovery invalidates prior reset tokens + emits security notification; **session
  invalidation after reset = 🔲 OPEN** (founder policy, Doc 09 §9.5).

### PG-AUTH-004 — Account state  · standalone (reachable when blocked) · LOCKED
- **Purpose:** Suspended / banned / deleted notice + appeal path.
- **Role:** Blocked user. **Required:** clear state reason + appeal route. **Perms:** public (no app
  access). **Req:** IDN-007. **Flows:** FLOW-AUTH-SUSPEND/BAN/DEL. **Excluded:** normal app entry.

### (verify/OTP) — modal/state within Register/Login · LOCKED
Not a page. Verification state (pending-token gated). **Req:** IDN-003. **Flows:** FLOW-AUTH-VERIFY/
VERIFY-FAIL.

---

## 3.3 ONBOARDING (transient)

### PG-ONB-001 — Shopper onboarding  · transient flow (single screen) · LOCKED
- **Purpose:** Capture discovery preferences (skippable).
- **Role:** Shopper (post-auth). **Required:** optional interest tags. **Primary:** continue (or skip).
  **Perms:** shopper. **Empty:** default if skipped. **Loading/error:** minimal. **Req:** SHOP-001,
  IDN-009/010. **Flows:** FLOW-ONB-SHOP. **Excluded:** vendor steps.

### PG-ONB-002 — Vendor 5-step onboarding  · composite transient flow (wizard, NOT 5 pages) · LOCKED count; contents PROVISIONAL
- **Purpose:** Guide vendor to a complete, live storefront.
- **Role:** Vendor (post-auth, vendor intent). **Required (per step):** (1) business identity (name,
  description, primary category); (2) campus & presence; (3) contact + identity photo (native messaging
  handle, not WhatsApp); (4) first listing (title, price range min req, description, category, photos);
  (5) review & go-live (accept Vendor Agreement). **Primary:** advance/complete. **Secondary:** back,
  save & exit (resume). **Interactive:** stepper, forms, photo upload (async moderation). **Relationships:**
  → Vendor dashboard. **Editable:** own inputs, saved per step. **Perms:** vendor. **Empty:** step 1
  blank. **Loading:** step transitions. **Error:** per-step validation; go-live blocked with reasons.
  **Mobile/Desktop:** full-screen wizard; mobile stepper. **Req:** VEND-001, IDN-008, STAFF-017. **Flows:**
  FLOW-ONB-VEND. **Excluded:** storefront mgmt post-live (that's PG-VEND-003); payments.

---

## 3.4 SHOPPER

### PG-SHOP-001 — Shopper Home  · standalone · FIRST-CLASS (LOCKED job redefined)
- **Primary job (LOCKED):** **"Show the shopper what is worth discovering right now."** A *living
  campus discovery surface* — not a dashboard of statistics.
- **Hard distinction (LOCKED):** **Shopper Home = discovery** (what's relevant/trending now, passive +
  personalized) **vs Explore = deliberate browsing/search/filtering** (active intent). Home never
  becomes a stats dashboard.
- **Information hierarchy (driven by useful data, not decorative widgets):**
  1. **Campus context (top):** active campus + switch; signals that discovery is campus-scoped.
  2. **Trending on my campus** (required): ranked listings/vendors rising now (DISC trending, weighted).
  3. **Useful categories** (required): a few high-signal campus categories to jump into Explore.
  4. **Vendors worth discovering** (required): new/active/relevant vendors on campus.
  5. **Saved/Followed activity** (conditional): "new listing from a vendor you follow", "price change on
     a saved item" — only when there is something; otherwise suppressed (no empty widgets).
  6. **Recent/relevant communication** (conditional): unread message preview/badge → Messages.
  7. **Personalized discovery signals** (conditional): from onboarding interests + behavior (skipped
     onboarding → default to campus-trending, not blank).
  8. **Important notifications** (conditional): platform/account alerts where appropriate (full list on
     PG-SHOP-005).
- **Required content:** campus bar; trending rail; categories; vendors-to-discover; message badge.
- **Optional/conditional content:** saved/followed activity, personalized rail, notification alert,
  recently-viewed (only if present, deduped).
- **Primary actions:** open a listing/vendor; open Messages; switch campus; open a category (→ Explore).
- **Secondary actions:** open Saved/Following; open Profile/Settings; open Notifications; share.
- **Interactive elements:** rails (horizontal scroll/swipe), cards with trust signals, campus selector,
  unread badge, "see all" links into Explore.
- **Key relationships:** ← login/nav; → Explore (deliberate browse), Vendor Storefront, Listing Detail,
  Saved&Following, Messages, Notifications.
- **Editable:** none (read + personalization is derived, not user-authored content).
- **Permissions:** shopper (personalization requires auth; signed-out shows campus-default discovery).
- **Empty state (new shopper):** no history/interests → campus-trending + categories + "explore
  vendors" CTA. Never a blank or a wall of empty rails. Explicit: "Nothing saved yet — here's what's
  hot on {campus}."
- **Loading state:** render campus-default rails instantly from cache; personalization rails fill in
  (skeletons) without blocking the page.
- **Error/recovery (network):** if personalization fails → fall back to campus-trending (degraded, not
  broken); if whole discovery fails → retry with cached last-good; partial rail failure isolated per
  rail (one "couldn't load" + retry, rest render). No fake/skeleton-forever states.
- **Mobile:** vertical stack of swipeable rails; sticky campus bar + bottom nav. **Desktop:** multi-rail
  layout, wider rails, persistent side/nav; same IA.
- **Requirements:** PUB-002, SHOP-003, DISC-001..008 (trending), NOTIF-001. **Flows:** FLOW-SHOP-RET-01,
  FLOW-DISC-HOME/TREND. **Deps:** DISC (trending), MSG (badge), NOTIF.
- **Intentionally excluded:** filter/sort controls (that's Explore); vendor analytics; settings; a
  stats/metrics panel. Home answers "what's worth seeing?" not "what are my numbers?".

### PG-SHOP-002 — Saved & Following  · composite (tabbed) · LOCKED
- **Purpose:** One place for a shopper's saved items and followed vendors.
- **Role:** Shopper. **Required:** two tabs — Saved (vendor/listing saves), Following (vendors). Each
  shows items with trust signals + unsave/unfollow. **Primary:** open item; unsave/unfollow.
  **Perms:** shopper. **Empty:** per-tab "nothing saved/followed yet" + discovery CTA. **Loading:**
  list skeleton. **Error:** retry. **Mobile/Desktop:** list; mobile tabs. **Req:** SHOP-008/009. **Flows:**
  FLOW-SAVE/FOLLOW/UNSAVE/UNFOLLOW.

### PG-SHOP-003 — Profile  · standalone · LOCKED
- **Purpose:** View/edit the shopper's own identity.
- **Role:** Shopper. **Required:** name, photo, campus, linked accounts. **Primary:** edit (→ Settings
  or inline). **Editable:** own profile fields. **Perms:** shopper (self). **States:** standard.
  **Req:** SHOP-013/014, IDN-006/008. **Flows:** FLOW-ACCT-PROFILE. **Excluded:** account/security
  settings (Settings).

### PG-SHOP-004 — Settings  · standalone (consolidated) · LOCKED
- **Purpose:** Consolidated shopper settings — notifications, account, security.
- **Role:** Shopper. **Required:** notification preferences (per event type), account (campus switch,
  linked accounts), security (sessions, logout-all, password change for email accounts). **Primary:**
  toggle/save each. **Editable:** preferences. **Perms:** shopper (self). **Req:** SHOP-014, IDN-006/008.
  **Flows:** FLOW-ACCT-SET/NOTIF/SEC/SESS/PW. **Excluded:** staff functions.

### PG-SHOP-005 — Notifications  · standalone (also panel on Home) · PROVISIONAL
- **Purpose:** Full, filterable notification history.
- **Role:** Shopper. **Required:** list of notifications (message, review, follower, report status,
  verification, etc.) with read/unread + type filter. **Primary:** open source (conversation/report/
  storefront). **Perms:** shopper. **Empty:** "no notifications". **Req:** NOTIF-001. **Flows:** §11
  notif table. **Classification note:** PROVISIONAL — may be panel-primary on Home; full page kept as
  reachable. **Excluded:** sending notifications (system).

---

## 3.5 VENDOR

### PG-VEND-001 — Vendor Dashboard  · standalone · FIRST-CLASS (LOCKED job redefined)
- **Primary job (LOCKED):** **"Tell the vendor how their business is doing and what needs their
  attention."** Answers two questions: **"How is my business doing?"** and **"What should I do next?"**
  — NOT a generic analytics dashboard.
- **Information hierarchy (purpose over layout — do NOT turn every metric into a card):**
  1. **Attention / actions (top, most prominent):** the queue of things needing the vendor *now* —
     unread messages (count + oldest), listing problems (missing photo/price/rejected image),
     incomplete profile/storefront, pending verification, reviews awaiting response (with SLA hint),
     account/platform notices. Each item is actionable → jumps to the right sub-page. If nothing is
     pending, this section explicitly says "All caught up" (not a hidden empty block).
  2. **Business performance (at-a-glance, trended):** listing views, engagement (saves/follows on
     listings), messages received, follower growth — shown as *direction + magnitude over time* (e.g.
     "views ↓12% this week"), not a wall of stat cards. Conditionally: comparison to own prior period.
  3. **Storefront health:** profile completeness %, verification state (verified/pending/action needed),
     open/closed status, listing health (active count, draft/rejected count). A single "health" summary
     + drill-in, not separate cards.
  4. **Recent activity (contextual feed):** recent messages, recent reviews (with respond shortcut),
     recent listing events (new view spikes, new save), meaningful business events (verification granted,
     listing approved). Chronological, skimmable; each row → its source.
  5. **Quick actions:** Create listing · Manage listings · Update storefront · View messages · Respond
     to reviews. Persistent, one tap each.
- **Required content:** attention queue; performance summary (views/messages/followers trended);
  storefront-health summary; recent-activity feed; quick actions.
- **Conditional content:** comparison-to-prior-period (only with enough history); "respond to reviews"
  shortcut (only if pending); campus-level context if multi-campus later.
- **Primary actions:** create listing; respond to top attention item; view messages.
- **Secondary actions:** manage listings; update storefront; view analytics (PG-VEND-004); respond to
  reviews; settings.
- **Interactive elements:** attention queue rows (with state badges), trend mini-visuals (direction +
  magnitude, not charts-for-show), health summary, activity feed, quick-action buttons.
- **Key relationships:** ← vendor login/nav; → Listings (PG-VEND-002/007), Storefront mgmt
  (PG-VEND-003), Analytics (PG-VEND-004), Reviews (PG-VEND-005), Messages (PG-MSG-002), Settings
  (PG-VEND-006), public Storefront (PG-PUB-004).
- **Editable:** none on the dashboard itself (it's a read + act surface); actions navigate to editors.
- **Permissions:** vendor (own business only; ownership enforced).
- **Empty state (brand-new vendor, no listings):** attention queue leads with "Create your first
  listing to go live" + storefront-completeness checklist; performance/activity show "no data yet" with
  guidance (not blank zeros presented as failure).
- **Loading state:** attention queue + health first (most actionable); performance trends and activity
  fill after (skeletons). Never block actions on slow analytics.
- **Error/recovery:** if performance data fails → attention + health still render; failed section shows
  retry (isolated). Save/state actions never lost.
- **Mobile:** stacked — attention queue top, then health, then activity, sticky quick-actions.
  **Desktop:** attention + health left, performance + activity right (or top band of attention +
  columns). Same IA.
- **Requirements:** VEND-002..011, TRUST-008, NOTIF-001/002. **Flows:** FLOW-VEND-01, FLOW-REV-RESP,
  FLOW-LIST-*. **Deps:** MSG (unread), TRUST (verification/health), DISC (views).
- **Intentionally excluded:** deep analytics charts (that's PG-VEND-004); public storefront editing
  (PG-VEND-003); settings (PG-VEND-006). Dashboard *summarizes and routes*, it does not duplicate them.

### PG-VEND-002 — Listings  · standalone (list + entry to create/edit) · LOCKED
- **Purpose:** Manage the vendor's listings as a collection.
- **Role:** Vendor. **Required:** list of own listings (title, price range, status, views, edit/delete
  actions); "Create listing" entry (→ PG-VEND-007). **Primary:** create; open editor; delete. **Secondary:**
  filter by status. **Perms:** vendor (own). **Empty:** "no listings yet" + create CTA. **Req:** VEND-004.
  **Flows:** FLOW-LIST-CREATE/EDIT/REMOVE. **Relationship:** edit = PG-VEND-007 (same route surface,
  distinct experience).

### PG-VEND-007 — Listing Create/Edit  · standalone experience (shares Listings route/surface) · LOCKED as distinct experience
- **Purpose:** The substantial experience of composing or editing one listing. **Explicitly pulled out
  of "Listings" because it is a large product experience, not a minor sub-form.**
- **Role:** Vendor. **Required visible content/fields:**
  - title (req), description (rich), price range (min req, max optional), category (≥1, official
    taxonomy), photo upload (≥1, async moderation), availability (derived from vendor hours or per-listing),
    status (active/inactive).
  - **Conditional:** variants, campus scope (defaults to vendor campus), per-listing hours.
- **Primary actions:** save (create or update); delete (edit mode); preview (→ PG-PUB-005).
- **Secondary actions:** add/remove photo; set primary photo; duplicate (later).
- **Interactive elements:** forms, photo uploader (with moderation progress), category picker, price
  inputs, live preview.
- **Editable:** all fields (vendor's own listing).
- **Permissions:** vendor (own only; ownership enforced).
- **Empty state:** create mode = blank form; edit mode = populated.
- **Loading:** form loads listing data (edit) or blank (create).
- **Error/recovery:** validation inline; image-moderation reject → reason + retry (listing not blocked
  indefinitely); ownership failure → denied; save failure → retry, no data loss.
- **Mobile:** full-screen stepped form. **Desktop:** two-pane (form | live preview).
- **Requirements:** VEND-004, VEND-005, VEND-006 (images). **Flows:** FLOW-LIST-CREATE/EDIT/REMOVE/
  AVAIL. **Dependencies:** VEND-003 (hours), TRUST (moderation), DISC-005 (categories).
- **Intentionally excluded:** checkout/pricing tiers (Phase 2); multi-currency; bulk import.
- **Note:** implementation may reuse `/vendor/listings/:id` surface, but the *experience* is first-class
  and must not be rediscovered mid-build.

### PG-VEND-003 — Storefront Management  · standalone · LOCKED
- **Purpose:** Edit the vendor's public business profile (the Storefront backing PG-PUB-004).
- **Role:** Vendor. **Required:** business name, description, profile photo (moderated), operating hours,
  campus/sub-area, category, socials, contact = native messaging handle. **Primary:** save. **Editable:**
  own. **Perms:** vendor (self). **Empty:** prefilled from onboarding. **Req:** VEND-002/003/007. **Flows:**
  FLOW-VEND-STORE. **Excluded:** listing management (PG-VEND-002/007); analytics.

### PG-VEND-004 — Analytics  · standalone · LOCKED
- **Purpose:** Understand business performance.
- **Role:** Vendor. **Required:** views, messages, followers trends; per-listing performance. **Primary:**
  filter by range. **Perms:** vendor (self). **Empty:** "no data yet" for new vendor. **Req:** VEND-010.
  **Flows:** FLOW-VEND-01. **Excluded:** platform analytics (Staff).

### PG-VEND-005 — Reviews (respond)  · standalone · LOCKED
- **Purpose:** Read shopper reviews and post the one allowed response per review.
- **Role:** Vendor. **Required:** list of reviews (rating, text, author, date), response editor (one per
  review, editable ≤24h). **Primary:** respond. **Perms:** vendor (own). **Empty:** "no reviews yet".
  **Req:** VEND-008, TRUST-003/004/005. **Flows:** FLOW-REV-WRITE/EDIT/RESP. **Excluded:** writing shopper
  reviews (that's on Storefront).

### PG-VEND-006 — Vendor Settings  · standalone (consolidated) · LOCKED
- **Purpose:** Vendor account/social/security settings.
- **Role:** Vendor. **Required:** account (email, linked auth), socials, security (sessions, logout-all),
  notification prefs. **Primary:** save. **Perms:** vendor (self). **Req:** VEND-011. **Flows:**
  FLOW-ACCT-*. **Excluded:** storefront content (PG-VEND-003); listings.

---

## 3.6 MESSAGING

### PG-MSG-001 — Conversation List  · standalone · LOCKED
- **Purpose:** See and open all conversations.
- **Role:** Auth (shopper or vendor). **Required:** threads (participant, last-message preview,
  timestamp, unread count), one row per pair. **Primary:** open thread. **Secondary:** filter/unread.
  **Interactive:** list rows, unread badges. **Relationships:** ← nav/notification; → Conversation view.
  **Perms:** authenticated participant. **Empty:** "no conversations yet" + prompt. **Loading:** list
  skeleton. **Error:** retry. **Mobile:** full-screen list. **Desktop:** left pane of two-pane.
  **Req:** MSG-001..015, IDN-004, NOTIF-001/002. **Flows:** FLOW-MSG-LIST.

### PG-MSG-002 — Conversation View  · standalone · LOCKED
- **Purpose:** Read + send in one thread; the core native-messaging surface.
- **Role:** Auth participant. **Required:** message thread (own/other sides), composer, send states
  (sending/sent/delivered/read/failed), retry affordance, unread→read on view. **Primary:** send; retry
  failed. **Secondary:** report participant; (block if shipped). **Interactive:** composer, message
  bubbles, retry, report. **Relationships:** ← list/contextual/notification; → report flow. **Perms:**
  participant only. **Empty:** "say hi to {vendor}" prompt. **Loading:** thread skeleton; optimistic
  send. **Error/recovery:** send fail → `failed` + retry (never silent loss); thread load fail → retry;
  realtime disconnect → banner + queue; reconnect → reconcile (FLOW-MSG-RECONNECT, §7.11/7.19).
  **Mobile:** single-pane. **Desktop:** right pane of two-pane. **Req:** MSG-001..015, IDN-004,
  NOTIF-001/002. **Flows:** FLOW-MSG-* (7.1–7.20). **Excluded:** WhatsApp (REMOVED); group chat (later).
- **Failure/reconnection states (explicit):** pending (transient connectivity, LOCKED Phase 1), failed
  + retry, offline banner, reconnect reconcile, duplicate-prevention (product LOCKED; mechanism PROPOSED
  TECHNICAL APPROACH per Doc 03 §7.12). Full offline (compose-while-offline-hours) = LATER.

### (new conversation) — contextual experience · LOCKED
- **Purpose:** Start a thread from a storefront/listing without a separate page.
- **Role:** Auth. **Behavior:** "Message vendor" → upsert single conversation → open PG-MSG-002. Unauth
  → Register with return intent. **Req:** MSG-001. **Flows:** FLOW-MSG-START.

---

## 3.7 STAFF (`/staff`, role-scoped) — operational control center, NOT CRUD

The staff area is a **real product surface** — an operations/moderation console — not a set of
database editors. Every staff page answers "what requires attention / what is happening / what action
is appropriate," and every action is **auditable, role-gated, and confirmation-protected**.

### Role-separation matrix (LOCKED structure; Moderator shape OPEN)
Visibility and actions are mapped against **Moderator → Admin → Super Admin**. The Moderator product
decision (exact capability set) remains **OPEN** — it is NOT silently resolved here. The hard rule
(LOCKED): **a Moderator never sees or can invoke Admin/Super-Admin-only functionality**, and **no
staff role can act on a Super Admin account**. What each role can reach:

| Capability | Moderator | Admin | Super Admin |
|---|---|---|---|
| View staff dashboard (role-scoped queues) | ✅ (mod queues) | ✅ | ✅ |
| Triage/action reports (reject/approve/escalate) | ✅ | ✅ | ✅ |
| Vendor verification (set/clear) | ✅ (propose; OPEN if approve-only) | ✅ | ✅ |
| Listing review / takedown | ✅ | ✅ | ✅ |
| User/account actions (suspend/ban within rules) | ✅ (limited scope, OPEN) | ✅ | ✅ |
| Disputes | ✅ (triage) | ✅ (resolve) | ✅ |
| Audit log (read) | ❌ (or read-own, OPEN) | ✅ | ✅ |
| Platform analytics | ❌ (or limited, OPEN) | ✅ | ✅ |
| Configuration (categories/campuses/agreements/featured) | ❌ | ✅ | ✅ |
| Staff invite / role management | ❌ | ✅ (not own SA) | ✅ |
| Act on Super Admin account | ❌ | ❌ | (self only) |
| Impersonate / destructive platform action | ❌ | ❌ (OPEN if any) | ✅ (audit-only) |

"OPEN" cells are explicitly unresolved product decisions (tracked in §22). Everything gated is
enforced by a capability matrix, not by hiding UI.

---

### PG-STAFF-001 — Staff Dashboard  · standalone · LOCKED (operational)
- **Primary job (LOCKED):** **"What requires staff attention right now, and what is happening across
  Voeq?"** An operations triage surface, not a stats homepage.
- **Required content (role-scoped — a moderator sees mod queues only):**
  - **Attention queues (prominent):** pending vendor verifications (count + oldest), reports requiring
    action (count + severity), disputes/issues, suspicious-activity signals, recently-flagged listings,
    account actions awaiting review. Each → its workbench with a deep link.
  - **Platform health indicators:** discovery/messaging throughput, error-rate/anomaly signals, trust
    health (verification backlog, unresolved reports).
  - **Recent moderation activity:** what staff did recently (links to Audit Log).
  - **Important alerts:** platform notices, abuse spikes, escalation flags.
  - **Workload / queue counts:** per-queue volume so leads can see load.
- **Conditional content:** if multi-campus later, campus-scoped queue filters; if moderator, only the
  queues their role permits (no admin/config/audit links shown).
- **Primary actions:** open the highest-priority queue (Reports / Verifications / Disputes).
- **Secondary actions:** jump to Moderation, Analytics, Audit, Config (role-permitted only).
- **Key relationships:** → PG-STAFF-002 (work), PG-STAFF-003 (history), PG-STAFF-004 (metrics),
  PG-STAFF-005 (config, admin+).
- **Editable:** none (read + route to workbenches).
- **Permissions:** staff; queues/panels filtered by capability matrix (moderator sees subset).
- **Empty state:** "All clear — no open items in your queues." Not a blank dashboard.
- **Loading/error:** queues load independently; one failed queue → retry that tile, rest render.
- **Mobile/Desktop:** stacked priority queues (mobile) / multi-queue grid + health strip (desktop);
  role-scoped identically.
- **Requirements:** STAFF-001..017, TRUST-001/006. **Flows:** FLOW-STAFF-01, FLOW-REP-*.

### PG-STAFF-002 — Moderation  · composite workbench · LOCKED (operational; mod scope OPEN)
- **Primary job (LOCKED):** Let a moderator/admin understand and act on trust & safety work with full
  context: **What happened → why flagged → evidence → appropriate action → what happened after.**
- **Operational capabilities (each is a distinct, contextualized workflow, not a CRUD form):**
  1. **Reports:** queue with category, severity, reporter (privacy-respecting), reported target, status;
     filter by category/status/age; "escalate" path.
  2. **Vendor verification:** review submitted identity/business proof; set/clear verified; record
     reason; (Moderator propose-only = OPEN).
  3. **Listing review:** inspect listing + images + vendor; approve / request-changes / takedown with
     reason; see image-moderation flags.
  4. **User/account actions:** suspend / ban within rules; scope limited for Moderator (OPEN); never on
     Super Admin.
  5. **Disputes:** triage (mod) → resolve (admin); capture both sides.
  6. **Moderation history / context:** prior actions on the same target (user/listing/vendor), related
     reports, pattern detection ("repeat offender").
  7. **Evidence/context surrounding an action:** show the report thread, flagged content, reporter
     notes, timestamps — so the actor understands before deciding.
  8. **Action confirmation:** every state-changing action requires explicit confirmation + reason.
  9. **Rejection/approval reasons:** structured reason required; surfaces to the affected user where
     appropriate.
  10. **Escalation & resolution:** escalate to Admin; mark resolved with outcome recorded.
- **Required content:** the selected item with full context panel (evidence + history); action tray
  (confirm + reason); queue navigator; status filters.
- **Primary actions:** approve / reject / takedown / verify / escalate — each confirmation-gated.
- **Secondary actions:** view history, add internal note, reassign/escalate, jump to Audit Log entry.
- **Interactive elements:** queue, context panel, evidence viewer, reason picker, confirm dialog,
  history timeline.
- **Key relationships:** ← Staff Dashboard; → Audit Log (every action logged); → Config (if policy
  change needed).
- **Editable:** moderation state of targets (audit-logged, reason-required).
- **Permissions:** capability-matrix gated (see matrix). **Moderator does NOT see Config/Audit/Analytics
  links** (OPEN scope) and cannot act on Super Admin.
- **Empty state:** "No open items in your queues." Per-queue empty states.
- **Loading/error:** queue + context load independently; action submit shows optimistic + reconcile;
  failure → no state change, retry, reason preserved.
- **Mobile/Desktop:** queue list → detail (mobile); list + context+action split (desktop). Same IA.
- **Requirements:** STAFF-004/005/006/007/008, TRUST-001/003/006. **Flows:** FLOW-STAFF-01, FLOW-REP-*.
- **Excluded:** configuration (PG-STAFF-005), analytics (PG-STAFF-004), anything outside the role's
  authority.

### PG-STAFF-003 — Audit Log  · standalone · LOCKED (accountability/security surface)
- **Primary job (LOCKED):** **"Who did what, to what, when, and why?"** An accountability surface, not a
  table of events.
- **Required content:** each event shows **actor** (with role), **action**, **target** (type + id,
  de-referenced to a human label where safe), **timestamp**, **reason/context**, **affected state
  (before→after where meaningful)**. Filter/search by actor, role, action type, target, date range,
  queue. Deep-link to inspect the related event/target.
- **Primary actions:** inspect an event (see full context/diff); filter/search.
- **Secondary actions:** export (role-permitted), jump to the moderated target.
- **Interactive elements:** searchable/filterable log, event detail drawer (actor, reason, state diff,
  linked target).
- **Key relationships:** ← every staff action (written here); ← Staff Dashboard "recent activity".
- **Editable:** none (append-only; corrections are new entries, never edits).
- **Permissions:** Admin/Super Admin (Moderator read = OPEN). Sensitive fields (e.g. reporter
  identity, PII) masked by role; PII access is itself an audited, restricted capability.
- **Empty state:** "No events match this filter." (Not "no activity ever" unless truly empty.)
- **Loading/error:** paged; filter failure → revert to last valid view + message.
- **Mobile/Desktop:** list + detail drawer (both); columns adapt.
- **Requirements:** STAFF-009. **Flows:** FLOW-STAFF-01. **Excluded:** editing history (immutable);
  exposing unrestricted PII.

### PG-STAFF-004 — Platform Analytics  · standalone · LOCKED (operational + product metrics)
- **Primary job (LOCKED):** Help staff understand Voeq's health and make decisions — distinguish
  **operational metrics** (is the platform working?) from **product/business analytics** (is it
  growing/healthy?). No vanity metrics.
- **Required content, mapped to the decision it supports:**
  - **Operational:** discovery activity (searches/views), messaging activity (threads/send-fail rate),
    reviews volume, reports volume + backlog, verification backlog, error/anomaly signals. *Decision: is
    the platform functioning and safe right now?*
  - **Product/business:** shoppers, vendors, **active vendors** (defined: ≥1 live listing / recent
    activity), listings (live/draft/rejected), campus activity (per-campus engagement), growth/trends
    (new shoppers/vendors over time, retention signals). *Decision: is Voeq growing and where?*
  - **Trust:** verification rate, report resolution time, dispute rate. *Decision: is trust improving?*
- **Conditional content:** per-campus breakdown (if multi-campus); cohort/retention (later).
- **Primary actions:** filter by campus/date range; drill into a metric → underlying records (e.g. a
  spike in reports → the reports).
- **Secondary actions:** export (role-permitted).
- **Interactive elements:** metric tiles grouped Operational vs Product; drill-down; trend views.
- **Key relationships:** ← Staff Dashboard health strip; feeds moderation prioritization.
- **Editable:** none (read-only metrics).
- **Permissions:** Admin/Super Admin (Moderator = OPEN, likely limited operational only).
- **Empty state:** "Not enough data yet" for new metrics (pilot) — explicit, not zero-as-failure.
- **Loading/error:** metrics independent; one failing metric → retry that tile.
- **Mobile/Desktop:** stacked grouped metrics (mobile) / grouped dashboard (desktop).
- **Requirements:** STAFF-010. **Flows:** FLOW-STAFF-01. **Excluded:** vendor-specific analytics
  (PG-VEND-004); vanity counts presented without a decision.

### PG-STAFF-005 — Configuration  · standalone · LOCKED (controlled administrative system)
- **Primary job (LOCKED):** A **controlled** system for platform-level configuration — never "edit the
  database" freedom.
- **Required managed experiences:**
  - **Categories:** official taxonomy CRUD (create/rename/retire; retiring re-maps listings). Validation:
    unique, non-empty, slug-safe.
  - **Campuses/Institutions:** add/activate/deactivate campuses; scope rules.
  - **Agreements:** versioned TOS / Privacy / Vendor Agreement — create new version, set active, never
    overwrite history (versioned, LOCKED from Doc 01/02).
  - **Featured content:** curated placements (vendor/listing/category) with scheduling.
  - **Staff invite / roles** (STAFF-012, build OPEN): invite, assign role within matrix, never grant SA
    casually.
  - **Potentially feature flags** (if still in scope — OPEN): toggle with description + owner + audit.
- **For every action define:** **who can modify** (admin/super-admin, per item), **confirmation
  requirements** (destructive = explicit confirm + reason), **destructive-action protection** (retire/
  deactivate asks for impact preview — "N listings affected"), **auditability** (every change → Audit
  Log), **validation** (slug-safe, non-duplicate, referential integrity), **empty states** ("no
  categories yet" → seed guidance), **error/recovery** (failed save → no partial commit, retry, reason
  preserved).
- **Primary actions:** create / edit / retire each config type (confirmation + reason gated).
- **Secondary actions:** preview impact, view history of a config item, export.
- **Interactive elements:** typed editors per config type, impact-preview dialogs, confirmation modals
  with reason, change history per item.
- **Key relationships:** changes propagate to discovery (categories/campuses/featured), to legal
  (agreements), to staff (roles); every change logged to PG-STAFF-003.
- **Editable:** platform config (admin/super-admin only; matrix-enforced).
- **Permissions:** Admin/Super Admin (Moderator: none). Super Admin only for role/SA-affecting changes.
- **Empty/loading/error:** per-type; destructive ops never silent.
- **Mobile/Desktop:** forms adapt; confirmations identical.
- **Requirements:** STAFF-014/015/016/017, STAFF-012 (OPEN build). **Flows:** FLOW-STAFF-01.
  **Excluded:** arbitrary DB editing; vendor-specific settings (those are VENDOR area).

---



## 3.8 PHASE 1 COUNT (post-audit)

**35 experiences** (one added: PG-VEND-007 Listing Create/Edit, pulled from PG-VEND-002):
Public 10 (incl. Press=LATER) · Auth 4 · Onboarding 2 · Shopper 5 · Vendor **7** (was 6) · Messaging 2
(+1 contextual, non-page) · Staff 5.
Phase 1 **active pages = 34** (Press deferred), of which **PG-VEND-007 is newly distinct**. Non-page
experiences: verify/OTP (state), new-conversation (contextual).

---

# 4. PUBLIC INFORMATION ARCHITECTURE

- **PG-PUB-001 Landing** → primary CTA "Explore {campus}" → PG-PUB-002. Also links to For-Vendors,
  About, legal.
- **PG-PUB-002 Explore** is the heart: browse grid + trending-on-campus + recently-viewed + search
  box + filters (campus/category/price/rating/verified). Search is a *mode* of Explore (query in URL),
  not a separate page (consolidation).
- **PG-PUB-003 Category** = Explore pre-filtered by a category slug. Reuses Explore's surface.
- **PG-PUB-004 Vendor storefront** and **PG-PUB-005 Listing detail** are the deep public pages; both
  expose the "Message vendor" contextual entry to PG-MSG-002.
- **Legal/info (006–010):** About/Terms/T隐私/Privacy/Help/For-Vendors. **Challenge result:** Help
  kept (SHOULD) because campus users need how-to; For-Vendors kept (SHOULD) as the vendor acquisition
  surface. Press deferred (LATER) — not needed at pilot. No "Contact us" separate page (folded into
  Help); messaging is in-app.

---

# 5. AUTH INFORMATION ARCHITECTURE

- **Before auth:** anonymous on PUBLIC. "Message vendor" / "Become a vendor" / "Save" trigger auth.
- **PG-AUTH-001 Register** → verify (state) → post-auth gates (consent IDN-009 → campus IDN-010) →
  onboarding (PG-ONB-001/002) → destination.
- **PG-AUTH-002 Login** → session → intended destination (deep link preserved, §11).
- **PG-AUTH-003 Recover** → reset → login.
- **PG-AUTH-004 Account state** = suspended/banned/deleted notice + appeal (from FLOW-AUTH-SUSPEND/
  BAN/DEL). Not a nav destination; reached when auth is blocked.
- **Errors/unauthorized/forbidden** = component-level states (§15), not standalone pages.
- **After auth:** shopper → PG-SHOP-001; vendor → PG-ONB-002 then PG-VEND-001; staff → PG-STAFF-001.

---

# 6. ONBOARDING ARCHITECTURE

- **PG-ONB-001 Shopper:** single screen, post-auth, skippable; captures feed interests. Exit →
  PG-SHOP-001.
- **PG-ONB-002 Vendor (5 steps):** one wizard experience (not 5 pages). Steps: (1) business identity,
  (2) campus & presence, (3) contact + identity photo, (4) first listing, (5) review & go-live. Nav
  hidden during onboarding; progress saved; exit/resume supported. Exit (on complete) → PG-VEND-001.
  Exact step contents PROVISIONAL (count LOCKED, VEND-001).

---

# 7. SHOPPER ARCHITECTURE

Hierarchy: **Home** is the anchor. **Saved & Following** consolidates the two legacy list pages into
one tabbed experience (reduces fragmentation). **Profile** and **Settings** are separate (settings
consolidates notification/account/security). **Notifications** is a full list (PROVISIONAL: also
reachable as a panel/badge on Home).

- PG-SHOP-001 Home ← entry from login, bottom-nav "Home".
- PG-SHOP-002 Saved & Following ← bottom-nav "Saved" (tabs).
- PG-SHOP-003 Profile ← from Home avatar.
- PG-SHOP-004 Settings ← from Profile.
- PG-SHOP-005 Notifications ← from bell.

**Challenge result:** "My reviews" is NOT a separate page — writing/editing reviews happens in context
on the vendor storefront (PG-PUB-004). This removes a legacy dead-end page.

---

# 8. VENDOR ARCHITECTURE

Vendor's **public** storefront is PG-PUB-004 (PUBLIC area). The **management** side is the VENDOR area:

- PG-VEND-001 Dashboard (anchor, bottom-nav "Business" when vendor).
- PG-VEND-002 Listings: list + create; edit is `/vendor/listings/:id` (same surface, not a new page
  type).
- PG-VEND-003 Storefront management (profile/hours/photo).
- PG-VEND-004 Analytics.
- PG-VEND-005 Reviews (respond) — vendor's reviews + one response; consolidated (legacy had scattered
  review UIs).
- PG-VEND-006 Vendor settings (account/socials).

**Avoid fragmentation:** no separate "verification page" — verification state shows on Dashboard +
Storefront management (TRUST-001). No separate "messages" page for vendors — uses PG-MSG (shared
messaging area).

---

# 9. MESSAGING ARCHITECTURE

**Determination (from flows): BOTH.**
- **Top-level entry:** PG-MSG-001 Conversation list, reachable via bottom-nav "Messages" (badge =
  unread). Desktop: two-pane (list | thread) within the same route.
- **Contextual entry:** "Message vendor" on PG-PUB-004 / PG-PUB-005 opens PG-MSG-002 (existing thread
  or new). Notification tap → PG-MSG-002.
- **New conversation** is not a page — it's the act of messaging a vendor from context; the thread
  opens in PG-MSG-002.
- **Coherence:** mobile = single-pane (list → thread), desktop = two-pane. Same IA, different density
  (§16). One conversation per pair (MSG-001).

---

# 10. STAFF ARCHITECTURE

Surface at `/staff`, role-scoped. Consolidated into 5 pages (legacy had many admin sub-pages):
- **PG-STAFF-001 Dashboard** — overview + open queues.
- **PG-STAFF-002 Moderation** — the workbench: reports queue + vendor verification action + user
  management + listing moderation as scoped sub-views. Moderator gets this with reduced authority
  (cannot touch staff/config/audit); Admin/SA get full. (Moderator role shape remains OPEN — we do
  NOT invent extra moderator pages; capability matrix governs visibility.)
- **PG-STAFF-003 Audit log** — Admin/SA.
- **PG-STAFF-004 Platform analytics** — Admin/SA.
- **PG-STAFF-005 Configuration** — categories, campuses, agreements, featured; staff invite lives
  here (STAFF-012, OPEN build).

---

# 11. NAVIGATION MODEL

### Desktop
- **Public:** top header (logo, Explore, campus selector, Search, For-Vendors, Login/Sign-up or
  avatar). No heavy nav.
- **Authenticated app:** left or top app nav with: Explore (public), Home (you), Messages, [Business
  if vendor], avatar → Profile/Settings. Staff → separate `/staff` entry.
### Mobile
- **Bottom navigation** (unified across roles — fixes legacy inconsistency): Explore · Home ·
  Messages · [Business if vendor] · You (avatar). Public users see Explore + For-Vendors + Login.
### Contextual navigation
- "Message vendor" (storefront/listing) → thread. "Save"/"Follow" inline. Filters as explore query.
### Breadcrumbs
- Used on Vendor management sub-views and Staff (Business ▸ Listings ▸ Edit). Public browse uses
  campus/context, not heavy breadcrumbs.
### Back behavior
- Browser/OS back returns to previous surface; in-page "back" in wizards/onboarding returns to prior
  step (PG-ONB-002).
### Deep-link behavior
- Any public page deep-links directly (SEO/share). Authenticated deep-link → if unauthed, PG-AUTH-002
  with `?next=`; after auth, lands on target.
### Authentication redirects
- Protected route → PG-AUTH-002 `?next=<intended>`; return intent preserved for messaging/compose
  (FLOW-MSG-START). No destination loss.

---

# 12. URL / ROUTE CONCEPT (not framework routing)

Human-readable, stable, shallow, SEO-friendly where public:

```
voeq.ng/                              Landing (PG-PUB-001)
voeq.ng/explore                       Explore + search (PG-PUB-002)  ?cat=&campus=&q=&sort=&min=&max=&verified=
voeq.ng/c/:categorySlug              Category (PG-PUB-003)
voeq.ng/v/:vendorHandle              Vendor storefront (PG-PUB-004)
voeq.ng/l/:listingId                 Listing detail (PG-PUB-005)
voeq.ng/about  /terms  /privacy  /help  /vendors   Legal/info (006–010)
voeq.ng/press                       Press (LATER, 011)

voeq.ng/register  /login  /recover   Auth (PG-AUTH-001..003)
voeq.ng/account-state                Suspended/banned/deleted (PG-AUTH-004)

voeq.ng/you                          Shopper home (PG-SHOP-001)
voeq.ng/you/saved                    Saved & Following (PG-SHOP-002)
voeq.ng/you/profile                  Profile (PG-SHOP-003)
voeq.ng/you/settings                 Settings (PG-SHOP-004)
voeq.ng/you/notifications            Notifications (PG-SHOP-005)

voeq.ng/vendor                       Vendor dashboard (PG-VEND-001)
voeq.ng/vendor/listings              Listings (PG-VEND-002)
voeq.ng/vendor/listings/:id          Listing edit (PG-VEND-002 state)
voeq.ng/vendor/storefront            Storefront mgmt (PG-VEND-003)
voeq.ng/vendor/analytics             Analytics (PG-VEND-004)
voeq.ng/vendor/reviews               Reviews respond (PG-VEND-005)
voeq.ng/vendor/settings              Vendor settings (PG-VEND-006)

voeq.ng/messages                     Conversation list (PG-MSG-001)
voeq.ng/messages/:conversationId     Conversation view (PG-MSG-002)

voeq.ng/staff                        Staff dashboard (PG-STAFF-001)
voeq.ng/staff/moderation             Moderation (PG-STAFF-002)
voeq.ng/staff/audit                  Audit (PG-STAFF-003)
voeq.ng/staff/analytics              Platform analytics (PG-STAFF-004)
voeq.ng/staff/config                 Configuration (PG-STAFF-005)
```

Future-compatible: Phase 2 payments attach as `/checkout` or order routes without disturbing the
above. Multi-campus uses campus *scope* (header), not URL nesting.

---

# 13. PAGE RELATIONSHIP MAP

```
PUBLIC
├─ Landing → Explore
├─ Explore ⇄ Category ⇄ (filters) → Vendor storefront → Listing detail
├─ Vendor storefront ⇄ Listing detail
├─ Legal/info (About/Terms/Privacy/Help/For-Vendors) ← anywhere
│
AUTH (gate)
├─ Register → verify(state) → gates → Onboarding → destination
├─ Login → destination (?next=)
├─ Recover → Login
├─ Account state (reachable when blocked)
│
ONBOARDING (transient)
├─ Shopper onboarding → Shopper home
├─ Vendor 5-step → Vendor dashboard
│
SHOPPER (authed)
├─ Home → Saved&Following / Profile / Notifications / Messages
├─ Saved&Following → Vendor storefront / Listing detail
├─ Profile → Settings
├─ Settings → (account/security/notifications)
│
VENDOR (authed, vendor)
├─ Dashboard → Listings / Storefront / Analytics / Reviews / Settings
├─ Listings → Listing edit
│
MESSAGING (authed)
├─ Conversation list → Conversation view
├─ Contextual entry from Vendor storefront / Listing detail / Notification
│
STAFF (/staff, role-scoped)
├─ Dashboard → Moderation / Audit / Analytics / Config
```

---

# 14. ENTRY / EXIT ANALYSIS

| Page | Arrives from | Exits to | Issues found / fixed |
|---|---|---|---|
| Landing | direct/link | Explore, For-Vendors, legal | None |
| Explore | Landing, nav, search, category | Vendor, Listing, Category | Search folded in (no orphan) |
| Vendor storefront | Explore, Listing, Search, Message | Listing, Message, Save/Follow | None |
| Listing detail | Vendor, Explore, Search | Vendor, Message | None |
| Auth pages | any gated action / direct | destination via ?next | Deep-link return preserved |
| Shopper home | login / nav | saved, profile, msgs, notifications | None |
| Vendor dashboard | vendor login / nav | all vendor pages | None |
| Messages | nav, contextual, notification | thread, back to list | None |
| Staff | staff login | staff sub-pages | None |

**Dead ends eliminated:** legacy "My reviews" page removed (contextual). "Contact us" removed (Help +
in-app messaging). No placeholder/"coming soon" pages (REMOVED list). Every authenticated page has a
nav escape to Home/Explore.

---

# 15. EMPTY / ERROR / STATE EXPERIENCES

Determined per page; classified page-level / component-level / contextual.

| State | Level | Where |
|---|---|---|
| Loading | component/page | Explore grid, thread, lists (skeletons) |
| Empty | page/component | Explore (no vendors on campus → explicit CTA), Saves (empty), Messages (no convos), Vendor listings (none) |
| Error | page/component | Explore fetch fail → retry; thread load fail → retry |
| Unauthorized | component/redirect | Protected route → PG-AUTH-002 `?next=` |
| Forbidden | component | 403 → "no access" → safe redirect |
| Unavailable | page | Vendor/listing suspended/deleted → "unavailable" (PG-PUB-004/005) |
| Offline | banner/component | Messaging + actions queue; banner "reconnecting" |
| Suspended / Banned / Deleted | page | PG-AUTH-004 account-state |
| Not found | page | 404 → helpful + way back (no stack trace) |

No page ships without its required states designed (links to §13 error matrix in Doc 03).

---

# 16. RESPONSIVE INFORMATION ARCHITECTURE

Same IA, different density — NOT two products.
- **Mobile:** bottom-nav (Explore/Home/Messages/[Business]/You). Explore = single column. Messages =
  single-pane. Vendor/Staff = stacked cards / bottom-sheet forms.
- **Tablet:** Explore 2-up grid; Messages two-pane on landscape; nav bottom or side.
- **Desktop:** Explore multi-column; Messages persistent two-pane; Vendor/Staff full layouts + side
  panels; breadcrumbs on sub-views.
- **Coherence rule:** navigation structure, URLs, and page set are identical across breakpoints; only
  layout/panels change.

---

# 17. SEO / PUBLIC DISCOVERY

Indexable public surfaces: **Landing, Explore, Category, Vendor storefront, Listing detail** (and
legal). These should be crawlable, have stable URLs (§12), and meaningful `<title>`/meta (implementation
later). Authenticated surfaces (Shopper/Vendor/Messages/Staff) are not indexed. For-Vendors indexable
(acquisition). Press LATER.

---

# 18. REQUIREMENT TRACEABILITY

Every page ← Doc 02 requirement ID + Doc 03 flow ID. (Selection; full mapping is the ID crosswalk.)

| Page | Doc 02 Req IDs | Doc 03 Flow IDs |
|---|---|---|
| PG-PUB-001 | PUB-001 | FLOW-SHOP-NEW-01, FLOW-DISC-HOME |
| PG-PUB-002 | PUB-002, DISC-001..008 | FLOW-DISC-HOME/SEARCH/FILTER/SORT/TREND |
| PG-PUB-003 | PUB-004, DISC-005 | FLOW-DISC-CAT |
| PG-PUB-004 | PUB-005, VEND-002, TRUST-007 | FLOW-VEND-STORE, FLOW-MSG-START |
| PG-PUB-005 | PUB-006, VEND-004 | FLOW-LIST-DETAIL, FLOW-MSG-START |
| PG-PUB-006..010 | PUB-007..011 | — |
| PG-AUTH-001..004 | IDN-001..011 | FLOW-AUTH-REG/LOGIN/RECOVER/SUSPEND/BAN/DEL, FLOW-AUTH-DUP, FLOW-AUTH-SINGLE |
| PG-ONB-001 | SHOP-001, IDN-009/010 | FLOW-ONB-SHOP |
| PG-ONB-002 | VEND-001, IDN-008, STAFF-017 | FLOW-ONB-VEND |
| PG-SHOP-001 | SHOP-003, NOTIF-001 | FLOW-SHOP-RET-01 |
| PG-SHOP-002 | SHOP-008/009 | FLOW-SAVE/FOLLOW |
| PG-SHOP-003/004 | SHOP-013/014, IDN-006/008 | FLOW-ACCT-* |
| PG-SHOP-005 | NOTIF-001 | §11 notif table |
| PG-VEND-001..006 | VEND-002..011, TRUST-008 | FLOW-VEND-01 |
| PG-VEND-007 | VEND-004, VEND-005, VEND-006 | FLOW-LIST-CREATE/EDIT/REMOVE/AVAIL |
| PG-MSG-001/002 | MSG-001..015, IDN-004, NOTIF-001/002 | FLOW-MSG-* (7.1–7.20) |
| PG-STAFF-001..005 | STAFF-001..017 | FLOW-STAFF-01 |

**Requirements/flows with NO page yet (intentionally):** FUT-* (Phase 2 payments/logistics) — no pages
(awareness only). TRUST-010 (internal trust score) — not a page, a signal. NOTIF-004 (push) — LATER.
All Phase 1 MUST requirements map to a page/experience.

---

# 19. LEGACY COMPARISON

Legacy routes are evidence; the new IA does not reproduce obsolete structure.

| Legacy experience | New experience | Decision | Reason |
|---|---|---|---|
| `/` landing | PG-PUB-001 | KEEP (re-expressed) | Still the entry. |
| Browse/discovery (legacy `/explore` or home) | PG-PUB-002 Explore (search folded in) | CHANGE | Search merged into Explore; weighted trending. |
| Legacy category routes | PG-PUB-003 Category | KEEP (re-expressed) | Same need. |
| `/vendor/:id` storefront | PG-PUB-004 | KEEP | Core. |
| `/listing/:id` | PG-PUB-005 | KEEP | Core. |
| WhatsApp "chat" buttons | Native "Message vendor" → PG-MSG-002 | CHANGE→REMOVE | WhatsApp REMOVED; native messaging. |
| `/auth/*` (cross-domain) | PG-AUTH-001..004 (single coherent) | CHANGE | Cross-domain auth redesigned (FLOW-AUTH-SINGLE). |
| Legacy 4-step vendor onboarding | PG-ONB-002 (5-step) | CHANGE | Founder: 5 steps. |
| Legacy shopper "buyer" pages | PG-SHOP-* (Shopper) | CHANGE | Terminology buyer→shopper; consolidated. |
| Legacy multiple settings pages | PG-SHOP-004 / PG-VEND-006 (consolidated) | CONSOLIDATE | One settings experience per role. |
| Legacy "My reviews" page | Removed; contextual on storefront | REMOVE | Dead-end; reviews in context. |
| Legacy moderator (backend only, no UI) | PG-STAFF-002 (scope OPEN) | CHANGE | Must have a UI; role shape OPEN. |
| Legacy admin (many sub-pages) | PG-STAFF-001..005 (5) | CONSOLIDATE | Fewer, better staff pages. |
| Legacy listing create/edit (buried in listings mgmt) | PG-VEND-007 (distinct experience) | CHANGE | Pulled out — it is a large product experience, not a sub-form. |
| `/admin/backup/trigger`, `/cron/tick`, `/test/db` | REMOVED | REMOVE | Unauthenticated privileged endpoints (REM-005). |
| Events / Housing / Waybill | REMOVED | REMOVE | "Coming soon" stubs (REM-002..004). |
| Generic "coming soon" pages | None | REMOVE | No dead-end promises (REM-006). |

---

# 20. PAGE CONSOLIDATION (explicit)

- **Search → Explore** (one surface, query in URL). Removed a standalone search page.
- **Category → Explore pre-filtered** (reuses Explore; not a separate architecture).
- **Saves + Follows → one tabbed page** (PG-SHOP-002). Removed a second list page.
- **Settings consolidated** per role (notification + account + security in one; legacy had several).
- **Vendor reviews → one page** (PG-VEND-005) instead of scattered review UIs.
- **Staff → 5 pages** from many legacy admin routes (dashboard/moderation/audit/analytics/config).
- **"My reviews" removed** (contextual). **"Contact us" removed** (Help + in-app messaging).
- **Verify/OTP → state within Register/Login** (not a page). **New conversation → contextual action**
  (not a page).
- **Listing Create/Edit → distinct experience (PG-VEND-007)** pulled out of PG-VEND-002, because it is
  a substantial product experience (photo upload + moderation, rich description, price range, category
  picker, live preview). It may share the `/vendor/listings/:id` *route/surface* at implementation
  time, but as IA it is first-class so a build batch can scope it without rediscovery.
- **Net effect:** legacy had 50+ experiences; new Phase 1 = **34 pages + 2 states/actions** (one page
  added vs prior count because Listing Create/Edit is now explicit). Reduction is intentional and good.

### Re-audit conclusion (page-classification challenge)
- **Genuinely distinct pages (KEPT):** all 34 — each has a clearly understood *job* after this audit.
- **Route variant (not separate architecture):** PG-PUB-003 Category (shares PG-PUB-002).
- **Composite pages:** PG-ONB-002 (wizard), PG-SHOP-002 (tabbed), PG-STAFF-002 (sub-views).
- **Contextual experience (non-page):** new conversation.
- **Modal/state (non-page):** verify/OTP.
- **Newly separated:** PG-VEND-007 (was hidden in Listings).
- **No pages removed or further consolidated** in this pass — prior consolidation already achieved the
  "fewer, better" goal; the weakness was *shallow definition*, now corrected per page.

---

# 21. BUILD-BATCH IMPLICATIONS (natural vertical slices, not final plan)

Groups of pages that form coherent future batches (aligns with Doc 01 build philosophy):
- **B-PUB-FOUNDATION:** PG-PUB-001..005 + legal (public shell + discovery + SEO).
- **B-AUTH:** PG-AUTH-001..004 + states (FLOW-AUTH-*).
- **B-ONB:** PG-ONB-001/002.
- **B-SHOPPER:** PG-SHOP-001..005.
- **B-VENDOR:** PG-VEND-001..007 (incl. Listing Create/Edit).
- **B-MESSAGING:** PG-MSG-001/002 + realtime + states (FLOW-MSG-*).
- **B-TRUST (cross-cutting):** reviews/ratings/verification/reporting — attaches to discovery + vendor
  + staff.
- **B-STAFF:** PG-STAFF-001..005.

These are candidate slices, not the locked batch plan (Doc 01 §5 example, re-expressed).

---

# 22. OPEN / PROVISIONAL IA DECISIONS

| # | Decision | Label | Note |
|---|---|---|---|
| 1 | Messages as both top-level + contextual | **LOCKED (both)** | From flows §9. |
| 2 | "Shopper" area name ("You" vs "Home") | **OPEN** | Concept LOCKED; label later. |
| 3 | Vendor entry in nav (shows "Business" when vendor) | **LOCKED** | Role-based nav. |
| 4 | Staff as `/staff` path vs subdomain | **PROVISIONAL** (IA uses path; hosting = architecture later) | §12 uses path. |
| 5 | Notifications as page vs panel-only | **PROVISIONAL** | PG-SHOP-005 kept but may be panel-primary. |
| 6 | Multi-campus at launch (URL campus scope vs none) | **OPEN** | FUT-003; affects Explore scope only. |
| 7 | Moderator role shape (exact capabilities) | **OPEN** | Resolved ONLY as a structure in §3.7 matrix; the specific Moderator permissions (verify approve-only? audit/analytics read? user-action scope?) remain OPEN. Do not invent moderator pages or silently grant Admin/Super-Admin functions. |
| 8 | Category URL slug strategy (`:slug` source) | **OPEN** (minor) | Implementation later. |
| 9 | Account deletion page vs in-settings flow | **OPEN** | §12.6 policy OPEN. |
| 10 | Listing Create/Edit sharing the Listings route/surface (PG-VEND-007 reuse `/vendor/listings/:id`) | **OPEN** | Product: distinct experience (LOCKED). Implementation surface reuse = architecture decision; flagged so build doesn't assume a separate route. |
| 11 | Moderator read access to Audit Log / Platform Analytics | **OPEN** | §3.7 marks these ❌ or limited (OPEN) for Moderator. Decide before build. |
| 12 | Feature flags as a Configuration experience | **OPEN** | In scope only if still needed; toggles must be audit+owner+description gated. |
| 13 | Super-Admin-only destructive actions (impersonate, platform wipe) | **OPEN** | §3.7 marks ✅ (audit-only) for SA; confirm which exist and their guardrails. |

All other IA elements are LOCKED or derived from LOCKED product decisions.

---

# 23. CONTRADICTIONS / NOTES

- Legacy **cross-domain auth** (URL-query token, API-domain impersonation cookie) is NOT reproduced;
  new auth is one coherent experience (FLOW-AUTH-SINGLE, LOCKED). IA reflects single `/login` + `?next`.
- Legacy **many admin/settings pages** contradict the consolidation principle; new IA consolidates
  (§20). This is a deliberate departure, not an oversight.
- Legacy **WhatsApp-dependent contact** removed; all contact resolves to PG-MSG-002 (native).
- Legacy **unauthenticated endpoints / Events / Housing / Waybill / coming-soon** are absent from the
  map (REMOVED).
- Staff area is treated as an **operational control center** (§3.7), not CRUD — consistent with the
  founder correction. The Moderator role is modeled as a **capability matrix** (Moderator→Admin→Super
  Admin) with the Moderator's exact scope left **OPEN** (§22 #7/#11); it is NOT silently merged into
  Admin and never reaches Super-Admin accounts.

---

# 24. LOCK-READY OUTPUT (final page-definition audit)

1. **Final Phase 1 page/experience count:** **35 experiences = 34 active pages + 2 non-page
   (verify/OTP state, new-conversation contextual).** Public 10 (Press=LATER, not active) · Auth 4 ·
   Onboarding 2 · Shopper 5 · Vendor 7 · Messaging 2 (+1 contextual) · Staff 5. The prior "34" total
   under-counted Listing Create/Edit (it was folded into Listings); it is now explicit as PG-VEND-007.
2. **Pages added:** PG-VEND-007 (Listing Create/Edit), separated from PG-VEND-002.
3. **Pages removed:** none in this pass (prior removals stand: WhatsApp contact, Events/Housing/
   Waybill, unauthenticated endpoints, "coming soon", legacy "My reviews"/"Contact us").
4. **Pages consolidated:** none further (consolidation was already achieved; this pass fixed
   *shallow definition*, not count). Prior consolidations unchanged (Search→Explore, Category→Explore
   variant, Saves+Follows tabbed, per-role Settings, Staff 5 pages).
5. **Pages whose classification changed:** PG-PUB-003 confirmed as **route variant** (not separate
   architecture); PG-VEND-007 reclassified from "sub-part of Listings" to **distinct first-class
   experience**; PG-ONB-002 / PG-SHOP-002 / PG-STAFF-002 explicitly tagged **composite**.
6. **Substantially expanded definitions (this targeted pass):** **PG-SHOP-001** (Shopper Home — now a
   living campus-discovery surface with explicit job "show what's worth discovering now," hard split
   from Explore, conditional rails, degraded-mode recovery); **PG-VEND-001** (Vendor Dashboard — now an
   attention-then-performance-then-health hierarchy answering "how is my business doing / what next,"
   not a stats wall); **all five Staff pages** (PG-STAFF-001 operational triage; PG-STAFF-002 a
   contextual moderation workbench with evidence/confirmation/escalation; PG-STAFF-003 an
   accountability surface; PG-STAFF-004 operational-vs-product metrics; PG-STAFF-005 a controlled
   config system) plus an explicit **Moderator→Admin→Super Admin capability matrix**. The Staff area is
   now framed as an operations console, not CRUD, per the founder correction.
7. **Remaining OPEN/PROVISIONAL decisions:** §22 rows 1–13 — product-shaping only (shopper label #2,
   multi-campus #6, moderator scope #7/#11, category slug #8, account-deletion #9, listing-edit surface
   #10, feature-flags #12, SA destructive actions #13), plus PROVISIONAL: staff path-vs-subdomain #4,
   Notifications page-vs-panel #5. No implementation is locked.
8. **Contradictions with Documents 01–03:** none introduced; consistent (see §23).
9. **Pages that should still be consolidated/removed:** none. The inventory is stable; further change
   would be churn, not improvement.
10. **READY TO LOCK?** **YES — subject to your final review of the OPEN items in §22.** Every meaningful
    page now has a clearly understood *job* and is traceable to Doc 02/03, including the three areas you
    flagged (Shopper Home, Vendor Dashboard, Staff). All locked decisions from prior passes are
    preserved. The only un-LOCKED items are genuine founder calls (labels, moderator scope, multi-campus,
    surface reuse) — none block locking the IA structure. **Recommend locking after this review, then
    moving to architecture/build-batch planning.**

---

**END OF 04-INFORMATION_ARCHITECTURE_AND_PAGE_MAP.** IA bridge only. Feeds Design, Architecture, and
Build Batches. No UI, components, routes-as-code, database, or implementation specified. No other
files modified.
