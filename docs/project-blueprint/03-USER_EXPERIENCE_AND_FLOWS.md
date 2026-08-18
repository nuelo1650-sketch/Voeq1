# 03-USER_EXPERIENCE_AND_FLOWS.md — Voeq Rebuild

> **Status:** EXPERIENCE SPECIFICATION ONLY. Not UI design. Not components. Not architecture. Not
> code. Not implementation.
> **Purpose:** Defines HOW users move through Voeq so that Information Architecture, Page Map, UI
> Design, Architecture, API Contracts, Testing, and Build Batches can all reference these flows
> unambiguously.
> **Inputs (authoritative):** `01-PRODUCT_DECISIONS.md`, `02-PRODUCT_SCOPE_AND_REQUIREMENTS.md`
> (stable IDs VOEQ-* used throughout), legacy recovery `docs/product-recovery/batch-01/` (evidence,
> not spec).
> **Rule:** Current founder decisions override legacy behavior. Where legacy flow contradicted the
> new direction (WhatsApp, "verified purchase", raw-view trending, dead states), the new flow is
> specified and the contradiction noted (§19).
> **Domain:** voeq.ng · **Terminology:** Shopper (not buyer) · **WhatsApp REMOVED** · **Native
> messaging is the contact channel** · **Phase 1 = discovery + communication** · **Payments = Phase 2**.

---

# 1. EXPERIENCE PRINCIPLES

Ten principles governing every flow. Each is a decision, not filler.

1. **Speed is a feature, not a metric.** Discovery must feel instant on a low-end Android over 3G.
   Optimistic UI where safe; never a spinner that hides nothing. *(Req: SHOP-003, DISC-008, PRINCIPLE
   #5 fast-by-default.)*
2. **Trust is visible before anything else.** On every vendor/listing surface, the first thing a
   shopper sees is the trust state (verified? rating? responds in ~Xh? open now?), not a CTA. *(Req:
   TRUST-001/007, PRINCIPLE #2 trust-before-transaction.)*
3. **Campus context is always on.** Every discovery surface is scoped to "my campus" by default and
   shows that scope explicitly. A user should never wonder which campus they're browsing. *(Req:
   DISC-004, IDN-010, PRINCIPLE #3 campus-native.)*
4. **Progressive disclosure.** Landing → discovery → detail → contact, in that order. No auth wall
   before a shopper can see the marketplace. Heavy actions (onboarding, settings) are behind intent.
   *(Req: PUB-001/002, IDN-009/010 gating order.)*
5. **Minimal friction to the first message.** A shopper must reach a real conversation with a vendor
   in ≤2 taps from a storefront. Contact happens inside Voeq — no external app. *(Req: MSG-001..004,
   PUB-005.)*
6. **Strong, honest feedback.** Every action has a visible outcome: sent / read / saved / failed /
   retrying. The product never leaves a user guessing whether something worked. *(Req: MSG-011,
   §13 error/recovery.)*
7. **Graceful failure over silent loss.** Network drops, timeouts, and offline compose must never
   lose a user's message, save, or listing. Failed states are recoverable and explicit. *(Req:
   MSG-009/010, §13.)*
8. **Calm by default.** Notifications are meaningful (message, review, follower, report) — not growth
   noise. *(Req: NOTIF-001, PRINCIPLE #10 respect attention.)*
9. **One conversation per pair; one thread of truth.** No thread sprawl; no duplicate sends. *(Req:
   MSG-001, MSG dedup §7.)*
10. **Accessible by construction.** Keyboard, screen-reader, reduced-motion, contrast, touch targets
   are requirements from flow one, not a retrofit. *(§15.)*

---

# 2. COMPLETE USER JOURNEYS

## 2.1 SHOPPER — NEW

`FLOW-SHOP-NEW-01`
1. **Arrives** at `voeq.ng` (landing, PUB-001). Sees campus context + entry to discovery.
2. **Campus selection** (IDN-010): picks default campus (NMU pilot). Stored; used as discovery scope.
3. **Discovery** (SHOP-003 / DISC): browse grid, "Trending on my campus", recently-viewed, followed
   preview. All campus-scoped.
4. **Search / filter** (SHOP-004/005 / DISC-001..003): finds a vendor or listing by query + facets.
5. **Opens listing** (PUB-006 / SHOP-006): photos, price range, description, vendor link, save/follow/
   message.
6. **Opens vendor** (PUB-005 / SHOP-007): trust signals, listings, reviews, "Message vendor".
7. **Messages vendor** (MSG): if not authenticated → registration with return intent → then message.
   One thread per pair opens.
8. **Conversation** (MSG-002/003): sends/receives; read/unread accurate; failures retryable.
9. **Return visit**: lands in shopper home (SHOP dashboard) → notifications (NOTIF-001) pull them
   back; trending has shifted (data-driven aliveness, not decoration).
10. **Reviews / saves / follows** (SHOP-008/009/010): acts on trusted vendors.
11. **Profile / settings** (SHOP-013/014): edits self, notification prefs.

**Failure paths:** not-authed message → register then resume (return intent preserved). Send fails →
retry. Vendor unverified → still contactable but unbadged. Campus empty → explicit empty state (no
fake content).

## 2.2 SHOPPER — RETURNING

`FLOW-SHOP-RET-01`
1. Opens app → **session valid** → shopper home (personalized: trending, saved, followed, message
   preview).
2. If **session expired/revoked** → re-auth (IDN-004, §3) → return to intended destination (deep
   link preserved).
3. Notifications badge → taps → lands on conversation / review / report status.
4. Continues discovery or conversation.

## 2.3 VENDOR

`FLOW-VEND-01` (5-step onboarding per VEND-001, DECIDED)
1. **Landing** → "Become a vendor" (or signup with vendor intent).
2. **Registration** (IDN-001) → email/Google verify → role promoted buyer→vendor (IDN-008).
3. **Consent + campus** gates (IDN-009/010).
4. **5-step onboarding** (VEND-001, §4.2) → storefront created, status `live`.
5. **Storefront setup** (VEND-002/003): profile, hours, photo, category.
6. **Listing creation** (VEND-004): ≥1 active listing → go-live gated.
7. **Becomes discoverable** (DISC-006/007): appears in browse/search/trending.
8. **Receives shopper** (PUB-005) → **messaging** (MSG) → responsiveness tracked (TRUST-008).
9. **Manages listings** (VEND-004), **reviews** (VEND-008), **analytics** (VEND-010), **settings**
   (VEND-011).

**Failure paths:** incomplete go-live → blocked with explicit reasons. Image-moderation reject →
reason + retry. Abandoned onboarding → resume (not restart). Banned/suspended → storefront visibility
restricted (IDN-007, OPEN enforcement).

## 2.4 STAFF

`FLOW-STAFF-01`
1. **Login** (IDN-002) → role-based redirect (moderator/admin → `/staff`; super_admin → `/staff`).
2. **Dashboard** → queues + analytics.
3. **Moderation** (STAFF-004): open reports surface.
4. **Vendor verification** (STAFF-006 / TRUST-001): confirm real campus presence + identity → set
   verified (audit-logged).
5. **Reports** (STAFF-005): investigate vendor/listing/review/report.
6. **User/listing intervention** (STAFF-007/008): suspend/ban, moderate content.
7. **Audit** (STAFF-009): trace every action.
8. **Escalation**: moderator → admin → super_admin per authority (§10).

**Role separation (authority, not UI):**
- **Moderator (PROVISIONAL — role shape OPEN, STAFF-001):** scoped moderation only (users, vendors,
  listings, reviews, reports); can ban users within rules; **cannot** manage staff, feature,
  institutions, categories, press, email, settings, analytics, audit, impersonate; cannot act on
  admin/super_admin/other moderators. Documented as provisional — authority NOT invented.
- **Admin:** all moderator powers + featured, institution/campus, category, press, email, settings,
  analytics, audit, impersonate; **cannot** manage staff or perform super_admin erasure; cannot act
  on other admin/super_admin.
- **Super Admin:** everything (`'*'`), including staff management + erasure; cannot be impersonated.

---

# 3. AUTHENTICATION FLOWS

Every flow: START → ACTION → SYSTEM RESPONSE → SUCCESS → FAILURE → RECOVERY.
(Req IDs: IDN-001..011.)

### 3.1 Registration — `FLOW-AUTH-REG`
- START: prospect on sign-up (shopper or vendor intent).
- ACTION: submit email/Google; **both** paths require Voeq OTP verification before activation (email may use magic-link alternative; Google resolves identity first, then OTP — C3, Doc 13 §13.4).
- SYSTEM: create pending user; send OTP/magic (pending token required, anti-enumeration via token
  gate). For Google, detect existing verified identity by email → authenticate the existing account (do not create a duplicate); role by `intent`. See §3.5 / §3.16 for identity handling.
  **Google authenticates *who* the user is — it does NOT grant pre-consent.** Both email and Google paths
  route through the **same** post-auth consent gate; Google users are not auto-completed. **OTP-inclusive:**
  the Google path also requires **Voeq OTP verification** before activation (C3, Doc 13 §13.4) — Google
  identity resolution does NOT skip the OTP step; same anti-enumeration pending-token gate as email.
- SUCCESS: verified → session; post-auth gate sequence (**consent IDN-009 → campus IDN-010** → shopper
  onboarding SHOP-001 / vendor onboarding VEND-001). Account creation/completion is **not** finalized
  until the consent gate (IDN-009) is passed — this applies to Google signups exactly as to email,
  **including the mandatory Voeq OTP verification step** (C3, Doc 13 §13.4).
- FAILURE: invalid input → inline field errors (no raw API text). OTP without valid pending token →
  reject. OTP/magic abuse → rate-limit lockout.
- RECOVERY: re-request OTP (rate-limited); Google fallback if email unavailable.

### 3.2 Login — `FLOW-AUTH-LOGIN`
- START: returning user.
- ACTION: email OTP/magic OR Google.
- SYSTEM: verify; issue session (single sign-in across web+api — REDESIGNED, IDN-004).
- SUCCESS: redirect by role + completion state (gates if incomplete).
- FAILURE: unknown email → "create account?" path; invalid OTP → retry with attempt counter; lockout
  after N tries.
- RECOVERY: "Forgot password" (3.6); magic-link resend.

### 3.3 Email verification — `FLOW-AUTH-VERIFY`
- ACTION: click magic-link / submit OTP.
- SYSTEM: validate pending token; mark email verified. Google users pre-verified.
- SUCCESS: continue. FAILURE: expired/invalid token → re-issue. RECOVERY: re-request.

### 3.4 Verification failure — `FLOW-AUTH-VERIFY-FAIL`
- Expired/invalid/used token → explicit "link expired" state → re-request path. No silent loop.

### 3.5 Duplicate account — `FLOW-AUTH-DUP`  (status: Duplicate-account prevention = LOCKED; Safe identity recovery/linking = LOCKED; Automatic account merging = REJECTED; Exact identity-linking implementation = ARCHITECTURE/SECURITY LATER)
- START: a registration or login attempt uses an identity (email / Google) already associated with an existing account.
- ACTION: system detects the existing verified identity.
- SYSTEM RESPONSE: clearly explains the situation to the user (e.g. "An account already exists for this email").
- SUCCESS: user authenticates the **existing** account where necessary; if appropriate, an additional authentication method is safely linked to that existing account. No second account is created.
- FAILURE: identity cannot be confirmed → user is guided to secure recovery (§3.6) rather than a silent new account.
- RECOVERY: recovery/linking path (§3.16) — never automatic merge.
- **REJECTED:** accounts must NOT be automatically merged by email. Detection of an existing identity leads to authentication/linking of the existing account, not creation of a duplicate or silent combination of two accounts.

### 3.6 Password recovery — `FLOW-AUTH-RECOVER` (C4, Doc 13 §13.6)
- START: forgot password.
- ACTION: submit email → **Voeq OTP verification** (Doc 13 §13.6 journey shape).
- SYSTEM: send OTP via email (anti-enumeration: always show "if account exists, email sent" regardless of
  whether the address matches an account). Anti-enumeration via pending token 🔒.
- ACTION (verify): enter OTP → verify → set new password → confirmation.
- SYSTEM: on success, **invalidate prior recovery/reset tokens**; emit a **security notification** (email,
  Doc 13 §13.7). Rate-limited; OTP replay brute-force protected (Doc 09 §9.5/§9.13).
- SUCCESS: reset completes → login. FAILURE: expired/invalid OTP or token → re-issue. RECOVERY: re-request
  (rate-limited).
- **Session-invalidation policy after reset (🔲 OPEN — founder decision, Doc 13 §13.6):** whether a
  successful password reset also invalidates *all existing sessions* is an undecided policy. NOT silently
  chosen here. Carried OPEN in Doc 09 §9.5; the journey above only mandates invalidating *recovery* tokens.

### 3.7 Expired recovery — `FLOW-AUTH-RECOVER-EXP`
- Reset token expired → "link expired" → re-request. No partial state left.

### 3.8 Logout — `FLOW-AUTH-LOGOUT`
- ACTION: sign out (current) / logout-all (devices).
- SYSTEM: revoke session(s). SUCCESS: returned to landing. FAILURE: revoke fails → client clears
  local session + warns.

### 3.9 Session expiration — `FLOW-AUTH-EXP`
- Idle/expired session on protected action → intercept → re-auth → **preserve intended destination**
  (deep link). No data loss on in-flight form (draft retained where possible).

### 3.10 Revoked session — `FLOW-AUTH-REVOKED`
- Server revokes (logout-all, staff action) → next request → forced re-auth. Client detects 401 →
  clears → login with return intent.

### 3.11 Suspended account — `FLOW-AUTH-SUSPEND`
- Login attempt by suspended user → **explicit "account suspended" state with reason + appeal path**.
  Normal app access blocked. (Enforcement on normal app is OPEN — IDN-007 — but UX must be ready.)

### 3.12 Banned account — `FLOW-AUTH-BAN`
- Banned user → blocked at auth with "account banned" state; no normal access; appeal path. Public
  vendor visibility revoked (IDN-007, OPEN).

### 3.13 Deleted account — `FLOW-AUTH-DEL`
- Soft-deleted → auth fails as "no such account" or "account removed" (policy OPEN, §12). Self-serve
  delete confirm; super_admin can erase.

### 3.14 Unauthorized access — `FLOW-AUTH-403`
- Authenticated but lacking permission (e.g. shopper hits staff route) → 403 → "you don't have access"
  → safe redirect (home or login). No raw error.

### 3.15 Role transition — `FLOW-AUTH-ROLE`
- Shopper → Vendor: "Become a vendor" → role promoted (never demotes staff). Re-gates onboarding.
  Staff roles assigned by super_admin only (STAFF-012 invite flow, OPEN build).

### 3.16 Coherent single-authentication experience — `FLOW-AUTH-SINGLE`  (status: Coherent single-authentication experience = LOCKED; Authentication implementation = LATER ARCHITECTURE DECISION)
- PRODUCT REQUIREMENT (LOCKED): A user should experience Voeq as one coherent application and should not repeatedly authenticate when moving between different parts of Voeq (public → shopper → vendor → staff surfaces).
- Behavior: once authenticated, moving across Voeq's surfaces does not force re-login; session state is shared at the product-experience level.
- RECOVERY: if a session is expired/revoked (§3.9 / §3.10), re-authentication occurs once and returns the user to their intended destination.
- **LATER ARCHITECTURE DECISION:** the mechanism (cookies, JWT, shared sessions, token exchange, same-origin strategy, auth-service topology) is intentionally NOT specified here; it belongs to the architecture/security documents.

---

# 4. ONBOARDING FLOWS

## 4.1 Shopper onboarding — `FLOW-ONB-SHOP`
- **Trigger:** post-auth, after consent+campus gates.
- **Purpose:** capture discovery preferences (feed interests) so discovery is personalized.
- **Info collected:** optional interest tags (categories/campus topics). Skippable.
- **Validation:** none blocking; defaults to campus-wide if skipped.
- **Success:** shopper home personalized. **Failure:** skip → default discovery. 
- **Back/save:** single screen; progress auto-saved; leave → resumes or defaults.

## 4.2 Vendor onboarding (5-step) — `FLOW-ONB-VEND` (VEND-001, DECIDED)
5 steps. Exact step contents **PROVISIONAL** (reconcile at build); the **5-step count is LOCKED**.

- **Step 1 — Business identity.** Purpose: name the business. Info: business name, one-line
  description, primary category. Validation: name required, non-empty; category from official
  taxonomy. Success: stored. Failure: inline required-field errors. Back: yes (to step 0/exit).
  Saved: yes (draft). Leave: resumes at step 1.
- **Step 2 — Campus & presence.** Purpose: anchor to campus + prove presence later. Info: campus
  (default from account), sub-area (hostel/faculty if applicable). Validation: campus required.
  Success: scoped. Failure: required error.
- **Step 3 — Contact & identity photo.** Purpose: enable native contact + human trust. Info: profile
  photo (upload, moderated), contact channel = **native messaging handle** (replaces legacy WhatsApp
  number). Validation: photo present (moderation async); handle implied by account. Failure: missing
  photo blocks go-live.
- **Step 4 — First listing.** Purpose: satisfy go-live "≥1 active listing". Info: listing title,
  price range (min required), description, category, photos. Validation: min price required; ≥1 photo;
  category required. Success: listing active. Failure: validation blocks advance.
- **Step 5 — Review & go-live.** Purpose: confirm + accept agreement. Info: review summary;
  accept Vendor Agreement (versioned, STAFF-017). Validation: `canGoLive` check — business name,
  contact channel (native), profile photo, ≥1 active listing, agreement accepted. Success: status →
  `live`; storefront live; dashboard. Failure: explicit list of unmet requirements; cannot advance.

**Cross-step rules:** nav hidden during onboarding; back allowed; progress auto-saved per step;
leaving mid-flow resumes (not restart); re-promotion idempotent. Completion requirement: all 5 steps
complete + `canGoLive` true.

**Vendor-visibility precondition (🔒 LOCKED, Doc 13 §13.4 / C1):** a vendor profile/storefront becomes
**publicly visible/searchable only when** `≥1 published listing` **AND** required Terms/consent acceptance
exist. `canGoLive` above is the onboarding-side gate; the *discovery/public* gate is the same rule applied
at read time — a vendor without a published listing (or with unaccepted consent) resolves to no public
storefront, even if onboarding was completed. Listings inherit this. (Data/derived-state spec: Doc 08 §8.4.)

---

# 5. DISCOVERY FLOWS

Campus context explicit throughout. (Req: DISC-001..010, SHOP-002/003, PUB-002..006.)

### 5.1 Campus selection — `FLOW-DISC-CAMPUS`
- START: new shopper (gate) or returning shopper switching.
- ACTION: pick/default campus. SYSTEM: sets scope; discovery filters to campus.
- SUCCESS: "Showing: {campus}". Switch available in header.

### 5.2 Homepage discovery — `FLOW-DISC-HOME`
- Grid of vendors/listings (campus-scoped) + "Trending on my campus" + recently-viewed (deduped) +
  followed preview. Empty campus → explicit "No vendors yet on {campus}" + CTAs (browse other
  campuses / become a vendor). Never blank grid.

### 5.3 Category discovery — `FLOW-DISC-CAT`
- Category page → filtered browse by official taxonomy (DISC-005). Parent/child supported.

### 5.4 Search — `FLOW-DISC-SEARCH`
- Free-text → results ranked by relevance (title > description; vendor-name boost), respecting campus
  + filters + sort. Empty query → browse. No results → helpful state ("No results for '{q}'" +
  suggested categories).

### 5.5 Filtering — `FLOW-DISC-FILTER`
- Combinable: campus, category, price (min/max), min rating, verified-only, featured. Applied live.

### 5.6 Sorting — `FLOW-DISC-SORT`
- newest / price asc / price desc / rating / popularity. Default = trending-weighted.

### 5.7 Trending — `FLOW-DISC-TREND`
- **REDESIGNED:** weight = recency + rating + campus relevance (+ optional engagement). Not raw view
  count. View count **deduped** (no inflation on refresh). New vendors/listings surface via recency
  (DISC-009).

### 5.8 Vendor / listing discovery — `FLOW-DISC-VEND` / `FLOW-DISC-LIST`
- Browse vendors (cards w/ trust signals) and listings grid. Tap → detail.

### 5.9 No results — `FLOW-DISC-EMPTY`
- Helpful state + suggestions. Not a dead end.

### 5.10 Partial results — `FLOW-DISC-PARTIAL`
- Some facets fail → show what loaded + note + retry; never show broken grid as success.

### 5.11 Network failure — `FLOW-DISC-NETFAIL`
- Discovery fetch fails → retry affordance; cached/last-good shown if available; explicit "couldn't
  refresh".

### 5.12 Stale data — `FLOW-DISC-STALE`
- Background refresh; show "updated Xs ago" if stale; pull-to-refresh on mobile.

### 5.13 Unavailable vendor — `FLOW-DISC-VEND-UNAV`
- Vendor suspended/banned/not-live → storefront shows "unavailable" public state (not 500); browse
  excludes it. (Enforcement OPEN per IDN-007.)

### 5.14 Unavailable listing — `FLOW-DISC-LIST-UNAV`
- Soft-deleted / vendor not-live → detail returns "unavailable"; excluded from browse.

---

# 6. VENDOR / LISTING FLOWS

(Req: VEND-002..007, PUB-005/006, TRUST.)

### 6.1 Vendor storefront (shopper view) — `FLOW-VEND-STORE`
- Identity + trust signals + listings grid + reviews + "Message vendor" + follow/save. Empty
  (no listings) → profile + message CTA.

### 6.2 Listing detail — `FLOW-LIST-DETAIL`
- Photos, price range, description, category breadcrumb, vendor link, save/follow/message/review
  entry, share. Unavailable → graceful state.

### 6.3 Listing creation — `FLOW-LIST-CREATE`
- Vendor: title, price range (min req), description, ≥1 category, photos. Validation per field.
  Success: active → discoverable. Image-moderation async: if rejected → listing flagged, vendor
  notified, not publicly shown until resolved.

### 6.4 Listing editing — `FLOW-LIST-EDIT`
- Edit own listing; ownership checked; changes reflect in discovery. Soft-delete re-create reuses
  slug with `-N`.

### 6.5 Listing removal — `FLOW-LIST-REMOVE`
- Soft-delete (logical) → removed from browse; detail unavailable. Vendor can recreate.

### 6.6 Listing availability — `FLOW-LIST-AVAIL`
- Per-listing availability derived from vendor hours / always-open.

### 6.7 Vendor availability — `FLOW-VEND-AVAIL`
- Operating hours / always-open → computed "open now" (TRUST-007). Timezone-aware to campus.

### 6.8 Vendor verification — `FLOW-VEND-VERIFY`
- Staff confirms (TRUST-001) → badge set; revocable; audit-logged. Shopper sees badge.
- (Legacy "verified purchase" from WhatsApp clicks is **REMOVED**; see §8.)

### 6.9 Vendor suspension — `FLOW-VEND-SUSPEND`
- Staff suspends → vendor cannot log in to vendor surfaces; public visibility restricted (OPEN
  enforcement, IDN-007). Shoppers see "unavailable".

### 6.10 Vendor reactivation — `FLOW-VEND-REACT`
- Staff lifts suspension → vendor restored; storefront returns per status.

---

# 7. NATIVE MESSAGING FLOWS  *(CRITICAL — WhatsApp absent)*

(Req: MSG-001..015. No WhatsApp dependency anywhere.)

**Authoritative messaging spec:** the full conversation/message/permissions/safety/retention/UI requirements
are consolidated in **Doc 13 §13.M** (LOCKED behaviors + OPEN/LATER inventory). This §7 encodes the
product flows; §13.M is the source of truth for rules. **Build order preserved:** messaging remains a
**Slice 7 FEATURE, not MVP** (Doc 06) — nothing here promotes it earlier.

**Message reliability — LOCKED product requirements** (these do not depend on any specific technical mechanism):
- A message must never silently disappear.
- Users must be able to understand whether a message is sending, sent, pending, or failed.
- A retry must not create duplicate messages.
- Temporary connectivity loss must be handled gracefully.
- Reconnection must reconcile message state correctly.
- Users should not have to guess whether their message was delivered.

The *mechanisms* sometimes used to achieve these (client-generated message IDs, server idempotency keys, WebSocket implementation, local outbox, queue architecture, database strategy) are **PROPOSED TECHNICAL APPROACHES** for the architecture stage — NOT locked product decisions. They may appear in this document only as illustrative proposals and do not constrain later design.

### 7.1 Starting a conversation — `FLOW-MSG-START`
- START: shopper on vendor storefront/listing → "Message vendor".
- ACTION: if unauthenticated → register/login with **return intent to this vendor** → then open.
- SYSTEM: upsert single conversation for (shopper, vendor). If exists, open it (no duplicate).
- SUCCESS: thread opens, focus on composer. No external app launched.

### 7.2 Opening existing conversation — `FLOW-MSG-OPEN`
- From conversation list or notification → opens thread; marks read on view (MSG-006).

### 7.3 Conversation list — `FLOW-MSG-LIST`
- Shows threads: participant, last message preview, timestamp, unread count. One row per pair.

### 7.4 Sending a message — `FLOW-MSG-SEND`
- ACTION: type + send. SYSTEM: optimistic insert as `sending` → server ack → `sent` → delivered
  (realtime) → `read` (recipient viewed). Network: queue if offline.

### 7.5 Receiving a message — `FLOW-MSG-RECV`
- Realtime push (where available) → insert as `delivered` → on view, `read`. Participant-only.

### 7.6 Unread state — `FLOW-MSG-UNREAD`
- Recipient hasn't viewed → unread count on list + notification badge. Clears on view.

### 7.7 Read state — `FLOW-MSG-READ`
- Recipient views thread → sender sees `read` (e.g. checkmark). Accurate, not assumed.

### 7.8 Failed message — `FLOW-MSG-FAIL`
- Send rejected/timeout → message enters `failed` with **retry affordance**. Never silently dropped.
  User sees distinct failed style + "tap to retry".

### 7.9 Retry — `FLOW-MSG-RETRY`
- ACTION: tap retry → re-send from `failed` → `sending` → `sent`… Dedupe by client message id so no
  duplicate on double-tap.

### 7.10 Connection lost — `FLOW-MSG-DISCONNECT`
- Realtime drops → composer still works (queue); banner "reconnecting…"; messages send when possible.

### 7.11 Reconnection — `FLOW-MSG-RECONNECT`
- On regain → client re-establishes session (IDN-004) → reconciles pending/out-of-order messages →
  resends queued → clears banner. No loss.

### 7.12 Duplicate send prevention — `FLOW-MSG-DEDUP`  (product requirement LOCKED; mechanism PROPOSED TECHNICAL APPROACH)
- PRODUCT REQUIREMENT (LOCKED): a retry must not create duplicate messages; tapping send twice or retrying after timeout never results in two copies of the same message.
- PROPOSED TECHNICAL APPROACH (NOT locked): e.g. a client-generated stable message id combined with server-side idempotency on (conversation, clientMsgId). The exact mechanism is an architecture decision.

### 7.13 Empty conversation — `FLOW-MSG-EMPTY`
- New thread → "Say hi to {vendor}" prompt; no phantom messages.

### 7.14 Notification — `FLOW-MSG-NOTIF`
- New message → in-app (NOTIF-001) + realtime (NOTIF-002) + email digest (NOTIF-003, SHOULD). Tapping
  → thread.

### 7.15 Blocked user (if requirement remains) — `FLOW-MSG-BLOCK` (MSG-012, SHOULD, OPEN)
- If block shipped: block from chat → no further messages; report still available. **PROVISIONAL** —
  if not built, report-only path used.

### 7.16 Reported conversation — `FLOW-MSG-REPORT`
- From thread → report participant (category: harassment/impersonation/other) → opens report (§10);
  thread remains accessible unless staff intervenes.

### 7.17 Deleted / deactivated participant — `FLOW-MSG-DELPART`
- Other participant deleted/suspended/banned → thread preserved (history) but new sends blocked with
  clear state ("This vendor is no longer active"). No silent disappearance of history.

### 7.18 Vendor/listing no longer available — `FLOW-MSG-UNAV`
- Vendor not-live/suspended → thread shows "vendor unavailable"; history retained; new message blocked.

### 7.19 Network-resilience specifics (Nigerian mobile reality)
- **Slow 3G:** optimistic UI; debounced; no blocking spinner; send queues.
- **Wi-Fi ↔ mobile switch:** session persists (single sign-in IDN-004); reconnection reconciles.
- **Tab/app backgrounding:** realtime pauses; on foreground, reconcile + catch-up; no lost messages.
- **Reconnect after sleep:** full reconcile; queued sends flush; banner clears.
- **Principle:** the experience fails *gracefully and visibly*, never silently losing a message.

### 7.20 Offline messaging scope — distinction  (status: Transient connectivity resilience = LOCKED Phase 1; Full offline messaging = LATER / NOT a Phase 1 promise)
- **TRANSIENT CONNECTIVITY RESILIENCE — LOCKED for Phase 1.** Example: user sends a message → connection temporarily disappears → message remains understandable as pending/failed → connection returns → system safely retries/reconciles. This is required and is what §7.10 / §7.11 / §7.19 describe.
- **FULL OFFLINE MESSAGING — LATER / NOT a Phase 1 promise.** A user being able to compose and store many messages while completely offline and synchronize them hours later is a larger capability. It is intentionally deferred; do not promise it for Phase 1.
- No technical mechanism for either behavior is specified here (queue / outbox / sync strategy = later architecture).

---

# 8. REVIEWS & TRUST FLOWS

(Req: TRUST-001..011. "Verified purchase" NOT retained.)

### 8.1 Writing a review — `FLOW-REV-WRITE`
- Shopper (authenticated) → on vendor → rating (1–5) + text → submit. One review per (shopper,
  vendor). Duplicate → "edit instead".

### 8.2 Editing a review — `FLOW-REV-EDIT`
- Editable ≤24h (TRUST-004). After window → locked; show "editable until {time}".

### 8.3 Vendor response — `FLOW-REV-RESP`
- Vendor responds once per review (TRUST-005), editable ≤24h. Second response rejected.

### 8.4 Review visibility — `FLOW-REV-VIS`
- Public on storefront (visible-status filtered). Author sees own; vendor sees own responses.

### 8.5 Reporting a review — `FLOW-REV-REPORT`
- Report inappropriate review → staff queue (§10).

### 8.6 Review moderation — `FLOW-REV-MOD`
- Staff reviews reported review → hide/restore; audit-logged.

### 8.7 Rating calculation — `FLOW-REV-RATING`
- Average of visible reviews; recomputed on create/edit/delete; 0 if none. One review per pair
  prevents inflation.

### 8.8 Verified / trust signals — `FLOW-TRUST-SIG`
- Verified badge (staff-set, TRUST-001), rating, responsiveness (TRUST-008, from messaging latency),
  open-now (TRUST-007), badges (TRUST-009), report health. Public leads with discrete signals, not a
  cryptic score.

### 8.9 "Verified purchase" replacement — OPEN
- Legacy derived it from **WhatsApp clicks within 30 days** — invalid (WhatsApp removed, no payments).
- **Recommendation (NOT a decision):** remove the concept entirely. Native messaging makes real
  interaction directly observable, so the proxy is unnecessary. If a contact-quality signal is wanted,
  define **"verified contact" = ≥1 message exchanged within N days** (N + review-weight impact OPEN,
  §19 #5). Must be resolved before reviews ship.

---

# 9. SAVES / FOLLOWS

(Req: SHOP-008/009.)

### 9.1 Save — `FLOW-SAVE`
- Shopper taps save on vendor/listing → optimistic saved state; persists.

### 9.2 Unsave — `FLOW-UNSAVE`
- Toggle off → removed from saves.

### 9.3 Follow — `FLOW-FOLLOW`
- Follow vendor → appears in followed feed + vendor sees follower (notification, NOTIF-001).

### 9.4 Unfollow — `FLOW-UNFOLLOW`
- Toggle off.

### 9.5 Duplicate action — `FLOW-SAVE-DUP`
- Repeated taps → idempotent toggle; no duplicate rows.

### 9.6 Offline / network failure — `FLOW-SAVE-OFFLINE`
- Action queues; reconciles on reconnect; user sees local state immediately (optimistic).

### 9.7 Notification behavior — `FLOW-FOLLOW-NOTIF`
- Vendor gets "new follower" (digest optional). Shopper gets followed-vendor updates in discovery
  feed, not spam.

---

# 10. REPORTS & DISPUTES

(Req: TRUST-006/011, STAFF-004/005, SHOP-015.)

### 10.1 Shopper reports vendor — `FLOW-REP-VEND`
- From storefront/thread → choose category (not-on-campus, scam, inappropriate, impersonation,
  harassment, other) → submit → report open; shopper sees "reported" + status later.

### 10.2 Shopper reports listing — `FLOW-REP-LIST`
- From listing → category → submit → queue.

### 10.3 Shopper reports message/user — `FLOW-REP-MSG` (if messaging report shipped, MSG-012)
- From thread → report participant.

### 10.4 Vendor reports shopper — `FLOW-REP-SHOP` (if enabled)
- Vendor can report abusive shopper from thread.

### 10.5 Staff receives report — `FLOW-REP-STAFF`
- Enters moderation queue (STAFF-004) with category + context.

### 10.6 Staff investigates — `FLOW-REP-INV`
- Reviews vendor/listing/review/message; checks trust signals; may message participant (audited).

### 10.7 Staff resolves / escalates — `FLOW-REP-RES`
- Action: warn / suspend / ban / hide content / dismiss. Audit-logged (STAFF-009). Reporter notified
  of outcome (status, not detail). Escalation: moderator → admin → super_admin per authority.

---

# 11. NOTIFICATION FLOWS

EVENT → RECIPIENT → NOTIFICATION → DESTINATION → READ STATE → FAILURE BEHAVIOR.
(Req: NOTIF-001..004.)

| Event | Recipient | Notification | Destination | Read state | Failure behavior |
|---|---|---|---|---|---|
| New message | Conversation participant | In-app + realtime + email digest | Conversation thread | Unread until viewed | Realtime fail → in-app on next open; email retry |
| New review | Vendor | In-app (digest) | Storefront reviews | Unread until viewed | Digest covers loss |
| New follower | Vendor | In-app (digest) | Followers/followed | Unread until viewed | Digest |
| Report update | Reporter | In-app | Report status | Unread until viewed | In-app on open |
| Vendor verified / revoked | Vendor | In-app | Storefront | Unread | In-app on open |
| Listing moderation result | Vendor | In-app | Listings | Unread | In-app on open |
| Account suspended/banned | User | In-app + email | Account state | N/A | Email retry |
| Featured placement | Vendor | In-app | Storefront | Unread | In-app |

**Realtime vs persistent:** realtime (NOTIF-002) drives instant message/presence; persistent in-app
(NOTIF-001) is the durable record; email (NOTIF-003) is SHOULD digest; push (NOTIF-004) is LATER.

---

# 12. ACCOUNT & SETTINGS FLOWS

(Req: SHOP-013/014, IDN-006/008, STAFF-013.)

### 12.1 Profile editing — `FLOW-ACCT-PROFILE`
- Shopper/vendor edits self (name, photo, campus). Validation; save; optimistic.

### 12.2 Account settings — `FLOW-ACCT-SET`
- Notification prefs, campus switch, linked accounts.

### 12.3 Notification preferences — `FLOW-ACCT-NOTIF`
- Toggle in-app/email digests per event type. Respected by NOTIF-003.

### 12.4 Security — `FLOW-ACCT-SEC`
- See active sessions; logout-all (IDN-006).

### 12.5 Password changes — `FLOW-ACCT-PW`
- For email accounts: change via current + new (re-auth). Google-only: n/a.

### 12.6 Account deletion — `FLOW-ACCT-DEL` (OPEN policy)
- Self-serve delete with confirmation; soft-delete logical. True erasure = super_admin only. Policy
  (hard vs soft, data retention) **OPEN** (§19 #12).

### 12.7 Account recovery — `FLOW-ACCT-RECOV`
- Via password recovery (3.6) or re-verify email.

### 12.8 Session management — `FLOW-ACCT-SESS`
- View/revoke devices; logout-all.

---

# 13. ERROR & RECOVERY EXPERIENCE

The product never leaves users wondering if an action succeeded. (Req: MSG-009/011, §7, §5.11.)

| Situation | Experience |
|---|---|
| Network unavailable | Action queues (message/save/listing); banner "offline — will send when connected"; no data loss. |
| API unavailable | Retry with backoff; cached/last-good shown; explicit "couldn't reach server". |
| Timeout | Request retries once; then explicit failure + retry affordance. |
| Validation failure | Inline field errors; no raw API text; focus first invalid field. |
| Permission failure | 403 → "you don't have access" → safe redirect. |
| Expired session | Re-auth preserving destination; draft retained. |
| Missing resource | 404 → helpful "not found" with way back; not a stack trace. |
| Deleted resource | "This was removed" state; browse excludes it. |
| Suspended account | "Account suspended" + reason + appeal. |
| Server error | 500 → friendly state + retry; logged; no raw error to user. |
| Realtime disconnect | Banner "reconnecting"; composer still works (queue). |
| Failed message | `failed` style + retry tap; never silent loss. |
| Failed image upload | Reject with reason (moderation/size/format); retry; listing not blocked indefinitely. |
| Partial page data | Show loaded sections + "some content couldn't load" + retry; not fake success. |
| Empty state | Explicit, helpful empty (no blank grids/dead ends). |

---

# 14. RESPONSIVE EXPERIENCE

No exact breakpoints yet. Behavior by device class.

- **Mobile (primary, low-end Android):** bottom navigation (unified across roles — fixes legacy
  inconsistency). Discovery = single-column scroll. Messaging = single-pane, composer sticky. Forms =
  full-screen steps. Cards = full-width stacked. Staff tables = stacked cards / horizontal scroll.
  Images = lazy, responsive srcset, capped. Density: low (large touch targets).
- **Tablet:** two-column where natural (discovery grid 2-up; messaging list+thread side-by-side on
  landscape). Nav = bottom or side.
- **Desktop:** messaging = two-pane (list | thread). Discovery = multi-column grid. Staff tools =
  full tables + side panel. Forms = inline/modal. Density: higher, but touch-target-safe. Images =
  larger, art-directed (design-phase).

**Cross-device:** single sign-in (IDN-004); conversation state synced; realtime reconciles on any
device; no device-specific data loss.

---

# 15. ACCESSIBILITY EXPERIENCE

Requirements, no implementation. (Req: PRINCIPLE #9.)

- **Keyboard:** all flows operable via keyboard; logical tab order; visible focus; skip-to-content on
  public pages.
- **Focus:** clear focus ring; focus managed on modals/gates (consent, campus, onboarding); focus
  returns to trigger after close.
- **Screen readers:** semantic landmarks; buttons vs links correct; dynamic regions (notifications,
  message arrival, loading) announced via live regions; images have alt; state changes announced.
- **Reduced motion:** all animation (including any background phenomenon) respects `prefers-reduced-
  motion`; static fallback. (Carries founder's reduced-motion requirement from design exploration.)
- **Contrast:** text/UI meets WCAG AA on cream/green/gold; gold used sparingly (not on text alone).
- **Touch targets:** ≥44×44 CSS px on mobile; spacing prevents mis-tap.
- **Forms:** labels associated; errors linked via aria-describedby; required marked; no placeholder-
  only labels.
- **Errors:** programmatic, not color-only; suggestions provided.
- **Dynamic content:** realtime messages, unread counts, toasts announced; no auto-moving content
  that traps focus.
- **Realtime messaging a11y:** incoming message announced; read-state conveyed non-visually; send
  states (sending/sent/read/failed) exposed to AT.

---

# 16. FLOW STATES (reusable vocabulary)

Determined required vocabulary (superset of prompt example; trimmed to what flows need):

- **INITIAL** — before first load / first interaction.
- **LOADING** — fetching; skeleton, not blank.
- **READY** — content present and interactive.
- **EMPTY** — no data; explicit helpful state.
- **ERROR** — action/data failed; explicit + retry.
- **RETRYING** — automatic or user-initiated retry in progress.
- **OFFLINE** — no connectivity; actions queue.
- **PARTIAL** — some data loaded, some failed.
- **SUCCESS** — action completed; visible confirmation.
- **UNAUTHORIZED** — no/invalid session; re-auth (preserve destination).
- **FORBIDDEN** — authed but lacking permission.
- **UNAVAILABLE** — resource exists but not accessible (suspended/deleted/not-live).
- **SENDING / SENT / DELIVERED / READ / FAILED** — message-specific (MSG-011).
- **ARCHIVED** — conversation lifecycle state (MSG-015).

(Legacy dead states `draft/paused/archived` for listings/vendors are NOT in this vocabulary unless a
real product need is approved — REM-007.)

---

# 17. FLOW DEPENDENCIES

Actual dependency structure (from product, not the example):

```
Institutions/Campuses + Categories (seed, staff)
        ↓
Identity (register/login/verify/sessions) + Consent + Campus gate + .edu.ng gate
        ↓
Role handling (shopper / vendor / staff)
        ↓
Shopper onboarding (feed prefs)            Vendor onboarding (5-step)
        ↓                                    ↓
Campus scoping established ◄───────────────┘
        ↓
Vendor storefront + Listings + Images + Availability
        ↓
Public discovery (browse/search/category) + Trending (weighted) + Recently-viewed
        ↓
Trust: Reviews + Ratings + Verification + Badges + Responsiveness
        ↓
Native Messaging (depends on Identity sessions + Trust responsiveness)
        ↓
Notifications (in-app/realtime/email)  ── depends on Messaging + Trust
        ↓
Shopper experience (dashboard/saves/follows) + Vendor experience (dashboard/analytics)
        ↓
Staff (moderation/verify/audit/analytics)  ── governs everything above
        ↓
Legal/public pages + For-Vendors (parallel-safe early)
        ↓
Polish/perf/a11y (separate build)
```

Messaging cannot function before Identity (sessions) and degrades trust responsiveness if Reviews
absent. Staff is last because it governs all prior.

---

# 18. FLOW → REQUIREMENT TRACEABILITY

Every major flow tagged with its stable requirement IDs (from Document 02). This enables
Requirement → Flow → Page → API → Implementation → Test → QA tracing.

| Flow ID | Flow | Requirement IDs |
|---|---|---|
| FLOW-SHOP-NEW-01 | Shopper new journey | PUB-001/002/005/006, IDN-010, SHOP-003/004/006/007/008/009/010, MSG-001..004, NOTIF-001 |
| FLOW-SHOP-RET-01 | Shopper returning | IDN-004, SHOP (dashboard), NOTIF-001, MSG-002 |
| FLOW-VEND-01 | Vendor journey | IDN-001/008/009/010, VEND-001..011, PUB-005, DISC-006/007, MSG, TRUST-008 |
| FLOW-STAFF-01 | Staff journey | IDN-002, STAFF-001..011, TRUST-001, TRUST-006 |
| FLOW-AUTH-* (3.1–3.15) | Auth flows | IDN-001..011 |
| FLOW-ONB-SHOP | Shopper onboarding | SHOP-001, IDN-009/010 |
| FLOW-ONB-VEND | Vendor 5-step onboarding | VEND-001, IDN-008, STAFF-017 |
| FLOW-DISC-* (5.1–5.14) | Discovery flows | DISC-001..010, SHOP-002/003, PUB-002..006 |
| FLOW-VEND-STORE / LIST-DETAIL / LIST-CREATE / EDIT / REMOVE / AVAIL / VEND-AVAIL / VEND-VERIFY / SUSPEND / REACT | Vendor/listing | VEND-002..007, PUB-005/006, TRUST-001/007, STAFF-006/007, IDN-007 |
| FLOW-MSG-* (7.1–7.19) | Messaging flows | MSG-001..015, IDN-004, NOTIF-001/002, TRUST-008 |
| FLOW-REV-* (8.1–8.9) | Reviews/trust | TRUST-001..011 |
| FLOW-SAVE / UNSAVE / FOLLOW / UNFOLLOW / SAVE-DUP / SAVE-OFFLINE / FOLLOW-NOTIF | Saves/follows | SHOP-008/009, NOTIF-001 |
| FLOW-REP-* (10.1–10.7) | Reports/disputes | TRUST-006/011, STAFF-004/005/009, SHOP-015, MSG-012 |
| NOTIF table (§11) | Notification flows | NOTIF-001..004 |
| FLOW-ACCT-* (12.1–12.8) | Account/settings | SHOP-013/014, IDN-006/008, STAFF-013 |
| §13 error/recovery | Error experience | MSG-009/011, DISC-011, §5.11 |
| §14 responsive | Responsive | (cross-cutting) |
| §15 a11y | Accessibility | PRINCIPLE #9 |
| §16 states | State vocabulary | (cross-cutting) |
| §17 dependencies | Dependencies | (cross-cutting) |

---

# 19. OPEN / PROVISIONAL DECISIONS

Genuine unresolved items. Recommendations are NOT converted to decisions.

**Decision-status terminology used in this document:**
- **LOCKED** = founder/product decision that later documents may rely upon.
- **PROVISIONAL** = proposed direction that still requires review.
- **OPEN** = unresolved product decision.
- **LATER** = intentionally deferred.
- **REJECTED** = explicitly not part of the product direction.
- **PROPOSED TECHNICAL APPROACH** = illustrative implementation idea for a later architecture/security document; not a product decision and not constraining.

| # | Decision | Label | Note |
|---|---|---|---|
| 1 | Moderator role retained distinct vs folded into Admin | **OPEN** | STAFF-001; §2.4/§10 documented provisional |
| 2 | Staff account creation: invite flow vs DB-seed | **OPEN** | STAFF-012; build decision |
| 3 | Banned/suspended enforce on normal app (not just admin) | **OPEN** (recommend yes) | IDN-007; UX ready (3.11/3.12) |
| 4 | `.edu.ng` gating mechanism | **OPEN** | IDN-011; exact rule needed before auth build |
| 5 | "Verified purchase" replacement | **OPEN** (recommend remove) | §8.9; resolve before reviews ship |
| 6 | Review scoping: vendor-only (P1) vs listing-scoped (P2) | **OPEN** | FUT-004 |
| 7 | Categories: official-only (P1, proposed) vs user-submitted | **OPEN** | DISC-005 |
| 8 | Pre-auth messaging | **PROVISIONAL** (proposed: auth required) | MSG; return-intent preserves destination |
| 9 | Monetization | **OPEN** | FUT-006 |
| 10 | NMU-only vs multi-campus at launch | **OPEN** | FUT-003; data model multi-campus |
| 11 | Message blocking (MSG-012) ship or report-only | **OPEN** | §7.15 provisional |
| 12 | Account deletion policy (soft vs hard, retention) | **OPEN** | §12.6 |
| 13 | Vendor 5-step exact contents | **PROVISIONAL** (count LOCKED) | §4.2; reconcile at build |
| 14 | Design values / light-vs-dark / art-directed imagery / background boldness | **OPEN** (design-phase) | affects PUB-001 acceptance |
| 15 | Duplicate-account prevention; safe identity recovery/linking | **LOCKED** (auto-merge = **REJECTED**; linking impl = ARCHITECTURE/SECURITY LATER) | §3.5 / §3.16 |
| 16 | Coherent single-authentication experience | **LOCKED** (implementation = LATER ARCHITECTURE DECISION) | §3.16 |
| 17 | Transient connectivity resilience vs full offline messaging | **LOCKED** (transient) / **LATER** (full offline) | §7.10/7.11/7.19 vs §7.20 |
| 18 | Message-reliability technical mechanisms (ids/idempotency/websocket/outbox/queue/db) | **PROPOSED TECHNICAL APPROACH** (product requirements LOCKED) | §7 intro / §7.12 |

---

# 20. CONTRADICTIONS WITH LEGACY (explicit, so not silently carried)

1. **WhatsApp as contact** — legacy "Chat with Vendor via WhatsApp" → **REMOVED**; all contact flows
   are native messaging (§7). No WhatsApp dependency in any flow.
2. **"Verified purchase" from WhatsApp clicks** — invalid post-removal + no payments → **REMOVED**
   (§8.9, OPEN replacement).
3. **Trending = raw view count + refresh inflation** — replaced with weighted + deduped (§5.7,
   DISC-008).
4. **Moderator backend-enforced, no web UI** — documented provisional (§2.4/§10/§19 #1), not rebuilt
   as gap.
5. **`suspended`/`banned` only on admin routes** — proposed enforcement on normal app (§3.11/3.12,
   IDN-007 OPEN).
6. **Cross-domain auth** — redesigned for single sign-in (§7.19, IDN-004).
7. **Base64 upload** — presigned multipart (VEND-006); flow reflects retry-on-reject (§13).
8. **Inconsistent mobile nav** — unified bottom-nav proposed (§14).
9. **Dead enum states** — excluded from state vocabulary (§16, REM-007).
10. **Framework assumptions** — not carried; architecture stage decides (Document 01 §8).

---

**END OF 03-USER_EXPERIENCE_AND_FLOWS.** Experience layer only. References `01-PRODUCT_DECISIONS.md`
(beliefs) and `02-PRODUCT_SCOPE_AND_REQUIREMENTS.md` (stable IDs). Feeds Information Architecture, Page
Map, UI Design, Architecture, API Contracts, Testing, and Build Batches via the traceability in §18.
No UI, components, architecture, database, API, or implementation is specified herein.
