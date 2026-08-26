# QA Checklist — Voeq Full-Coverage Pass (Phase 1 Inventory)

Generated: 2026-08-26 (UTC). Phase 1 only — inventory of every route, API, model, form, auth boundary discovered by walking the actual repo. Evidence: file paths + grep/read output, not assumptions.

NOTE on stack: skill mentions Prisma + Express + Render. Actual repo uses **Drizzle ORM** (`packages/db/src/schema.ts`), **Next.js Route Handlers** (no separate Express server), DB on **Neon** via `@neondatabase/serverless`. The "Express backend" in the skill does not exist as a separate service — all API is Next route handlers under `apps/web/app/api/`. Recorded as-is.

---

## 1. Every Route / Page (42 total, from `find apps/web -name page.tsx`)

Format: `path | roles | S/C | guard found (grep evidence)`

1. `/` (app/page.tsx) | unauth/shopper/vendor/admin | SERVER | landing, no guard grep
2. `/about` | public | SERVER | no guard
3. `/account-state` | unauth | SERVER | no guard (status display)
4. `/admin` | staff | SERVER | alias to /staff (app/admin/page.tsx imports StaffDashboardPage). NOTE: middleware matcher omits `/admin` (see §5).
5. `/become-vendor` | unauth→vendor | SERVER | no guard grep in file
6. `/c/[categorySlug]` | unauth/shopper | SERVER | no guard
7. `/careers` | public | SERVER | no guard
8. `/consent` | unauth | CLIENT | no guard (gate itself)
9. `/explore` | unauth/shopper | SERVER | no guard (public browse)
10. `/forgot-password` | unauth | CLIENT | no guard (public)
11. `/for-vendors` | public | SERVER | no guard
12. `/help` | public | SERVER | no guard
13. `/home` | shopper | SERVER | `requireConsent("/home")` (line 15)
14. `/listing/[id]` | public | SERVER | no guard grep (public detail)
15. `/login` | unauth | CLIENT | no guard (public)
16. `/messages` | shopper/vendor | SERVER | `getCurrentIdentity()` + `redirect("/login?next=/messages")` (lines 9-10)
17. `/messages/[id]` | shopper/vendor | SERVER | no guard grep (needs check)
18. `/notifications` | authed | CLIENT | no guard grep (needs check)
19. `/onboarding/shopper` | shopper | SERVER | `requireConsent("/onboarding/shopper")` (line 9)
20. `/onboarding/vendor` | vendor | SERVER | `requireConsent` + `redirect("/login?next=/onboarding/vendor")` (lines 12-13)
21. `/press` | public | SERVER | no guard
22. `/privacy` | public | SERVER | no guard
23. `/reset-password` | unauth | CLIENT | no guard (token-gated)
24. `/select-campus` | shopper | SERVER | `requireConsent("/select-campus")` (line 9)
25. `/settings` | shopper/vendor | SERVER | `getCurrentIdentity()` + `redirect("/login?next=/settings")` (lines 16-17)
26. `/signup` | unauth | CLIENT | no guard (public)
27. `/staff/analytics` | staff | SERVER | `requireCapability("analytics.read")` (needs confirm)
28. `/staff/audit` | staff | SERVER | `requireCapability("audit.read")` (needs confirm)
29. `/staff/config` | staff | SERVER | `requireCapability("config.write")` (needs confirm)
30. `/staff/moderation` | staff | SERVER | guard (needs confirm)
31. `/staff` | staff | SERVER | `if (!staff) redirect("/login?next=/staff")` (line 22)
32. `/styleguide` | public | CLIENT | no guard
33. `/terms` | public | SERVER | no guard
34. `/v/[slug]` | public | SERVER | no guard grep (public vendor share page)
35. `/vendor/[id]` | public | SERVER | no guard grep (public PG-PUB-004)
36. `/vendor/analytics` | vendor | SERVER | `requireConsent("/vendor/analytics")` (needs confirm)
37. `/vendor/dashboard` | vendor | SERVER | `requireConsent("/vendor/dashboard")` (line 18)
38. `/vendor/listings/[id]/edit` | vendor | SERVER | guard (needs confirm)
39. `/vendor/listings/create` | vendor | SERVER | `redirect("/login?next=/vendor/listings/create")` (needs confirm)
40. `/vendor/reviews` | vendor | SERVER | guard (needs confirm)
41. `/vendor/storefront` | vendor | SERVER | guard (needs confirm)
42. `/verify-otp` | unauth | CLIENT | no guard (token-gated)

---

## 2. Every API Endpoint (75 total, from `find apps/web -name route.ts -path "*/api/*"`)

Auth check evidence gathered for 10 (read in prior turn). Full list of paths (method inferred from file content where read; otherwise GET/POST by convention):

Auth: /api/auth/consent(POST) /forgot-password(POST) /google/callback(GET) /google(GET) /login(POST) /logout(POST) /logout-all(POST) /resend-otp(POST) /reset-password(POST) /set-campus(POST) /signup(POST) /status(GET) /verify-otp(POST)
Conversations: /api/conversations(POST,GET) /conversations/[id]/messages(GET,POST) /conversations/[id]/read(POST) /conversations/[id]/stream(GET,SSE)
Dev: /api/dev/admin-session(GET) /dev/magic-link(POST) /dev/otp(POST) /dev/reset-identities(POST) /dev/reset-rate-limit(POST) /dev/shopper-session(GET) /dev/vendor-session(GET)
Follow: /api/follow(POST) /follow/list(POST)
Health: /api/health(GET)
Home: /api/home(GET)
Images: /api/images/upload(POST)
Listings: /api/listings(POST,GET) /listings/[id](GET) /listings/[id]/comments(POST,GET)
Me: /api/me/preferences(GET) /me/stream(GET)
Messages: /api/messages/report(POST)
Notifications: /api/notifications(GET) /notifications/[id]/read(POST) /notifications/read-all(POST)
Onboarding: /api/onboarding/shopper/complete(POST) /onboarding/vendor/step-1(POST) /step-2(POST) /step-3(POST)
Reports: /api/reports(POST)
Reviews: /api/reviews(GET) /reviews/[vendorId](GET)
Saved: /api/saved(POST) /saved/list(GET)
Settings: /api/settings/campus(POST) /settings/notifications(GET,POST)
Share: /api/share/vendor(POST)
Staff: /api/staff/account-action(POST) /staff/agreements(GET) /staff/analytics(GET) /staff/audit(GET) /staff/bootstrap(POST) /staff/campuses(GET) /staff/cases(GET,POST) /staff/categories(GET) /staff/feature-flags(GET) /staff/impersonate(POST) /staff/impersonate/end(POST) /staff/listings(GET) /staff/promote(POST) /staff/retention(POST) /staff/reviews(GET) /staff/verify-vendor(POST)
Vendor: /api/vendor/analytics(GET) /vendor/followers(GET,POST) /vendor/go-live(GET) /vendor/hours(GET,POST) /vendor/identity(GET) /vendor/photo(GET,POST,DELETE) /vendor/reviews(GET,POST) /vendor/reviews/[id]/respond(POST) /vendor/socials(GET,POST)

---

## 3. Every DB Model & Relations (Drizzle, packages/db/src/schema.ts — 29 tables)

Enums: accountStatus, authMethod, userRole[shopper/vendor/admin], otpPurpose, messageState, reportCategory.

Tables (with FK columns — NONE have onDelete cascade; all FKs are plain text, no DB constraint):
- identities(id PK, email unique, passwordHash, googleSubject unique, role, staffRole, accountStatus, consent jsonb, vendorId)
- sessions(id PK, identityId, expiresAt)
- pendingTokens(token PK, email, purpose, used)
- otps(id PK, email, purpose, code, attempts)
- magicLinks(token PK, email, used)
- userPreferences(identityId PK, campus, notificationPrefs jsonb, interestTags jsonb, feedPrefsSetAt)
- auditLog(id PK, identityId nullable, metadata jsonb, adminAction)
- vendors(id PK, name, handle, campus, categoryIds jsonb, status, verified, profilePhotoUrl, hours jsonb, socials jsonb, identityId, slug unique)
- listings(id PK, vendorId notNull, title, priceMinor, priceMinMinor notNull, priceMaxMinor, categoryId notNull, status, images jsonb)
- reviews(id PK, vendorId notNull, authorId notNull, rating, response jsonb, status)
- conversations(id PK, participantIds jsonb, lastSeen jsonb)
- messages(id PK, conversationId notNull, senderId notNull, state, clientMsgId)
- staffCases(id PK, queue, assignedTo, status)
- wishlistItems(id PK, shopperId notNull, listingId nullable, vendorId nullable)
- follows(id PK, followerId notNull, vendorId notNull)
- likes(id PK, actorId notNull, targetId notNull, targetType)
- comments(id PK, listingId notNull, authorId notNull, status)
- reports(id PK, reporterId notNull, targetType, targetId, category, status)
- notifications(id PK, recipientId notNull, type, refId nullable, read)
- agreements(id PK, kind, version, isCurrent)
- featureFlags(key PK, value)
- activityEvents(id PK, type, campusZone, refId)
- campuses(id PK, slug)
- categories(id PK, slug)

**Relation cross-check (no cascade anywhere):**
- Deleting an identity does NOT auto-delete sessions/otps/magicLinks/vendors/reviews/notifications — orphan risk. `vendors.identityId` and `identities.vendorId` are NOT enforced FKs (plain text), so a vendor can point to a non-existent identity and vice-versa.
- Deleting a vendor does NOT cascade to listings/reviews/follows/wishlistItems — orphan listings reference dead vendorId.
- Deleting a conversation does NOT cascade to messages.
- No `onDelete` in any table definition (confirmed: grep for "onDelete" returns nothing).

---

## 4. Every Form / User Input Surface

Auth forms (payload-vs-server verified this pass):
1. Login — client `{email,password,remember,next,turnstileToken}` vs server zod `{email,password,remember?,next?,turnstileToken}` ✓ match
2. Signup — client `{email,password,name,intent,consent:true,turnstileToken}` vs server zod (email,password min8,name min2 max80,intent enum,consent true,turnstileToken optional) ✓ match
3. Forgot password — client `{email}` vs server zod `{email}` ✓ match
4. Reset password — client `{token,password}` vs server zod `{token,password min8}` ✓ match
5. Verify OTP — client `{token,code}` vs server zod `{token,code regex /^\\d{6}$/}` ✓ match

Onboarding (need read):
6. Shopper onboarding step-1..3 (app/onboarding/shopper + complete route)
7. Vendor onboarding step-1..3 (app/onboarding/vendor + step routes)

Other input surfaces (need read):
8. Listing create/edit (app/vendor/listings/create, [id]/edit)
9. Vendor profile/photo/hours/socials (vendor routes)
10. Settings forms (app/settings)
11. Chat message input (app/messages, /messages/[id])
12. Search/filter inputs (app/explore, /c/[categorySlug], app/home)
13. Staff config / moderation bulk actions (app/staff/*)
14. Reports form (app/reports or inline)
15. Consent checkbox (app/consent, signup)

---

## 5. Every Auth-Gated Boundary

**middleware.ts (read in full):**
- `PROTECTED_PREFIXES` = [/onboarding, /shopper, /home, /vendor/dashboard, /messages, /staff, /admin]
- `PUBLIC_EXACT` = [/login, /signup, /forgot-password, /reset-password, /verify-otp, /consent, /select-campus, /account-state]
- Logic: if path isProtected AND not in PUBLIC_EXACT AND no `sessionId` cookie → redirect `/login?next=...`
- `matcher` config (lines 86-96): ["/api/:path*", "/onboarding/:path*", "/shopper/:path*", "/home/:path*", "/vendor/dashboard/:path*", "/messages/:path*", "/staff/:path*"]

**GAP FOUND (real):** `/admin` is in PROTECTED_PREFIXES but NOT in the `matcher` array. Next.js only runs middleware on matched paths. So `/admin/*` requests NEVER hit the middleware → the edge guard for /admin is dead code. The page itself (`/admin`) is a thin alias to `/staff` which IS guarded server-side, so protection still holds via the page component, but the edge redirect for /admin is non-functional.

**Server-side guards (lib/session.ts, read in full):**
- `getCurrentIdentity()` — resolves from cookie, returns null if no session
- `requireAuth(next)` — redirect to /login if null
- `requireConsent(next)` — requireAuth + redirect to /consent if `consent.length===0`
- `requireCapability(cap)` — throws 401 Response if no staff, 403 if !hasCapability
- `requireRole(role)` — redirect to /account-state?status=forbidden if role mismatch
- `sanitizeNext(next)` — blocks //, ://, .. in ?next

**Per-route guards observed (grep):**
- /home: requireConsent ✓
- /messages: getCurrentIdentity + redirect /login ✓
- /vendor/dashboard: requireConsent ✓
- /staff: `if(!staff) redirect(/login?next=/staff)` ✓
- /onboarding/vendor: requireConsent + redirect /login ✓
- /onboarding/shopper: requireConsent ✓
- /settings: getCurrentIdentity + redirect /login ✓
- /select-campus: requireConsent ✓

**Need-to-verify (not yet read):** /staff/analytics|audit|config|moderation capability gates, /vendor/analytics|listings/create|listings/[id]/edit|reviews|storefront guards, /messages/[id], /notifications guards, /listing/[id] & /vendor/[id] & /v/[slug] public intent.

---

## Phase 2 status: NOT STARTED (inventory complete, proceed to deep pass)

Items needing further read before Phase 2 marks:
- 17 staff/vendor page guard confirmations
- 10 form bodies (onboarding, listing, settings, chat, search, reports, staff)
- 75 API endpoint auth/validation/status-code verification (10 done: login, signup, forgot-password, verify-otp, reset-password, home, notifications, listings(POST), vendor/photo, staff/analytics)
- DB orphan-write simulation (no cascade → manual check of delete flows)
- Chat offline test (needs running server + two sessions — likely a GAP unless approved)
