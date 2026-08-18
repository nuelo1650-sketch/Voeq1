# 09 — SECURITY, TRUST & PERMISSIONS ARCHITECTURE

> **Status:** PLANNING / DOCUMENTATION ONLY. No code. Does **not** modify Docs 00–08b. **Do NOT begin Doc
> 10.** Return for founder review/lock.
>
> **Authoritative constraints:** Docs 00–08b (product LOCKED; design LOCKED; data model Doc 08; consent
> + silent-requirements audit 08b). The six LOCKED consent/auth principles (08b §1) are carried verbatim.
>
> **Governing rule (founder):** Security architecture **protects the product model; it does not redefine
> it.** Where a product policy is genuinely undecided, this document marks it 🔲 OPEN and exposes the
> decision — it does NOT invent a convenient behavior. This is not a generic OWASP essay; every section is
> tied to Voeq's pages, identities, listings, storefronts, vendors, shoppers, staff, messaging, consent,
> and trust model.
>
> **Status vocabulary:** 🔒 LOCKED · 🟡 PROVISIONAL · 🔲 OPEN (undecided → exposed, not guessed) · ⏭ LATER.

---

## 9.1 — Locked foundations this document must not contradict

- One Identity for Shopper + Vendor; role/capability, never two accounts (Doc 08 §8.3).
- Duplicate-account auto-merge = ❌ REJECTED (Doc 03 §3.5). Existing identity → authenticate/link, never silent merge.
- Consent is a 🔒 domain requirement: `ConsentAcceptance` record (Doc 08 §8.3). Google does NOT bypass it
  (08b §1.2; Doc 03 §3.1; Doc 07 §7.9).
- Google + email/password → same Voeq Identity + same consent gate (08b §1.4/1.5).
- Verification is honest: `unverified` is a real state, never a counterfeit badge (Doc 08 §8.9).
- Moderation follows `Report → StaffCase → Decision → Consequence` (Doc 08 §8.13; Doc 05 C.5.3).
- Staff roles distinct: Moderator ≠ Admin ≠ Super Admin (Doc 04 §3.7).

---

## 9.2 — Threat model (Voeq-specific)

Voeq is a **public campus marketplace** with user-generated content, native messaging, and a staff
moderation surface. Realistic threats, ranked by our context (not a generic list):

| Threat | Voeq context | Mitigation anchor |
|---|---|---|
| **Fake/impersonation vendors** | A bad actor creates a vendor posing as a campus business; erodes trust (our core asset) | Campus-anchored identity + Verification (§9.9); report flow |
| **Content abuse (scam listings, harassing messages)** | UGC + native messaging = abuse surface | Listing moderation state (§9.9); message reporting; rate limits (§9.13) |
| **Consent circumvention** | "Google login = already agreed" trap | Consent gate enforced server-side, both methods (§9.4) |
| **Privilege escalation** | Moderator reaching Admin/Super Admin powers | Capability matrix enforced server-side (§9.6); Moderator scope OPEN but bounded |
| **IDOR / ownership bypass** | Editing another vendor's listing, reading private messages | Ownership checks on every state-changing op (§9.7) |
| **Spam/flood (listings, reviews, reports, messages)** | Low-friction posting attracts spam | Idempotency + rate limits (§9.8, §9.13) |
| **Session theft / fixation** | Compromised cookie → account takeover | HttpOnly session, rotation, binding (§9.5) |
| **XSS via UGC (listing text, review body, vendor bio)** | Rich text fields render to other users | Output encoding + sanitization at boundary (§9.14) |
| **CSRF on mutations** | Forged state change from another site | CSRF token / SameSite (§9.14) |
| **Image upload abuse (malware, non-image, oversized)** | Vendors upload arbitrary files | Server-side validation + processing (§9.15) |
| **PII leakage (logs, error messages, public APIs)** | Email/phone exposed in listings or traces | PII boundaries (§9.16) |
| **Information leakage via error messages** | "User not found" vs "wrong password" | Uniform auth errors (§9.17) |
| **Enumeration (signup/exists probes)** | Probing which emails are registered | Token-gated verification; uniform responses (Doc 03 §3.1) |

This is the threat surface the rest of the document defends.

---

## 9.3 — Authentication architecture (Google + email/password)

Both methods resolve into the **same Voeq Identity** (Doc 08 §8.3). No "Google users" vs "email users".

- **Email/password:** email + OTP/magic-link (Doc 03 §3.1). Passwords (if credential-based variant used)
  🔲 OPEN mechanism — but storage is always server-side, hashed (argon2/bcrypt class), never client-visible.
- **Google OAuth:** Google authenticates *who*; Voeq still requires its own consent gate (08b §1.2). Google
  `sub`/email maps to an existing Identity by verified email → authenticate/link; never create duplicate
  (Doc 03 §3.5). **Google does NOT grant pre-consent** (Doc 07 §7.9). **OTP-inclusive (C3, Doc 13 §13.4):**
  the Google path also requires **Voeq OTP verification** before activation — Google identity resolution
  does not skip OTP; both methods use the same anti-enumeration pending-token OTP gate.
- **Single coherent auth (LOCKED):** one session, one sign-in, across roles. Session strategy (NextAuth vs
  custom) = 🔲 OPEN, but must support: server-side session, role derived from one Identity, consent gate
  before completion.
- **`?next=` deep-link preservation:** protected route → `/auth/login?next=<intended>`; return intent after
  auth (Doc 04 §838/§841). Applies to messaging/compose entry (Slice 7, not MVP).
- **OAuth / Google abuse surface (C8, Doc 13 §13.16):** Google OAuth is an identity *source*, not a trust
  shortcut. Abuse vectors to defend: (1) **account-takeover via linked Google** — link only to an existing
  Identity by *verified* email; never auto-create/merge (§9.3, Doc 03 §3.5). (2) **Consent bypass attempt**
  — Google identity resolution must NOT skip the Voeq consent gate or OTP step (C3, §9.4, Doc 07 §7.9).
  (3) **OTP/abuse farming via Google** — Google auth requests are rate-limited/throttled like email (§9.13);
  anti-enumeration via pending token. (4) **Fake/impersonation vendor via OAuth** — verification (§9.9) and
  campus-anchor still required; OAuth provider does not confer vendor trust. (5) **Token/session fixation** —
  OAuth `state` param validated; session HttpOnly/SameSite/rotated (§9.5). OAuth client secret server-only
  (§9.20). Google is one of several auth methods; none grants pre-consent or pre-trust.

---

## 9.4 — Consent enforcement (server-side, both methods)

- The `ConsentAcceptance` record (Doc 08 §8.3) is **created server-side** at the consent gate (IDN-009),
  not merely a frontend checkbox. The account is **not** finalized as "completed" until this record exists
  for the current Terms + Privacy versions.
- **Google path:** after Google OAuth returns identity, the flow routes to the **same** consent gate. No
  completed account without `ConsentAcceptance`. (Doc 03 §3.1 C1; Doc 07 §7.9 C3.)
- The unchecked box UI (Doc 08b §1.1) is the *presentation*; the *authority* is the domain record. Client
  cannot self-assert consent validity (§9.10).

---

## 9.5 — Session & account security

- **Session token:** HttpOnly, Secure, SameSite=Lax (or Strict for sensitive), server-side store/rotate.
  🔲 exact store (DB vs signed cookie) OPEN.
- **Expiry/idle:** idle/expired session on protected action → intercept → re-auth → **preserve intended
  destination** (Doc 03 §3.9). Revoked session → hard redirect to landing (§3.10).
- **Logout (Doc 03 §3.8):** revoke server-side; on client revoke failure, clear local + warn (never assume
  server success).
- **Recovery (Doc 03 §3.6, C4 / Doc 13 §13.6):** OTP-based; rate-limited; expired/invalid recovery OTP or
  token = explicit expired state (§3.7), not silent retry. On success: invalidate prior **recovery** tokens
  + emit security notification (Doc 13 §13.7). Anti-enumeration via pending token.
- **Session invalidation after password reset (🔲 OPEN — founder policy):** whether reset also revokes
  *all existing sessions* is undecided; do NOT silently invalidate sessions on reset. Carried OPEN; revisit
  at Slice 5 (auth). Mechanism 🔲 OPEN, not a LOCKED behavior.
- **Suspended/banned (Doc 03 §3.11/3.12):** blocked at auth with reason + **appeal path**. Appeal
  *path* LOCKED; appeal *mechanism* = 🔲 OPEN.

---

## 9.6 — Authorization & capability matrix (🔒 roles + 🔒 explicit scope, founder-locked)

Capabilities derived from **one Identity** (Doc 08 §8.14). One Identity can hold multiple capabilities.
Moderator scope is bounded — it does **NOT** silently inherit Admin/Super Admin.

| Capability | Shopper | Vendor | Moderator | Admin | Super Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| `listing.create/edit/remove` (own) | – | ✅ | – | – | – |
| `vendor.message` (own storefront) | – | ✅ | – | – | – |
| `review.read/submit` | ✅ | ✅ | – | – | – |
| `review.respond` (own vendor) | – | ✅ | – | – | – |
| `follow/save/like` | ✅ | ✅ | – | – | – |
| `staff.queue.view` | – | – | ✅ | ✅ | ✅ |
| `staff.case.decide` (within scope) | – | – | ✅ (scoped) | ✅ | ✅ |
| `staff.config` | – | – | – | ✅ | ✅ |
| `staff.admin` (staff accounts, roles) | – | – | – | ✅ | ✅ |
| `capability.grant` | – | – | – | – | ✅ (only Super Admin) |

**Distinctions (founder requirement):**
- **Authentication** = proving who you are (§9.3).
- **Authorization** = are you allowed to reach this route/session (role-based, server-side).
- **Capability** = what actions your role may perform (the matrix above).
- **Ownership** = does this specific record belong to you (§9.7) — independent of capability (a Vendor can
  edit *their* listing, not another's).
- **Staff authority** = scoped decision power over *other* users' content.

**Explicit Moderator scope (🔒 LOCKED):**
- **CAN:** review reports; review listings; review verification submissions; take permitted content/account
  moderation actions; handle assigned disputes/cases; view the evidence/context necessary for those cases;
  escalate cases; view relevant case history.
- **CANNOT:** grant capabilities; change roles; modify security configuration; modify platform
  configuration; access unrestricted PII; alter audit records; override Admin/Super Admin decisions;
  perform Super Admin destructive operations.

**Admin (🔒 LOCKED):** everything operationally necessary above Moderator, plus broader account/platform
administration. **Still cannot perform Super Admin-only authority.**

**Super Admin (🔒 LOCKED):** `capability.grant`; highest-risk configuration; Super-Admin-only
destructive/security actions; final authority over staff capabilities.

- **Server-side enforcement:** every mutation checks (1) authenticated, (2) capability present, (3)
  ownership/authorization for the target record. Client capability claims are never trusted (Doc 07 §7.19).
- **Moderator ≠ Admin ≠ Super Admin (LOCKED):** a Moderator's authority is explicitly bounded by the
  CAN/CANNOT lists above; it cannot perform `staff.config`, `staff.admin`, or `capability.grant`.
- **Attribution:** every staff action (Moderator/Admin/Super Admin) is recorded in `AuditRecord` (Doc 08
  §8.13) and remains attributable + auditable (§9.18). No staff action is anonymous.

---

## 9.7 — Ownership checks

Every state-changing operation on a user-owned resource enforces ownership server-side:
- Listing create/edit/remove → `listing.vendorId === identity.vendorId`.
- Review respond → vendor owns the reviewed vendor.
- Message send → sender is a participant of the conversation.
- Save/follow/like toggle → actor is the requesting identity.
- Storefront edit → vendor owns the storefront.
IDOR is prevented by these checks, not by URL obscurity.

---

## 9.8 — Idempotency / duplicate-action protection

Goal: prevent accidental double-submit and replay **without inventing unnecessary infrastructure**. Two
tiers:

**Tier A — client-intent idempotency (no server infra):** save/follow/like/review/report are naturally
idempotent by key (actor+target). The repo layer upserts by (actorId, targetId); a second click toggles or
no-ops, never duplicates. This already falls out of the relationship-record model (Doc 08 §8.7).

**Tier B — server-side idempotency key (only where replay is harmful):** listing creation, staff decisions,
and message sends use a client-supplied idempotency key (or derived from (conversationId, clientMsgId))
deduplicated server-side for a short window. Messenger already requires "no duplicate sends" (Doc 03 §46,
Doc 04 §510) — this makes it architectural.

| Operation | Idempotency mechanism | Status |
|---|---|---|
| Save / Follow / Like | upsert by (actor, target) — Tier A | 🔒 (Doc 08 model) |
| Review submit | one review per (author, vendor) upsert; multiple vendors OK | 🔒 |
| Report | one open report per (reporter, target) — Tier A | 🔒 |
| Listing create | idempotency key on submit — Tier B | 🟡 |
| Message send | (conversationId, clientMsgId) dedup — Tier B (Doc 03 §46) | 🔒 product / 🔲 mechanism |
| Staff decision | idempotency key on case action — Tier B | 🟡 |

No new queue/broker required for Phase 1. The boundary: idempotency protects *accidental* repeats, not
*intentional* distinct actions (e.g., editing a listing twice is two valid states).

---

## 9.9 — Verification & trust rules

- **Verification tiers** (Doc 08 §8.9): `unverified | pending | verified | flagged`. `unverified` is an
  honest, displayable state (Doc 05 C.3.2) — never faked client-side.
- **Verification status is server-authoritative** (§9.10): the client never sets or infers its own
  verification; it renders what the domain says.
- **Method** (campus_email / id_upload / manual_review) = 🔲 OPEN (Doc 08 §8.9) — product LOCKED that it
  exists and is honest; mechanism decided here as OPEN.
- **Trust display (B.16):** storefront shows verified + rating + responseIndicator + openNow. These are
  derived/domain values, not client-computed (Doc 08 §8.4 trust layer).
- **Reporting/abuse protection:** `Report` (Doc 08 §8.10) feeds `StaffCase`; reporter identity protected
  from the reported party where policy allows (🔲 OPEN visibility rule). Anti-retaliation: reporter hidden
  from reported vendor by default (🟡 provisional).

---

## 9.10 — Trust & security boundaries: what the CLIENT is NEVER allowed to decide

This is the authoritative server/domain boundary. Any of these asserted client-side is ignored and treated
as unauthorized:

1. **Role / capability grants** — only the server assigns capabilities from one Identity (§9.6).
2. **Verification status** — server-authoritative; client cannot self-verify or downgrade others.
3. **Ownership** — server enforces; client `vendorId` is untrusted input (§9.7).
4. **Listing moderation state** (`active`/`removed`/`moderated`) — set by staff/server, not vendor/client.
5. **Staff decisions** (warn/hide/suspend/escalate) — only StaffCase authority, scoped (§9.6).
6. **Consent validity** — `ConsentAcceptance` is the domain record; client cannot assert "I agreed."
7. **Prices / financial authority** — price is vendor-set within bounds; no client-side price override.
   (Payments deferred per Doc 02; when added, financial authority is server-only.)
8. **Audit records** — `AuditRecord` (Doc 08 §8.13) is append-only, server-written; client cannot create
   or alter.
9. **Security-sensitive timestamps** — `createdAt`/`acceptedAt` are server-generated; client-supplied
   times are ignored.
10. **Account status** (`suspended`/`banned`/`deleted`) — server-only; client cannot self-reinstate.

The pattern: **the client describes intent; the server decides authority.** This is the spine of §9.6–§9.9.

---

## 9.11 — Vendor / shopper boundary

- One Identity; `role` widens shopper→vendor (Doc 08 §8.3). A vendor **also** behaves as a shopper (can
  save/follow/message) — same Identity, additional capability, not a second account.
- Vendor-only surfaces (`/vendor/*`) require `vendor` capability; shopper surfaces (`/shopper/*`) require
  authenticated identity. Both gated server-side (Doc 07 §7.9).
- Storefront publication gated: not published until onboarding step 5 complete (Doc 03) — server enforces
  `status:'draft'` until then, never client-self-publish.

---

## 9.12 — Staff escalation boundaries

- Moderator → Admin → Super Admin is a strict capability hierarchy (§9.6). `capability.grant` is
  **Super Admin only**.
- Escalation (Moderator → Admin) is a staff action itself, audit-logged (§9.18), never self-promotion.
- Staff actions operate on *other* users' content; a staff member cannot moderate their own vendor/account
  without separation-of-duties check (🔲 OPEN: whether self-conflict block is enforced — exposed, not
  assumed).
- **Messaging investigation — staff do NOT become participants (C11, Doc 13 §13.M.4):** moderators/staff
  investigate abusive conversations via the staff workbench (read/evidence access, Doc 05 C.5.3) **without
  being inserted as a conversation participant**. Participation is server-authoritative (§9.10); staff access
  is observation/evidence, never a message-sender role.

---

## 9.13 — Rate limiting (where justified)

Applied at the boundary to stop spam/flood without burdening normal use:
- Auth: OTP/magic + recovery requests rate-limited (Doc 03 §3.1 lockout).
- UGC: listing create, review submit, report submit, message send — per-identity burst limits.
- Search/API: per-IP / per-token ceilings to protect the public slices.
Mechanism (token bucket / sliding window, middleware vs edge) = 🔲 OPEN; the *requirement* is LOCKED where
Doc 03/04 already mandate it.

---

## 9.14 — XSS / CSRF / injection protections

- **XSS:** all UGC (listing title/description, review body, vendor bio, message body) is treated as
  untrusted; output encoding at render + sanitization at ingest. No `dangerouslySetInnerHTML` with UGC.
  Markdown (if offered) rendered via a sanitizing renderer.
- **CSRF:** state-changing requests protected via SameSite cookies + CSRF token on non-GET mutations
  (mechanism 🔲 OPEN, requirement LOCKED).
- **Injection:** parameterized queries / ORM only (no string-built SQL); repository layer (Doc 07 §7.7)
  is the single data boundary, preventing injection at the source.
- **IDOR** covered by §9.7 ownership checks.

---

## 9.15 — Secure file / image handling

- Vendor-uploaded images validated server-side: real image type, size cap, dimension check, malware scan
  (🔲 OPEN scanner). Never executed; processed/cropped server-side to B.6 ratios (Doc 07 §7.10).
- Stored in object storage (provider ⏭ LATER, Doc 11); served via CDN; client never receives upload
  credentials.
- Broken/missing image → `ContourMonogram` placeholder (Doc 05 B.11), not a raw error.
- **Pre-publication image moderation gate (C9, Doc 13 §13.10):** vendor profile/storefront + listing images
  pass through **Sightengine moderation BEFORE publication**. The moderation result is **server-authoritative**
  — the client cannot self-approve an image. A rejected image must NEVER become publicly visible merely
  because moderation runs async; images enter storage/public availability only after an **approved** result.
  Pipeline (Doc 07 §7.7.1 / §13.8): `Upload → server validation → Sightengine → approved → Cloudinary/storage
  → public`. Failed moderation → clear re-upload / contact-support state. Exact Sightengine API/categories/
  thresholds 🔲 OPEN (configurable, not silently invented).

---

## 9.16 — PII / privacy boundaries

- **PII minimized in transit/storage:** email/phone are not exposed in public listing/storefront views;
  contact goes through native messaging (Doc 01/03). 
- **Consent + PII linkage:** `ConsentAcceptance.identityId` ties consent to identity without leaking PII in
  the record itself.
- **Logs** (§9.18) never contain raw PII (emails, phones, tokens). Structured logs reference IDs.
- **Data retention** (deletion consequences §9.17) interacts with PII retention — legal window = ⏭ LATER
  (Doc 11), exposed as OPEN here.

---

## 9.17 — Account deletion consequences (🔒 LOCKED policy: deactivation + controlled anonymization)

**Policy (founder-locked): Voeq uses DEACTIVATION + CONTROLLED ANONYMIZATION, not destructive cascading
deletion.** Deleting an account removes the person's *active identity* from Voeq; it does **not** rewrite
history or destroy records required for trust, safety, and platform integrity. Technical mechanics
(soft-delete vs anonymize implementation) = 🔲 OPEN (Doc 11); the product policy below is 🔒 LOCKED.

| Consequence | Product policy (🔒 LOCKED) |
|---|---|
| **Identity** | Deactivated (not hard-deleted). |
| **Vendor storefront** | Becomes unavailable/deactivated — never a broken 404/500 (Doc 04 PG-PUB-004). |
| **Listings** | Unpublished, no longer discoverable. |
| **Reviews** | Preserved where necessary for marketplace integrity, attributed to **"Deleted account"** (identity removed, not the record). |
| **Likes/saves/follows** | Removed/anonymized as appropriate. |
| **Conversations/messages** | Conversation structure preserved where required for the *other* participant; identifying account info removed. |
| **Staff cases / audit records** | **Retained** — accountability cannot disappear because an account was deleted (Doc 08 §8.13). |
| **Re-registration** | Creates a **new Identity**. No automatic restoration or silent relinking (consistent with ❌ auto-merge REJECTED). |

**Principle (LOCKED):** *Deleting an account removes the person's active identity from Voeq; it does not
rewrite history or destroy records required for trust, safety, and platform integrity.* Exact legal
retention periods = ⏭ LATER (Doc 11).

---

## 9.18 — Auditability & security logging

- **AuditRecord** (Doc 08 §8.13) append-only, server-written for all staff actions + capability changes +
  consent events. Client cannot write/alter (§9.10 #8).
- **Security logs:** structured, ID-referenced, **no PII / no secrets / no tokens** (§9.16). Log auth
  failures (uniform, no enumeration — §9.2), privilege checks, idempotency collisions.
- Logs support moderation audit + incident response; never exposed to non-staff.

---

## 9.19 — Error-message information leakage

- **Uniform auth responses:** "Invalid credentials" (never "user not found" vs "wrong password") to prevent
  enumeration (Doc 03 §3.1).
- **Generic server errors:** actionable copy to user, no stack traces / internal IDs / SQL in responses
  (Doc 05 C.5.4, Doc 07 §7.14).
- **404 vs 403:** protected resource for unauthenticated → 403/redirect to login (not "exists but denied"
  disclosure).

---

## 9.20 — Secrets & environment boundaries

- Secrets (session secret, OAuth client secret, API keys) server-only; never in client bundle; `NEXT_PUBLIC_*`
  only for non-sensitive config (Doc 07 §7.17).
- `DATA_SOURCE=mock|api` toggle (Doc 07 §7.17) — mock never ships secrets; real backend reads from secret
  store (⏭ LATER, Doc 11).

---

## 9.21 — Account recovery considerations

- Recovery is rate-limited, token-expiry-enforced, and routes to **existing** identity (Doc 03 §3.6). A
  recovery attempt on an email already linked to a Google identity must offer the Google path, not create a
  second account (consistent with ❌ auto-merge REJECTED).
- Recovery + consent: a recovered account that predates a new Terms version may require re-consent (§9.22).

---

## 9.22 — Terms / Privacy re-consent (🔲 OPEN policy, 🔒 requirement)

- **Versioned acceptance is LOCKED** (Doc 08 §8.3 `ConsentAcceptance.termsVersion/privacyVersion`).
- **When a document changes:** a new version is published; users whose `ConsentAcceptance` lags the current
  version are *flagged* for re-consent.
- **Re-consent policy (🔒 LOCKED — hard gate, founder):** a user **must accept the current Terms + Privacy
  versions before continuing normal authenticated use.** Not hostile: they may still reach the minimum
  surfaces needed to understand what changed and accept — `Current session → re-consent screen →
  Terms/Privacy → accept → normal Voeq access`. Until accepted, **all meaningful authenticated mutations
  are blocked**: no listing creation, no messaging, no reviews, no saves/follows/likes, no vendor
  operations, no staff operations, no other state-changing actions. Read/discovery of public content
  remains available so the gate is understandable, not a wall.
- **Google + email follow the exact same requirement** (08b §1.2/1.4) — re-consent is method-agnostic and
  enforced identically. This is consistent with the original LOCKED principle: **authentication
  establishes *who you are*, not *that you've agreed to Voeq's terms*.**
- Re-consent is a *fresh* consent event, recorded as `method:'re_consent'` in `ConsentAcceptance` (Doc 08
  §8.3). The server enforces the version check (accepted → current) on every state-changing operation.

---

## 9.23 — Status summary (LOCKED / PROVISIONAL / OPEN / LATER)

| Item | Status |
|---|---|
| One Identity / no auto-merge | 🔒 LOCKED |
| Consent = domain record; Google no bypass | 🔒 LOCKED |
| Capability matrix + explicit Moderator/Admin/Super Admin scope | 🔒 LOCKED (founder) |
| Account-deletion policy (deactivation + controlled anonymization) | 🔒 LOCKED (founder) |
| Re-consent policy (hard gate, non-hostile) | 🔒 LOCKED (founder) |
| Ownership checks / IDOR prevention | 🔒 LOCKED (pattern) |
| Client-never-decides list (§9.10) | 🔒 LOCKED |
| Idempotency (save/follow/like/review/report) | 🔒 (Tier A) |
| Idempotency (listing/staff/message) | 🟡 (Tier B key) |
| Storefront unavailable-on-delete visibility | 🔒 LOCKED |
| Audit/StaffCase append-only | 🔒 LOCKED |
| Staff action attribution/auditability | 🔒 LOCKED |
| Session strategy (NextAuth vs custom) | 🔲 OPEN |
| Verification method | 🔲 OPEN |
| Rate-limit mechanism | 🔲 OPEN |
| CSRF mechanism | 🔲 OPEN |
| Image scanner | 🔲 OPEN |
| Self-conflict staff moderation block | 🔲 OPEN |
| Reporter visibility vs reported | 🟡 provisional |
| Data-retention legal window | ⏭ LATER (Doc 11) |
| Image storage provider | ⏭ LATER (Doc 11) |

---

## 9.24 — What Doc 09 does NOT do

- No code; architecture documentation only.
- Does not modify Docs 00–08b.
- Does **not invent product policy** — remaining 🔲 OPEN items (verification method, session/rate-limit/
  CSRF mechanisms, self-conflict staff block, reporter visibility) are explicitly OPEN; deletion policy,
  re-consent stance, and Moderator/Admin/Super-Admin scope were founder-locked in §9.6/§9.17/§9.22.
- Does not weaken any LOCKED decision (consent, single-identity, no-auto-merge, honest verification,
  distinct staff roles).
- Does not begin Doc 10.

---

**END OF DOC 09 (Security, Trust & Permissions). Return to founder for strict review + lock gate. Do NOT proceed to Doc 10.**
