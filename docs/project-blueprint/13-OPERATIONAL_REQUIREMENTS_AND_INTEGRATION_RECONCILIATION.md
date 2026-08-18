# 13 — OPERATIONAL REQUIREMENTS & INTEGRATION RECONCILIATION

> **Status:** DOCUMENTATION ONLY. No code. No UI. No components. No Next.js. No dependencies. No Slice 0.
> **Do NOT proceed to implementation.** This is the requirements-lock pass the blueprint needed before code.
>
> **Authoritative base:** Docs 00–12 (LOCKED decisions preserved). This document incorporates the supplied
> canonical public/legal/auth/infra content and reconciles it against 00–12, and — by founder decision —
> **settles the messaging model as Voeq native direct chat with WhatsApp removed.**
>
> **Governing rule (unchanged):** *Implementation convenience never overrides the locked Voeq system.*

---

## 13.0 — Executive summary

- **🔒 DECIDED (founder): Voeq uses native direct chat. WhatsApp is REMOVED from the current product.**
  The earlier WhatsApp Connect language (supplied instruction + prior Doc 13 draft) is **obsolete and
  corrected here**, not treated as an alternative architecture (§13.13). Docs 01–05 already locked WhatsApp
  REMOVED; Doc 13 now aligns.
- Six public-information surfaces (PG-PUB-006..011) have routes (Doc 07 §7.2). Their canonical content +
  design-system inheritance are required (§13.1).
- **Silent omission found & corrected in spec:** the Terms rule *"vendor profile not publicly visible until
  ≥1 published listing + consent"* was absent from 00–12 (§13.4 / §13.18-C1).
- Four net-new integration requirements: **Resend** (email), **Cloudinary** (media), **Redis**
  (security/cache, justified-only), **Sightengine** (image moderation/safety, §13.10).
- **OTP first-class** across registration, reset, email-change, recovery, sensitive actions (§13.5).
- **Messaging = first-class Voeq native direct chat** (§13.M). Architecture + product requirements fully
  documented now; sequencing preserved — **feature, not MVP blocker** (Slice 7, Doc 06).
- **Sightengine = image moderation/safety** (§13.10). Role LOCKED; API/config 🔲 OPEN.
- One Identity absolute (§13.11). Terminology: "Shopper" canonical; "Buyer" residue in Doc 00 legacy
  (§13.14).
- **Verdict: CONDITIONAL.** After founder approves §13.18 corrections (now including messaging-doc updates
  + Terms/Privacy correction) and the Doc 12 final audit re-runs → READY.

---

## 13.1 — Canonical public-information requirements 🔒 (content) / 🟡 (design inheritance)

| Route | PG | Canonical content | Status |
|---|---|---|---|
| `/about` | PG-PUB-006 | About Voeq (§13.1a) | 🔒 content / 🟡 design |
| `/terms` | PG-PUB-007 | Terms of Service (§13.2) — **consent destination** | 🔒 |
| `/privacy` | PG-PUB-008 | Privacy Policy (§13.3) — **consent destination** | 🔒 |
| `/help` | PG-PUB-009 | Help — 🔲 OPEN exact content | 🟡/🔲 |
| `/for-vendors` | PG-PUB-010 | For-Vendors (marketing + CTA) | 🔒 direction / 🔲 copy |
| `/press` | PG-PUB-011 | Press — ⏭ LATER | ⏭ |

**§13.1a — About Voeq (canonical):** Voeq (pronounced "voke") is a marketplace directory connecting people
with trusted vendors/service providers around them — food, fashion, tech, repairs, tailoring, accessories,
dozens of everyday needs. Started from a simple problem: no reliable way to discover vendors around you;
word of mouth only goes so far. Voeq closes that gap — search by need, see verified vendors, connect
directly via Voeq's native chat. **Today Voeq is a discovery platform** — helping you find people and
helping vendors get found. Building toward a future where you can discover, connect, and transact directly
on Voeq. **Find. Connect. Grow.**

**RULE (🔒 LOCKED):** Voeq must **never** be described as currently processing transactions or payments in
marketing, About, Terms, Privacy, UI copy, architecture, or tests. Current = free discovery directory;
payments/transactions = future.

**Design inheritance (🟡 PROVISIONAL):** real Voeq surfaces, not forgotten static pages. Cream environment
(Doc 05 A.3), editorial typography (Fraunces/Hanken 🟡), no glassmorphism/decoration drift (Doc 05
anti-cliché), long-form readable (Doc 04 PG-PUB-006). Exact editorial treatment 🟡 pending Slice 0+.

---

## 13.2 — Canonical Terms of Service requirements 🔒 (CORRECTED — WhatsApp removed)

**Corrected canonical language (replaces any "connects through WhatsApp" phrasing):**

> Voeq is a free vendor-discovery directory. Voeq does **not** process payments, does **not** hold funds in
> escrow, and is **not** a party to transactions between users and vendors. Connection between shoppers and
> vendors happens through **Voeq's native direct-chat system (Connect)** — not a third-party messaging app.
> Voeq intends to support direct in-platform transactions in the future.

Product facts (must stay consistent everywhere — marketing, About, Terms, Privacy, UI copy, architecture,
tests):

- **Current Voeq status:** free vendor-discovery directory · **no payment processing** · **no escrow** ·
  **not a party to user↔vendor transactions** · **Connect = Voeq native direct chat (WhatsApp removed)** ·
  future in-platform transactions intended. 🔒
- **Eligibility:** min age **13** 🔒 · valid email required 🔒 · email must be **Voeq-verified before account
  activation** 🔒 (canonical auth flow, §13.4).
- **Connect / messaging eligibility (reconciled):** *"An account with a verified email is required to use
  the Connect feature"* is reconciled with the canonical auth flow: Connect = starting/using Voeq's native
  conversation system; use requires an **activated, consenting, authenticated identity** (email verified
  before activation per §13.4; consent required before authenticated use per Doc 09 §9.4). The original
  single-line eligibility is preserved in spirit but now draws its exact auth/OTP requirements from §13.4
  rather than being copied verbatim. 🔒
- **Vendor visibility (🔒 NEW requirement, was omitted in 00–12):** a vendor profile is **not publicly
  visible/searchable until** `≥1 published listing` **AND** `required Terms/consent acceptance`. Real
  product rule, not mere legal text (§13.18-C1).
- **Listings:** a vendor may have **multiple listings** 🔒 · each listing belongs to **one category** 🔒 ·
  a storefront may span **multiple categories** 🔒 (consistent with Doc 08 storefront projection).
- **Enforcement:** listings/profiles have reporting 🔒 · Voeq may warn/restrict/remove per locked staff/
  security model (Doc 09 §9.9/§9.12) 🔒.
- **Fees:** current listing free 🔒 · future paid/commission/payments = future functionality, must **not**
  appear in MVP 🔒.

---

## 13.3 — Canonical Privacy requirements 🔒 (CORRECTED — no WhatsApp)

**Corrected:** communication data is **Voeq native chat**; no third-party messaging processor receives
message content. Collected: email · name · vendor/business details · public listing info · reviews ·
reports · basic Google account info (when Google auth used) · **native chat messages/conversation
metadata** (necessary for the Connect feature). 🔒

Purposes: search · discovery · storefronts · **Connect (native chat)** · trust/safety · service comms ·
future feature/fee comms · aggregate non-identifying demand insights. 🔒

Policy: **no sale of personal data** 🔒 · future payment partners may receive relevant info once payments
launch 🔒 (future) · lawful disclosure where legally required 🔒 · users have access/correction/deletion
rights 🔒 (deletion behavior per Doc 09 §9.17 / §13.M-retention) · optional-consent withdrawal respected 🔒 ·
security measures implemented 🔒 · 13+ 🔒. Legal references: **NDPR 2019 · NDPA 2023** 🔒. Do NOT invent
claims beyond supplied policy. PII boundary (Doc 09 §9.16): server-side only; observability must not leak
PII (Doc 09 §9.18).

---

## 13.4 — Complete authentication flows 🔒 (structure) / 🔲 (OTP numbers)

### Email/password
```
Signup → email/password → mandatory Terms + Privacy acceptance (explicit, NEVER pre-checked)
       → Voeq OTP verification → account activation → platform
```
### Google
```
Google authentication → Voeq Terms + Privacy acceptance (explicit, NEVER pre-checked)
       → Voeq OTP verification → account activation → platform
```
**LOCKED (08b §1, Doc 09 §9.3/§9.4):**
- Google establishes *identity*; Voeq establishes *consent + email verification + activation + capabilities*.
- **Google does NOT bypass Voeq consent or Voeq verification.** 🔒
- Consent checkbox explicit, never pre-checked; user actively accepts current Terms+Privacy. 🔒
- Both methods → same single Identity (Doc 08 §8.3); no auto-merge (Doc 03 §3.5). 🔒
- Email Voeq-verified **before activation** (§13.2 eligibility). 🔒
- `?next=` redirect preservation (08b §1). 🔒
- **OTP step is required for BOTH methods** (refinement: Doc 03 §3.1 omitted OTP for Google — propose align,
  §13.18-C3). 🔒 structure / 🔲 numbers.

---

## 13.5 — OTP architecture requirements 🔲 (numbers OPEN) / 🔒 (first-class status)

OTP **first-class**, not registration-only. Flows: registration verification · password reset · email change
· account recovery · sensitive security actions (🔲 which). For every flow specify (🔲 OPEN exact values):
generation · expiration · resend · max attempts · rate limiting · invalidation · **replay prevention** ·
**brute-force protection** · successful-use invalidation · failure/recovery UX. Anti-enumeration via
pending token (Doc 02/03/09) 🔒. Storage candidate: Redis (§13.9) or DB-backed — 🔲 OPEN.

---

## 13.6 — Password-reset flow 🔲 (policy specifics OPEN) / 🔒 (journey shape)

```
Forgot password → email → OTP → verify → new password → confirmation
              → invalidate old recovery state → security notification
```
Audit (🔲 OPEN where undecided): reset abuse · OTP replay · account enumeration (anti-enumeration via
pending token 🔒) · rate limiting 🔲 · **session behavior after reset** (🔲 — invalidate all sessions?
founder decision) · **existing-session invalidation policy** (🔲). On success: invalidate prior recovery
tokens; emit security notification (email, §13.7). Formalize vs Docs 03/04/09 high-level coverage
(§13.18-C4).

---

## 13.7 — Resend / email requirements 🔒 (adapter separation) / 🔲 (templates final)

```
Voeq Notification Domain → Email Adapter → Resend
```
Do NOT couple product domain directly to Resend 🔒. Resend Phase 1 (🔒 placement / 🔲 config); adapter =
swappable. **Required templates (🔲 final content per template):** welcome/registration · email-verification
OTP · password-reset OTP · password-reset confirmation · email-change verification · security notification
· account deactivation · re-consent notification · vendor transactional · **new-conversation / new-message
notification** (messaging, §13.M). Each: subject · preview · sender · Voeq branding · OTP-expiration wording
· security warning · support contact · HTML · plaintext · mobile. **Support email 🔲 OPEN** (do not invent).

---

## 13.8 — Cloudinary / media requirements 🔒 (adapter separation) / 🔲 (specs)

```
Voeq Media Domain → Media Adapter → Cloudinary
```
Do NOT leak Cloudinary details into core `ListingImage` domain contract (Doc 08 §8.4) 🔒. Audit (🔲 OPEN
exact limits, 🔒 principles): upload validation · file types · size limits · transformations · compression ·
responsive variants · thumbnails · deletion · failed uploads · **image moderation (Sightengine, §13.10)** ·
alt text · vendor/listing images · fallback (`ContourMonogram`, Doc 05 B.11) · server-side credentials (Doc
09 §9.15) 🔒. Cloudinary Phase 1 (🔒 placement / 🔲 config); adapter = no lock-in. **(Also governs messaging
attachments if attachments are enabled — §13.M-OPEN.)**

**🔒 LOCKED pipeline ordering (pre-publication moderation — NOT post-publish cleanup):**
```
Upload → server validation → Sightengine moderation → approved → Cloudinary/storage → public availability
```
A rejected image **must never become publicly visible merely because moderation is asynchronous**. Images
enter storage/public availability only after an **approved** moderation result. The moderation result is
**server-authoritative**; the client cannot mark an image as approved. Failed moderation produces a clear
user-facing recovery state (re-upload / contact support). Sightengine categories/thresholds stay explicitly
configurable, not silently invented.

---

## 13.9 — Redis requirements 🔲 (uses OPEN) / 🔒 (justify-or-omit)

State **why + Phase 1 or later** per use:

| Use | Why | Phase | Status |
|---|---|---|---|
| OTP storage/expiry | TTL-native | 1 if justified | 🔲 |
| OTP rate limiting | counter+TTL | 1 if justified | 🔲 |
| Auth throttling | counter+TTL | 1 if justified | 🔲 |
| API rate limiting | counter+TTL | 1 if justified | 🔲 |
| Idempotency keys | TTL set | 1 (Doc 09 §9.8 Tier B) | 🔲 |
| Short-lived cache | offload DB | ⏭/🔲 | 🔲 |
| Abuse prevention | counters | 1 if justified | 🔲 |

Rule: do NOT assign Redis every responsibility; each use justified; defer if unjustified. 🔒 Adapter, no
lock-in. Phase-1 adoption 🔲 OPEN (DB-backed TTL valid alternative). **Real-time transport for messaging is
NOT pre-locked to Redis (§13.M-realtime).**

---

## 13.10 — Sightengine — image moderation / safety 🔒 (role) / 🔲 (API/config mechanism)

**Role (LOCKED):** Sightengine is Voeq's **image moderation / safety** integration. It is **not** a
signature/signing service — the earlier "SignEngine" reference was a naming error; corrected to Sightengine.

- **Detects:** nudity/sexual content · explicit imagery · **other prohibited-image categories Voeq decides
  to enforce** (configurable, not silently invented). 🔒
- **Runs on uploaded images BEFORE publication.** 🔒 Applies to **vendor profile/storefront images** and
  **listing images**. 🔒
- **Rejected images must NEVER become publicly visible merely because moderation is asynchronous.** 🔒
  (Pipeline ordering §13.8.)
- **Moderation result is server-authoritative.** 🔒 The client **cannot** mark an image as approved. 🔒
- **Failed moderation → clear user-facing recovery state** (re-upload / contact support). 🔒
- **Exact Sightengine API/configuration is an integration MECHANISM, not a product-policy decision.** 🔲
  Categories/thresholds remain explicitly configurable. 🔒
- Connects to the Cloudinary pipeline as the pre-publication gate (§13.8): `Upload → server validation →
  Sightengine moderation → approved → Cloudinary/storage → public`.

Phase 1 (🔒 placement / 🔲 exact API + thresholds). Adapter pattern (no lock-in).

---

## 13.11 — One Identity remains absolute 🔒

```
ONE VOEQ IDENTITY
  Capabilities: ├── Shopper  └── Vendor
  Staff:        ├── Moderator ├── Admin └── Super Admin
```
A person becomes a vendor by **gaining Vendor capability** — never a second Voeq identity. 🔒 Do NOT
introduce "Shopper account" / "Vendor account" as two accounts (Doc 08 §8.3, Doc 09 §9.6).

---

## 13.12 — Notification system 🔒 (domain/presentation split) / 🟡 (panel-vs-page)

```
Notification domain → Presentation ├── In-app └── Email
```
Account for: in-app · email · security · vendor · moderation · system · **messaging (new-conversation /
new-message)**. 🔒 Do NOT decide panel-vs-page (🟡 PROVISIONAL, Doc 08 §8.11, Doc 04 PG-SHOP-005). Email →
Resend adapter (§13.7); in-app → presentation layer. Notification domain real; presentation PROVISIONAL.
**Message content must not leak sensitive text into notifications/email (§13.M-safety).**

---

## 13.13 — Messaging: native Voeq direct chat (🔒 LOCKED — WhatsApp removed)

**🔒 DECIDED (founder): Voeq uses native direct chat. WhatsApp is REMOVED from the current product.**

The earlier "external WhatsApp Connect" language (supplied instruction + prior Doc 13 draft §13.13) is
**obsolete and corrected here**, not an alternative architecture. Docs 01–05 already locked WhatsApp
REMOVED; this section aligns Doc 13 with that lock. The original Terms phrasing *"currently facilitates
connection externally through WhatsApp"* is **replaced** by the corrected §13.2 language (Connect = Voeq
native direct chat).

**Sequencing preserved:** messaging is a **feature, not an MVP blocker** (Slice 7, Doc 06). Its
architecture + product requirements are documented fully now so implementation doesn't invent them later.

The complete messaging requirements follow in §13.M.

---

## 13.M — Messaging / Direct Chat requirements (first-class Voeq capability)

> Status key: 🔒 LOCKED · 🟡 PROVISIONAL · 🔲 OPEN (product decision) · ⏭ LATER.

### 13.M.1 — Conversation model 🔒
- **Shopper ↔ Vendor conversations**; one coherent Identity on each side (Doc 08 §8.3). 🔒
- **Ownership/participants:** conversation has exactly two participant Identities (or one + a deactivated/
  anonymized party post-deletion, §13.M-retention). Server is authoritative on participation (Doc 09 §9.10).
  🔒
- **Creation from listing/storefront:** a Connect action on a listing or storefront creates (or reuses) the
  Shopper↔Vendor conversation. 🔒
- **Existing-conversation reuse:** initiating Connect on the same pair **reuses** the existing conversation
  — **no accidental duplicates** (idempotent by participant pair). 🔒 (Tier-A upsert semantics, Doc 09 §9.8.)

### 13.M.2 — Message lifecycle 🔒 (structure) / 🔲 (exact states/transitions)
- `pending → sent → delivered` as the canonical happy path. 🔒
- **failed/retry** state required (network/transport failure). 🔒
- **timestamps:** server-assigned, not client (Doc 09 §9.10 #9). 🔒
- **sender attribution:** server-validated ownership (Doc 09 §9.7 IDOR). 🔒
- **unread/read** state per recipient. 🔒
- **optimistic UI:** client may show pending immediately, but **must not pretend server accepted** — state
  reflects `pending` until server confirms `sent`; on failure, surface retry (no silent success). 🔒

### 13.M.3 — Entry points 🔒
- Connect/message from **listing** (PG-PUB-005) · from **storefront** (PG-PUB-004) · from **vendor profile**
  · from **Messages inbox** (PG-MSG-001) · **notification → conversation** (§13.12). 🔒
- **Authenticated gating:** Connect requires activated, consenting, authenticated identity (§13.2/§13.4).
  Public browsing stays account-free (Doc 04); messaging does not. 🔒

### 13.M.4 — Permissions 🔒 (rules) / 🔲 (some semantics)
- **Who can initiate:** any authenticated Shopper may initiate to any visible Vendor; Vendors reply within
  their own conversations. 🔒
- **Vendor unavailable:** conversations remain readable; new messages queue; vendor capability suspension
  (Doc 09 §9.17) restricts sending, not history. 🔒
- **After account deactivation:** conversation structure survives per §13.M-retention; identifying info
  removed/anonymized. 🔒
- **Blocking/reporting:** per-participant block + report (🔲 block semantics, §13.M-OPEN). 🔒 capability /
  🔲 exact behavior.
- **Moderation access:** staff can **investigate abuse without becoming a conversation participant**
  (read/evidence via staff workbench, Doc 05 C.5.3; no participant insertion). 🔒 (Doc 09 §9.12.)

### 13.M.5 — Safety 🔒 (boundaries) / 🔲 (tuning)
- spam/rate limits (🔲 thresholds; mechanism Doc 09 §9.13). 🔒 boundary / 🔲 numbers.
- report message/conversation. 🔒
- abuse escalation to staff (Doc 09 §9.9). 🔒
- malicious links/content: server-side scan + client sanitization. 🔒
- **attachment policy:** 🔲 OPEN (yes/no + types) — if enabled, uses Cloudinary adapter (§13.8), server-
  validated, never client-decided. 🔲
- **XSS/content sanitization:** all message content sanitized server-side + client-render safe (Doc 09
  §9.14). 🔒
- blocked users: 🔲 semantics (§13.M-OPEN).
- **auditability:** message events + moderation actions in audit log (Doc 09 §9.18), no PII leakage. 🔒

### 13.M.6 — Notifications 🔒 (boundaries) / 🟡 (prefs)
- in-app notification (unread count). 🔒
- email notification where appropriate (🔲 which events; template §13.7). 🔒 / 🔲
- **unread counts** server-authoritative. 🔒
- **notification preferences** 🟡 PROVISIONAL (per-notification-type opt-in/out).
- **do NOT leak sensitive message content** through notifications/email — preview shows sender + generic
  "new message", never body. 🔒 (Doc 09 §9.16 PII.)

### 13.M.7 — Real-time architecture 🔲 (transport OPEN) / 🔒 (contracts first)
- **Transport remains an implementation decision.** 🔲 Redis/WebSockets/Pusher/etc. NOT pre-locked.
- **Redis only if justified** (§13.9) — not assumed for transport. 🔒
- Do NOT prematurely lock a real-time technology. 🔒
- **Repository/domain contracts must work with mock data first, real transport later** (Doc 06/07 §7.7
  `DATA_SOURCE`). Messaging domain (Conversation/Message interfaces, Doc 08 §8.8) is transport-agnostic;
  the mock backend satisfies it; a real transport plugs in at Phase 9 without UI change. 🔒

### 13.M.8 — Data retention / deletion 🔒 (per Doc 09 §9.17)
- account deletion = deactivation + controlled anonymization. 🔒
- **conversation structure survives where necessary** for the other participant. 🔒
- **identifying information removed/anonymized** appropriately (sender becomes "Deleted account" where
  applicable, consistent with review attribution, Doc 09 §9.17). 🔒
- **other participant's history remains coherent.** 🔒
- **staff/audit records remain** (append-only, Doc 09 §9.18). 🔒
- exact retention periods ⏭ LATER (Doc 11 legal work).

### 13.M.9 — UI requirements 🔒 (boundaries) / 🟡 (layout)
- **inbox** (conversation list, unread states). 🔒
- **conversation view** (message thread). 🔒
- **message composer** (text; attachments 🔲). 🔒 / 🔲
- **empty state** · **loading** · **failed message** (retry) · **offline/reconnect** state. 🔒
- **unread state** visual. 🔒
- **mobile-first** behavior (Doc 05 D.7). 🔒
- **desktop two-pane** (inbox + thread) 🟡 if justified (PROVISIONAL).
- **accessibility:** keyboard nav, focus, labels, screen-reader, reduced-motion (Doc 10 §10.8). 🔒
- **reduced-motion:** no perpetual animation; typing/state indicators respect it (Doc 05 D.8). 🔒

### 13.M.10 — Design-system integration 🔒
- Messaging stays within Voeq **Cream environment** (no Deep). 🔒
- **No new visual language** — uses existing tokens/components (Doc 05 B/C). 🔒
- **Density tier = Operational** (Doc 05 B.12) — task-critical info prominent, not editorial. 🔒
- **No decorative contour** (contour is discovery-only, Doc 05 B.11). 🔒
- **Motion:** `cause → response → relationship → transition → rest` (Doc 05 D.1); indicators are
  state-communication, not decoration. 🔒
- task-critical information (sender, unread, failed) remains prominent. 🔒

### 13.M.11 — OPEN / LATER inventory (messaging)
**🔲 OPEN (product decision required):**
- attachments: yes/no + which types
- blocking semantics (one-way/both-way, unblock)
- vendors disabling new conversations
- message editing / deletion
- read receipts
- typing indicators
- message search
- conversation archiving
- notification preferences (per-type)
- exact real-time transport
- retention details (belong in Doc 11 / legal)

**⏭ LATER:** advanced chat features not needed for first usable messaging (reactions, threads, groups,
rich embeds, etc.).

---

## 13.14 — Terminology reconciliation 🔒

- **Shopper** = primary consumer term (not "Buyer"). 🔒 (Doc 03 §1, Doc 02).
- **Vendor / Provider** — "Vendor" canonical role; "Provider" descriptive only (About copy).
- **User / Identity / Account / Capability / Role** — Identity = one real account; Capability =
  Shopper/Vendor/Staff; Role = staff tier. 🔒 (Doc 08 §8.3, Doc 09 §9.6).
- **"Connect"** = Voeq native conversation system (not WhatsApp). 🔒 (this doc).

**Residue (§13.18-C2):** Doc 00 (proposal/context) still uses *"Buyer ↔ vendor"* + *"WhatsApp-first
contact (Phase 1)"* — legacy framing predating the redesign lock. Doc 00 is explicitly a proposal, but
note as legacy-superseded for consistency.

---

## 13.15 — Third-party integration matrix

| Service | Purpose | Domain | Phase | Lock-in? | Status |
|---|---|---|---|---|---|
| Google | Authentication | Identity | 1 | Adapter | 🔒 |
| Resend | Email delivery | Notifications | 1 | Adapter | 🔒 (§13.7) |
| Cloudinary | Media storage/transform | Media | 1 | Adapter | 🔒 (§13.8) |
| Redis | Security/cache/idempotency | Infrastructure | 1 if justified | Adapter | 🔲 (§13.9) |
| *(real-time transport)* | Messaging transport | Messaging | 🔲 OPEN | Adapter | 🔲 (§13.M.7) |
| Sightengine | Image moderation/safety | Media | 1 (pre-publish gate) | Adapter | 🔒 role / 🔲 API (§13.10) |
| *(future)* Payment provider | Transactions | Commerce | ⏭ LATER | Adapter | ⏭ |

No services invented. All adapters (no hard lock-in). Sightengine is the pre-publication image-moderation gate (§13.8/§13.10).

---

## 13.16 — Silent-requirement audit (critical-gap sweep)

Swept 00–12 against the supplied classes + messaging expansion:

**Authentication:** signup ✅ · Google ✅ · email/password ✅ · consent ✅ · OTP ⚠️ (first-class new, §13.5) ·
resend ⚠️ (Resend new, §13.7) · password reset ⚠️ (full journey new, §13.6) · logout/session ⚠️
(invalidation policy OPEN) · account recovery ✅/⚠️ · email changes ⚠️ (OTP flow new).
**Account:** activation ✅ · deactivation ✅ · deletion ✅ · re-consent ✅ · re-registration ✅ · duplicate
prevention ✅.
**Vendor:** onboarding ✅ · verification ✅ · **first-listing requirement ❌ OMITTED** (§13.4) · storefront
✅ · listing CRUD ✅ · uploads ⚠️ (Cloudinary new).
**Shopper:** browsing ✅ · search ✅ · saves/follows/reviews ✅ · reporting ✅ · Connect ✅ (native, §13.13).
**Trust:** verification ✅ · reports ✅ · moderation ✅ · escalation ✅ · audit ✅.
**Communication:** **native messaging ✅ (now fully specified §13.M)** · email ✅ (Resend) · notifications
✅ · WhatsApp ❌ REMOVED (corrected).
**Media:** uploads ✅ · Cloudinary ⚠️ new · failed/imperfect/fallbacks ✅.
**Infrastructure:** Redis ⚠️ new · Resend ⚠️ new · Cloudinary ⚠️ new · auth provider ✅ · secrets ✅ · env ✅
· monitoring ✅ · backups ✅ · rate limiting ⚠️ mechanism OPEN.
**Security:** OTP abuse ⚠️ framework new · reset abuse ⚠️ · session invalidation ⚠️ OPEN · IDOR ✅ · escalation
✅ · consent bypass ✅ · OAuth abuse ⚠️ (add to Doc 09 §9.3) · audit tamper ✅ · **message XSS/sanitization ✅
(§13.M.5)** · **message auditability ✅ (§13.M.5)**.

---

## 13.17 — Critical gaps discovered

1. **G1 — Vendor-visibility rule omitted** from 00–12 (§13.4).
2. **G2 — OTP first-class across all flows** not formalized (§13.5).
3. **G3 — Full password-reset journey + session-invalidation policy** missing (§13.6).
4. **G4 — Resend email adapter + template catalog** net-new (§13.7).
5. **G5 — Cloudinary media adapter + domain boundary** net-new (§13.8).
6. **G6 — Redis evaluation framework** net-new (§13.9).
7. **G7 — Sightengine image-moderation role** (was mislabeled "SignEngine"; corrected to image safety, §13.10).
8. **G8 — Google OTP step** not in Doc 03/07/09 (§13.4 refinement).
9. **G9 — OAuth abuse surface** not enumerated in Doc 09 (§13.16).
10. **G10 — "Buyer" terminology residue** in Doc 00 (§13.14).
11. **G11 — Messaging architecture/requirements were thin** in 00–12 (Doc 03 §7 existed but no full
    conversation/message/permissions/safety/retention spec). Now resolved in §13.M.
12. **G12 — Obsolete WhatsApp Terms/Privacy language** corrected in §13.2/§13.3 (was contradictory).

---

## 13.18 — Required corrections to existing documents (PROPOSED — not applied)

> Per founder rule: propose/explicitly identify before modifying. **None applied yet.** Each needs approval.

- **C1 (Doc 02/03/04/07/08):** Add **vendor-visibility rule** (profile not public until ≥1 published
  listing + consent). High priority.
- **C2 (Doc 00):** Note Doc 00 "Buyer"/"WhatsApp-first" lines as legacy-superseded. Low priority.
- **C3 (Doc 03 §3.1, Doc 07 §7.9, Doc 09 §9.3):** Align auth flows to **OTP-inclusive Google path**.
- **C4 (Doc 03/04/09):** Formalize **password-reset journey** + session-invalidation policy (🔲 the policy,
  document the journey).
- **C5 (Doc 07/09/11):** Add **Resend** adapter + template catalog reference.
- **C6 (Doc 07/08/09):** Add **Cloudinary** adapter; assert `ListingImage` domain provider-independent.
- **C7 (Doc 07/09/11):** Add **Redis** justified-use eval; Phase-1 adoption 🔲 OPEN.
- **C8 (Doc 07/09):** Add **OAuth/Google abuse surface** to Doc 09 §9.3.
- **C9 (Doc 07/08/09):** Add **Sightengine** as the pre-publication image-moderation gate; assert
  `ListingImage`/`VendorProfile` images require an approved moderation result before public availability
  (§13.8/§13.10). Role LOCKED; API/config 🔲 OPEN.
- **C10 (Doc 02/03/04/07 + Terms §13.2):** **WhatsApp contradiction — RESOLVED by founder (removed).**
  Apply corrected Terms/Privacy language (§13.2/§13.3) to the canonical content; Docs 01–05 already align.
  No further change needed there beyond Doc 13.
- **C11 (Doc 03 §7, Doc 07 §7.12, Doc 08 §8.8, Doc 09 §9.12, Doc 10 §10.6):** Fold the **§13.M messaging
  spec** into the respective docs — conversation/message domain (08), real-time transport-agnostic (07),
  staff investigation-without-participation (09), messaging E2E journey + safety tests (10). Proposed;
  applies after founder approval.

---

## 13.19 — New OPEN decisions (explicitly carried)

| Decision | Status | Owning doc |
|---|---|---|
| OTP exact numbers | 🔲 OPEN | Doc 09 §9.5 / §13.5 |
| Session invalidation after reset/recovery | 🔲 OPEN | Doc 09 §9.5 / §13.6 |
| Which sensitive actions need step-up OTP | 🔲 OPEN | Doc 09 §9.5 |
| Resend config + template final content | 🔲 OPEN | §13.7 |
| Cloudinary exact limits/transforms | 🔲 OPEN | §13.8 |
| Redis Phase-1 adoption + uses | 🔲 OPEN | §13.9 |
| Sightengine API/config (categories/thresholds) | 🔲 OPEN | §13.10 |
| Support email | 🔲 OPEN | §13.7 |
| Help/For-Vendors copy | 🔲 OPEN | §13.1 |
| Messaging: attachments/types | 🔲 OPEN | §13.M-OPEN |
| Messaging: block semantics | 🔲 OPEN | §13.M-OPEN |
| Messaging: edit/delete/read-receipts/typing/search/archive | 🔲 OPEN | §13.M-OPEN |
| Messaging: vendor-disable-new-conversations | 🔲 OPEN | §13.M-OPEN |
| Messaging: notification preferences | 🟡 PROVISIONAL | §13.M.6 |
| Messaging: exact real-time transport | 🔲 OPEN | §13.M.7 |
| Messaging: retention details | ⏭ LATER (Doc 11/legal) | §13.M.8 |
| Desktop two-pane messaging | 🟡 PROVISIONAL | §13.M.9 |

All are mechanisms or product decisions flagged OPEN — none invented as LOCKED.

---

## 13.20 — Implementation-readiness verdict

# ⚠️ CONDITIONAL — NOT YET READY

**Blockers before code:**
1. Founder approves §13.18 corrections **C1–C11** (now including messaging-doc fold-in C11 + WhatsApp
   correction C10).
2. Corrections applied to Docs 00–12 (or explicitly waived).
3. **Final cross-document audit (re-run Doc 12)** after corrections → confirm 00–13 consistent.

**Once C1–C11 approved+applied and the re-audit passes → BLUEPRINT READY FOR IMPLEMENTATION.**

No UI, no components, no Next.js, no dependencies, no Slice 0 until then.

---

## 13.21 — What this document does NOT do

- No code; no implementation; no package.json; no Next.js app; no Slice 0.
- Does not treat WhatsApp as an alternative architecture — removed per founder decision (§13.13).
- Does not invent integrations; Sightengine's role is image moderation (§13.10), not a signature service.
- Does not turn OPEN into LOCKED (§13.19).
- Does not apply the proposed corrections (§13.18) — await founder approval.

---

**END OF DOC 13. DO NOT PROCEED TO IMPLEMENTATION — APPROVE §13.18 CORRECTIONS + RE-RUN FINAL AUDIT (DOC 12) FIRST.**
