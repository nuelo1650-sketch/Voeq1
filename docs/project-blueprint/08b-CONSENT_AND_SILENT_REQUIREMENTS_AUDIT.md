# 08b — CONSENT & SILENT-REQUIREMENTS AUDIT (pre-Doc-09 supplement)

> **Status:** PLANNING / DOCUMENTATION ONLY. No code. **Does NOT modify Docs 00–08** (corrections are
> PROPOSED for founder approval, not applied). **Do NOT begin Document 09.** Return findings for review.
>
> **Purpose (founder):** catch product requirements that are "obvious to us but written nowhere
> authoritative" *before* implementation — specifically the Terms/Privacy agreement and a cross-document
> silent-requirements sweep. **Do not invent new product features.** Surface omissions + contradictions,
> classify each, and point to the document where it belongs.
>
> **Two distinct buckets (founder's key distinction):**
> - **FORGOTTEN DECISION** = we already decided it (implicitly), but it isn't written explicitly.
> - **UNDECIDED** = we actually have not decided this yet.
> These are treated differently below.

---

## 1 — Locked consent / authentication principles (authoritative NOW)

These are locked as product requirements regardless of where they are later written:

1. **Terms/Privacy agreement is mandatory for every account creation, both roles.** Shopper AND Vendor
   must explicitly agree to applicable TOS + Privacy before account completion. No pre-checked box.
2. **Google authentication does NOT bypass the agreement.** Google answers "who are you?"; Voeq still
   answers "have you agreed to use Voeq?" → `Google auth → Voeq agreement → account completion`, never
   `Google → instant account → assumed consent`.
3. **Consent is a real product/domain requirement, not frontend-only state.** A consent/acceptance
   record tied to the identity must exist, containing at minimum: identity ID, Terms version, Privacy
   version, acceptance timestamp, acceptance context/method. Storage impl = OPEN (Doc 09); requirement =
   LOCKED now. Re-consent handling on Terms update is a related (currently UNDECIDED) concern (§3).
4. **Google is a first-class auth method** alongside email/password; both resolve into the **same Voeq
   Identity** (not "Google users" vs "email users").
5. **Google + email obey the existing duplicate-account prevention + single-coherent-auth rules** (Doc 03
   FLOW-AUTH-DUP: existing identity → authenticate/link existing account; auto-merge REJECTED).
6. **Shopper + Vendor resolve to the same Identity** (role/capability, never a second account). Signup UX
   must never silently create two identities.

---

## 2 — Proposed minimal corrections to earlier docs (NOT yet applied — founder approval)

| # | Target doc | Minimal correction | Type |
|---|---|---|---|
| C1 | Doc 03 §3.1 (`FLOW-AUTH-REG`) | After Google branch, explicitly state Google users are routed through the **same** post-auth consent gate (IDN-009) before account completion. Currently implied by "post-auth gate sequence" but not explicit. | FORGOTTEN DECISION → make explicit |
| C2 | Doc 08 §8.3 / new §8.x | Add a `ConsentAcceptance` domain record (id, identityId, termsVersion, privacyVersion, acceptedAt, method/context). Currently absent from the model. | OMMISSION → add (product req LOCKED, storage OPEN) |
| C3 | Doc 07 §7.9 | Add one line: "Google OAuth and email/password both terminate in the same consent gate + single Identity; Google does not grant pre-consent." | FORGOTTEN DECISION → make explicit |
| C4 | Doc 01 §auth | Already says "forced consent" — fine; no change. Note for consistency only. | — |
| C5 | Doc 04 PG-AUTH-001 | Already lists consent IDN-009 in deps — fine; no change. | — |

None of C1–C3 change product behavior; they make an already-decided behavior **explicit and auditable.**

---

## 3 — Cross-document silent-requirements audit

Classification: 🔒 LOCKED · 🟡 PROVISIONAL · 🔲 OPEN (undecided) · ⏭ LATER · ❌ REJECTED.
"Bucket" column: **F** = forgotten decision (decided, undocumented) · **U** = undecided · **X** = already explicit.

### 3.1 Authentication & account lifecycle
| Requirement | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Email/password signup | 🔒 | X | Doc 03 §3.1 | |
| Google signup | 🔒 | X | Doc 03 §3.1 | |
| Google login | 🔒 | X | Doc 03 §3.2 | |
| Agreement required BOTH roles | 🔒 | F | Doc 03 §3.1, Doc 01 | implied by gate; now explicit (§1.1) |
| **Google does NOT bypass agreement** | 🔒 | F | Doc 03 §3.1, Doc 07 §7.9 | implied; explicit via C1/C3 |
| Existing Google identity → auth existing | 🔒 | X | Doc 03 §3.1/§3.5 | |
| Existing email identity → no duplicate | 🔒 | X | Doc 03 §3.5 | |
| Same identity Shopper/Vendor | 🔒 | X | Doc 08 §8.3, Doc 03 | |
| `?next=` redirect preserved | 🔒 | X | Doc 04 §838/§841, Doc 03 §3.9 | |
| Verification state | 🔒 | X | Doc 03 §3.3, Doc 04 | |
| Password recovery | 🔒 | X | Doc 03 §3.6 | |
| Suspended/banned state + appeal | 🔒 | X | Doc 03 §3.11/3.12, Doc 04 PG-AUTH-004 | appeal *path* LOCKED; appeal *mechanism* 🔲 |
| Logout / session revoke | 🔒 | X | Doc 03 §3.8 | |
| Auth vs unauth navigation | 🔒 | X | Doc 04 routing | |
| **Account deletion → consequences** | 🔲 | **U** | Doc 09 | see §3.6 — NOT decided |
| **Re-consent when Terms update** | 🔲 | **U** | Doc 09 | NOT decided |
| **Re-registration after deletion** | 🔲 | **U** | Doc 09 | NOT decided |
| **Data retention on deletion** | ⏭ | **U** | Doc 09/11 | legal, NOT decided |

### 3.2 Legal / consent
| Requirement | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Terms version accepted | 🔒 req / 🔲 store | F | Doc 08 (C2) | product req LOCKED; record missing |
| Privacy version accepted | 🔒 req / 🔲 store | F | Doc 08 (C2) | |
| Consent timestamp | 🔒 req / 🔲 store | F | Doc 08 (C2) | |
| Acceptance context/method | 🔒 req / 🔲 store | F | Doc 08 (C2) | |
| Re-consent on Terms update | 🔲 | **U** | Doc 09 | NOT decided |
| No pre-checked consent | 🔒 | X | Doc 03/04 (now §1.1) | |
| Terms/Privacy accessible pre-completion | 🔒 | X | Doc 04 PG-PUB-007 + legal pages | |

### 3.3 Vendor
| Requirement | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Vendor intent at registration | 🔒 | X | Doc 03 §3.1 | |
| Vendor onboarding after auth (5-step) | 🔒 | X | Doc 03 FLOW-ONB-VEND | |
| Incomplete onboarding recovery (resume) | 🔒 | X | Doc 03 § (abandoned→resume) | |
| Storefront not published prematurely | 🔒 | X | Doc 03 (draft until step 5) | |
| Verification honest (no fake badge) | 🔒 | X | Doc 08 §8.9 | |
| Listing moderation state | 🔒 | X | Doc 08 §8.5 | |
| Vendor multiple listings | 🔒 | X | Doc 08 | |
| Vendor can also be shopper | 🔒 | X | Doc 08 §8.3 | |

### 3.4 Public marketplace / empty & error states
| Requirement | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Campus context | 🔒 | X | Doc 03/04 | |
| No vendors (empty) | 🔒 | X | Doc 05 C.5.4, Doc 04 | first-class empty state |
| No listings (empty) | 🔒 | X | Doc 05/04 | |
| Search zero results | 🔒 | X | Doc 04 empty states | |
| Vendor zero listings | 🔒 | X | Doc 05/04 | |
| Listing unavailable | 🔒 | X | Doc 04 error/recovery | |
| Deleted/suspended vendor | 🔒 | X | Doc 04 PG-PUB-004 | public "unavailable" not 500 |
| Deleted listing | 🔒 | X | Doc 04 | |
| Broken/missing image → ContourMonogram | 🔒 | X | Doc 05 B.6/B.11 | |
| **Save/follow while unauthenticated** | 🔒 | F | Doc 03/04 | gate to auth; implied, make explicit |
| **Message while unauthenticated** | 🔒 | F | Doc 04 §841 | protected → login `?next`; implied |

### 3.5 Trust & moderation
| Requirement | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Verified state meaning (tiers) | 🔒 | X | Doc 08 §8.9 | |
| Report ownership / lifecycle | 🔒 | X | Doc 08 §8.10, Doc 03 | |
| Moderation decisions | 🔒 | X | Doc 08 StaffCase | |
| Appeals (path) | 🔒 | X | Doc 03 §3.11/3.12 | *mechanism* 🔲 |
| Suspension vs ban (distinct) | 🔒 | X | Doc 03 | |
| Auditability | 🔒 | X | Doc 08 AuditRecord | |
| **Staff capability boundaries (exact)** | 🔲 | **U** | Doc 09 | moderator scope OPEN (Doc 04 §22) |
| Moderator ≠ Admin ≠ Super Admin | 🔒 (distinct roles) / 🔲 (matrix) | X/F | Doc 04 §3.7, Doc 08 §8.14 | roles distinct; exact matrix OPEN |

### 3.6 Account lifecycle — deletion consequences (the real gap)
| Consequence | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Listings on account deletion | 🔲 | **U** | Doc 09 | soft-delete? unpublish? transfer? NOT decided |
| Reviews on account deletion | 🔲 | **U** | Doc 09 | retain anonymized? remove? NOT decided |
| Conversations on deletion | 🔲 | **U** | Doc 09 | retain for other party? NOT decided |
| Storefront on deletion | 🔲 | **U** | Doc 09 | NOT decided |
| Re-registration after deletion | 🔲 | **U** | Doc 09 | allowed? blocked? NOT decided |
| Data retention requirements | ⏭ | **U** | Doc 09/11 | legal retention window NOT decided |

### 3.7 Platform behavior
| Requirement | Status | Bucket | Belongs in | Note |
|---|---|---|---|---|
| Notifications (domain) | 🔒 | X | Doc 08 §8.11 | |
| Unread state | 🔒 | X | Doc 08 | |
| Activity counts | 🔒 | X | Doc 08 stats | |
| Likes/follows | 🔒 | X | Doc 08 §8.7 | |
| Loading/error/recovery | 🔒 | X | Doc 05 C.5.4, Doc 07 §7.14 | |
| Offline/transient (general) | 🟡 | **U** | Doc 09/11 | messaging offline banner exists; general OPEN |
| Duplicate actions / double submit | 🔒 (no dup sends) / 🔲 (general idempotency) | F/U | Doc 03 §46, Doc 04 §510 | messaging LOCKED; general mechanism OPEN |
| Idempot (per §46, Doc 04 §510) | 🔒 msg / 🔲 gen | F/U | Doc 09 | |

---

## 4 — Classification summary

- **🔒 LOCKED** (already decided, some now made explicit): consent mandatory both roles; Google no bypass;
  consent record requirement; Google + email → same Identity; no duplicate accounts; Shopper/Vendor one
  identity; all empty/error/deletion-visibility states; trust/moderation lifecycle; notifications.
- **🔲 OPEN / UNDECIDED** (genuinely not decided — must be resolved in Doc 09): account-deletion
  *consequences* (listings/reviews/conversations/storefront/re-registration), re-consent on Terms update,
  exact staff capability matrix, general idempotency/duplicate-submission beyond messaging, general
  offline behavior.
- **⏭ LATER**: data-retention legal window (Doc 11).
- **❌ REJECTED** (unchanged): automatic account merge (Doc 03).
- **FORGOTTEN DECISIONS made explicit here:** Google-no-bypass, consent record, save/follow/message
  unauth gating, general idempotency note.

---

## 5 — What this doc does NOT do

- No code. No dependency install.
- **Does NOT modify Docs 00–08.** Corrections C1–C5 are PROPOSED; applied only after founder approval.
- Does not invent product features beyond Docs 01–08.
- Does not resolve the 🔲 OPEN items — those are explicitly deferred to Document 09.
- Does not begin Document 09.

---

**END OF 08b (Consent & silent-requirements audit). Return to founder for review. Do NOT proceed to Doc 09.**
