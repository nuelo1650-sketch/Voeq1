# USER_ROLES_AND_PERMISSIONS.md — Voeq (as-built recovery, Batch 2)

> Reconstructed from `apps/api/src/middleware/auth.ts`, `apps/api/src/middleware/admin.ts`,
> `apps/web/src/lib/auth-server.ts`, `apps/web/src/lib/auth-redirect.ts`, the Prisma
> `UserRole` enum, and route guards. Investigation-only — no modifications.
> No secrets included.

---

## Roles discovered

Five roles exist in the `UserRole` enum (`buyer`, `vendor`, `moderator`, `admin`,
`super_admin`). Backend authorization uses a **capability matrix** (`PERMISSIONS`) for
staff. Frontend route guards (`requireVendor`, `requireShopper`, `requireSuperUserAdmin`)
separate buyer / vendor / admin+super_admin sections.

**Roles with confirmed behavior:** `buyer`, `vendor`, `admin`, `super_admin`, `moderator`
(backend-enforced; see discrepancy note).

---

## Role: buyer (shopper)

### Description
A student who browses, saves, follows, messages vendors, and leaves reviews. The
"shopper" experience.

### How obtained
- Normal registration (email signup, or Google OAuth with `intent=buyer`).
- Default role on account creation (`UserRole @default(buyer)`).

### Permissions
- **View:** public marketplace (listings, vendor profiles, browse, search, trending),
  own dashboard, own data.
- **Create:** reviews (vendor-scoped), reports (against vendors), disputes, conversations
  (messages), wishlist items, follows, preferences.
- **Edit:** own profile, own preferences, own reviews.
- **Delete:** own reviews, own wishlist/follow entries, own account session (sign out /
  logout-all).

### Restricted functionality
- Cannot access `/vendor/*` (redirected to `/shopper/dashboard` by `requireShopper`).
- Cannot access `/admin` (redirected to `/home` by `requireSuperUserAdmin`).
- Cannot create/own listings (no Vendor row).
- Cannot moderate, verify, feature, ban, or configure platform.

### Accessible screens
- `(main)/home`, `/browse`, `/search`, `/l/[slug]`, `/v/[slug]`, `/wishlist`,
  `/following`, `/messages`, `/messages/[id]`, `/shopper/dashboard`,
  `/shopper/onboarding`, `/profile`, `/settings`, `/select-campus`, public/legal pages.

### Data access
- Own user record, own reviews/wishlist/follows/conversations/notifications/preferences.
- Public vendor/listing data; other users' public profiles.

### Role transitions
- buyer → vendor: via Google OAuth `intent=vendor` (promotes buyer→vendor, creates
  Vendor row) or "Become a vendor" flow (`/become-vendor` → vendor onboarding). Never
  auto-demoted.
- buyer → admin/super_admin: only by direct DB assignment (no self-serve path found).

### Evidence
- `schema.prisma` UserRole; `routes/auth.ts` (intent handling); `lib/auth-server.ts`
  `requireShopper`; `auth-redirect.ts` (`resolvePostAuthDestination`).

---

## Role: vendor

### Description
A campus business owner with a storefront. The "vendor" experience.

### How obtained
- Google OAuth `intent=vendor` (role set to vendor, Vendor row ensured).
- "Become a vendor" / `/become-vendor` flow from a buyer account.
- buyer promoted on vendor intent (never demoted).

### Permissions
- **View:** own dashboard, own analytics, own listings, own reviews (incl. respond),
  own profile/settings, own conversations.
- **Create:** listings (with photos), Vendor profile data, review responses, conversations.
- **Edit:** own Vendor profile, hours, socials, listings, settings, review responses.
- **Delete:** own listings (soft-delete via `deletedAt`), own review responses (cascade).
- Cannot moderate others; cannot access `/admin` (web `requireSuperUserAdmin` excludes
  vendor; API `requireAdmin` excludes vendor since not in `STAFF_ROLES`).

### Accessible screens
- `vendor/onboarding/*` (steps 1–4; nav hidden during onboarding), `vendor/dashboard`,
  `vendor/listings`, `vendor/listings/new`, `vendor/listings/[id]/edit`, `vendor/profile`,
  `vendor/settings`, `vendor/analytics` (via dashboard). May also view public marketplace.

### Data access
- Own Vendor, Listings, Reviews (on own vendor), Conversations involving own vendor,
  own analytics (EventLog-derived).

### Role transitions
- vendor → buyer: **UNKNOWN** — no demotion path observed (promotion is one-way in code).
- vendor → admin/super_admin: only by DB assignment.

### Evidence
- `routes/auth.ts` (promote logic, `ensureVendorRow`); `lib/auth-server.ts`
  `requireVendor`; `vendor/layout.tsx` (`requireVendor`); `VendorChrome.tsx`.

---

## Role: moderator (staff)

### Description
A staff member with **scoped content/user moderation** powers only. Defined in the
backend `PERMISSIONS` matrix and `STAFF_ROLES`.

### How obtained
- **UNKNOWN** — no self-serve or invitation UI discovered. Assigned directly (DB) by an
  admin/super_admin. No creation flow found in code.

### Permissions (from `PERMISSIONS.moderator`)
- `user.moderate`, `user.ban`
- `vendor.moderate`, `vendor.verify`
- `listing.moderate`
- `report.moderate`
- `review.moderate`

### Restricted functionality
- NO destructive or staffing powers: cannot `vendor.feature`, `institution/campus/
  category.moderate`, `featured.moderate`, `press.moderate`, `email.send`,
  `settings.manage`, `analytics.view`, `audit.view`, `impersonate`.
- Cannot manage other staff (per `canActOnUser`, moderators cannot act on admin/
  super_admin/moderator).
- **Cannot access the web `/admin` console** — `requireSuperUserAdmin` only admits
  admin/super_admin, and the string "moderator" appears **nowhere in the web app**.

### Accessible screens
- **Backend API:** moderator is in `STAFF_ROLES`, so `requireAdmin`/`requireModerator`
  accept it — moderator *can* call admin API routes (e.g. `/api/admin/vendors`,
  `/api/admin/reviews`) if it had a session.
- **Web UI:** NONE. No moderator pages, nav, or role check exists in `apps/web`.

### Data access
- Via API moderation routes: user/vendor/listing/review/report records (moderation scope).

### Role transitions
- moderator ↔ admin/super_admin: by DB assignment only (no UI).

### Evidence
- `middleware/admin.ts` (`PERMISSIONS`, `STAFF_ROLES`, `requireModerator`, `canActOnUser`).
- **Discrepancy:** web grep for "moderator" returns zero matches; `admin/layout.tsx`
  uses `requireSuperUserAdmin` (excludes moderator). See Consistency Check.

---

## Role: admin (staff)

### Description
Platform staff with broad moderation/management, but **not** staff-management or true
erasure powers (those are super_admin-only).

### How obtained
- **UNKNOWN** — no self-serve path; assigned directly (DB) by super_admin.

### Permissions (from `PERMISSIONS.admin`)
- All moderator permissions PLUS:
  `vendor.feature`, `institution.moderate`, `campus.moderate`, `category.moderate`,
  `featured.moderate`, `press.moderate`, `email.send`, `settings.manage`,
  `analytics.view`, `audit.view`, `impersonate`.
- Cannot `user.ban`? (actually admin HAS `user.ban` per matrix) — admin can ban users but
  **cannot** act on other admin/super_admin (`canActOnUser`).

### Restricted functionality
- Cannot manage other staff (cannot ban/suspend/modify admin or super_admin).
- Cannot perform "true erasure" (super_admin-only per matrix comment).
- Cannot impersonate `super_admin` (explicit 403 in `impersonate` route).

### Accessible screens
- All `admin/*` pages (stats, institutions, campuses, categories, vendors, listings,
  users, reviews, reports, featured, analytics, system, emails, features, audit,
  settings, impersonate, export, press).

### Data access
- Platform-wide: all users, vendors, listings, reviews, reports, disputes, audit logs,
  feature flags, analytics, press.

### Role transitions
- admin → super_admin: by DB assignment.
- admin → moderator/vendor/buyer: by DB assignment; `canActOnUser` protects admin from
  lower-ranked actors.

### Evidence
- `middleware/admin.ts` (`PERMISSIONS.admin`, `requireAdmin`, `requirePermission`,
  `canActOnUser`); `routes/admin/impersonate.ts` (super_admin guard);
  `admin/layout.tsx` (`requireSuperUserAdmin`).

---

## Role: super_admin (staff / owner)

### Description
Platform owner with **all** capabilities (`PERMISSIONS.super_admin = ['*']`), including
staff management and true erasure.

### How obtained
- **UNKNOWN** — assigned directly (DB). No self-serve path. The seed/initial super_admin
  (e.g. `owidavid2002@gmail.com`) is set via DB.

### Permissions
- Everything (`'*'`). Includes all admin powers + managing staff + true erasure +
  impersonating anyone except another super_admin (impersonate route blocks
  super_admin targets).

### Restricted functionality
- Cannot be impersonated by another admin (`impersonate/start` returns 403
  `CannotImpersonateSuperAdmin`).
- Cannot act on a higher rank (none higher).

### Accessible screens
- All `admin/*` pages (same as admin, plus any super_admin-only controls).

### Data access
- Full platform data + ability to erase/modify staff accounts.

### Role transitions
- Top of hierarchy; only demotion by DB assignment.

### Evidence
- `middleware/admin.ts` (`PERMISSIONS.super_admin`, `requireSuperAdmin`, `canActOnUser`
  returns true for super_admin); `routes/admin/impersonate.ts`; `auth.ts` Google callback
  routes super_admin → `/admin`; `auth-redirect.ts`.

---

## Permission consistency check (frontend vs backend)

| Check | Frontend (web) | Backend (API) | Verdict |
|---|---|---|---|
| Shopper section | `requireShopper` → buyer only; others redirected | `requireAuth` (any session) on `(main)` data routes | Consistent (web enforces section; API trusts session) |
| Vendor section | `requireVendor` → vendor/admin/super_admin | vendor API routes use `requireAuth` + ownership checks | Consistent |
| Admin console | `requireSuperUserAdmin` → admin/super_admin ONLY | `requireAdmin`/`requireModerator` → `STAFF_ROLES` = admin/moderator/super_admin | **DISCREPANCY** (see below) |
| Moderator | **No moderator UI; string absent from web** | `moderator` in `STAFF_ROLES` + `PERMISSIONS.moderator` (content moderation) | **DISCREPANCY** |
| Super-admin-only actions | `requireSuperUserAdmin` | `requireSuperAdmin`, `requirePermission`, `canActOnUser` | Consistent |
| Impersonation | n/a (admin UI posts to API) | `requirePermission('impersonate')` + super_admin target guard | Consistent |

### Documented discrepancies (NOT fixed)
- **CONFLICT — moderator role is backend-enforced but frontend-invisible.** The API
  grants `moderator` a real capability set and accepts it via `requireAdmin`/
  `requireModerator` (it is in `STAFF_ROLES`). However, the web app has **zero**
  moderator references — `admin/layout.tsx` uses `requireSuperUserAdmin` which excludes
  moderator, and no moderator pages/nav exist. Net effect: a `moderator` account could
  authenticate to admin **API** routes but has no web console to use them, and is barred
  from `/admin` pages. This is a frontend/backend authorization mismatch. (Resolves the
  Batch 1 "UNKNOWN — moderator role enforcement": it IS enforced on the API, but not
  surfaced on the web.)
- **INFERRED — admin console web guard vs API guard scope mismatch.** Web `admin/*`
  admits only admin/super_admin; API `requireAdmin` also admits moderator. If a moderator
  session existed, web `/admin` would 403 but API `/api/admin/*` would 200 for
  moderation routes. Whether this is intentional (API prepared for future moderator UI)
  or a gap is UNKNOWN — requires human/product clarification.
- **OBSERVED — permission granularity exists but may be under-used.** The `PERMISSIONS`
  capability matrix + `requirePermission()` exist, but not every admin route was traced
  to a specific `requirePermission` call this pass; some may rely on the blanket
  `requireAdmin`. Depth not fully verified.

---

## User status dimension (orthogonal to role)

`UserStatus`: `active` | `suspended` | `banned`. Checked in `resolveActor` (admin
middleware): suspended/banned users get 403 on admin routes. Separate from `VendorStatus`
(`incomplete` | `pending_review` | `live` | `suspended`).

- A buyer/vendor with `status='banned'` is blocked from admin console; their normal
  session (`requireAuth`) is unaffected by `UserStatus` (only admin middleware checks it).
- **INFERRED** — whether `suspended`/`banned` buyers/vendors are blocked from normal app
  use (beyond admin) is UNKNOWN this pass; `requireAuth` does not check `UserStatus`.

---

## Role-transition summary

| From → To | Mechanism | Evidence |
|---|---|---|
| (none) → buyer | signup / Google intent=buyer | `routes/auth.ts` |
| (none) → vendor | Google intent=vendor / become-vendor | `routes/auth.ts`, `ensureVendorRow` |
| buyer → vendor | Google intent=vendor (promote) / become-vendor | `routes/auth.ts` |
| any → admin/moderator/super_admin | DB assignment only | `middleware/admin.ts` (no self-serve) |
| vendor → buyer | UNKNOWN (no demotion path found) | — |
| admin ↔ super_admin | DB assignment | `canActOnUser`, `PERMISSIONS` |

---

## Uncertainties requiring human review
- `UNKNOWN` — how `moderator`/`admin`/`super_admin` accounts are actually created in
  practice (no UI/invite flow found; assumed DB/seed).
- `UNKNOWN` — whether `suspended`/`banned` non-staff users are blocked from the normal
  app (only admin middleware checks `UserStatus`).
- `UNKNOWN` — whether every admin API route applies `requirePermission` or relies on
  blanket `requireAdmin`.
- `CONFLICT` — moderator backend-enforced vs web-invisible (above).
