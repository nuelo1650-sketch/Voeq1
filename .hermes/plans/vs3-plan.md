# VS3 — ONBOARDING — PLAN (docs-first, not yet executed)

Status: PLAN ONLY. Awaiting founder standalone "Go".

## Reversal Records (from brief, recorded here for execution)
- REVERSAL 7: Vendor onboarding split into Phase A (account: business identity → campus/sub-area → agreement) + Phase B (profile: photo → first listing). After Phase A: status='pending_listings' (NOT public). After Phase B: status='live' (public). Step COUNT preserved (5), gating changed.
- REVERSAL 8: "Become a vendor" CTA placement — Settings (always), Shopper dashboard banner (eligible only), /for-vendors (prominent), Footer. NOT in main nav/sidebar/modals/push.

## Doc-drift flagged (NOT a blocker; needs your correction)
- Doc 03 §4.2 on disk STILL describes the ORIGINAL 5-step (Step 3 = photo, Step 4 = listing, Step 5 = agreement). Reversal 7 says it was recorded there; it was not. Plan builds per Reversal 7 (explicit founder call). Recommend updating Doc 03 §4.2 to Phase A/B after review.

## Ground-truth notes (verified on disk this turn)
- No onboarding/auth/vendor pages exist yet (greenfield). VS2 left: /consent, /select-campus, /login, /signup, /verify-otp, /forgot-password, /reset-password, /account-state, middleware, lib/session.ts, dev reset/otp/magic-link endpoints.
- interfaces.ts Vendor is sparse; LOCKED policy = EXTEND only (append new fields, never alter existing 10 shapes). Same for UserPreference, Identity, Listing.
- loadVendorStorefront(idOrSlug) in storefront.ts returns VendorStorefrontView|null. StorefrontGrid expects listings: ExploreListing[]. The /vendor/[id] 500 (pre-existing Pre-VS7 bug) is fixed under VS3.5 by wrapping with canVendorBePublic → null → notFound() → 404.
- categories (10) + campuses (10) already exported from @voeq/data for dropdowns.
- devSignInAs + resetAuthState/resetAudit/rateLimitStore.clear available for harness/E2E.

## Data-layer extensions (packages/data/src/interfaces.ts — APPEND only)
- Vendor: + status: 'pending_listings' | 'live'; + description: string; + subArea: string | null; + profilePhotoUrl: string | null; + agreementVersion: string | null; + agreementAcceptedAt: string | null; + identityId: string | null (links to the ONE Identity); + slug: string.
- UserPreference: + feedPrefsSetAt: string | null (already has onboardingInterests: string[]; reuse as interestTags).
- Identity: + vendorId: string | null (the linked Vendor; null until Phase A complete). Role upgrade to 'vendor' on canGoLive.
- Listing: + priceMinMinor: number; + priceMaxMinor: number | null; + categoryId: string; + description: string | null; + status: 'active' | 'removed' (extend, keep priceMinor for compat or migrate mock). + images stays string[].
- NEW VendorStatus type alias.
- NO `isPublic` boolean anywhere (anti-pattern). Visibility is derived.

## New data modules
- packages/data/src/media.ts: mockCloudinaryUpload(file)→{url,publicId,width,height}; mockSightengineModerate(url)→{approved,reason?}. URL: https://res.cloudinary.com/voeq-mock/image/upload/v1/<publicId>.jpg (clean, no stray $).
- packages/data/src/upload.ts: uploadAndModerate(file)→{status:'approved'|'rejected'|'failed', url?, reason?}. Heuristic reject when filename includes 'nsfw'|'reject'.
- packages/data/src/vendor-onboarding.ts: VendorRepo (createPendingVendor, patch, getById, getByIdentityId), listing create, canGoLive(vendor), canVendorBePublic(vendorId) [reads Vendor + its listings + Identity.consent], getPublicVendor(vendorId). All in-memory mock; resets on server restart (Phase 9 → real backend).
- packages/data/src/index.ts: export media, upload, vendor-onboarding.

## Pages & routes (apps/web)
- /onboarding/shopper (VS3.1): interest chips (10 categories), Skip (primary), Save. POST /api/onboarding/shopper/complete → set UserPreference.feedPrefsSetAt + interestTags → redirect /home.
- /api/onboarding/shopper/complete (VS3.1): require auth; patch UserPreference; redirect /home.
- Post-auth gate chain (VS3.1 wires): verify-otp→/consent→(accept)→/select-campus→(save)→/onboarding/shopper→(save/skip)→/home. (consent + select-campus pages exist from VS2; add post-success redirects. /home is NEW — minimal shopper dashboard placeholder, campus-scoped, shows trending; full dashboard is VS4.)
- /onboarding/vendor (VS3.2, Phase A entry): Step1 business identity (name min2, desc min50, category DROPDOWN from categories), Step2 campus (CampusSelector) + subArea, Step3 agreement (version shown, checkbox, submit disabled until checked). Auto-save per step. POST /api/onboarding/vendor/step-1/2/3 → create/patch Vendor (status pending_listings), link Identity.vendorId, return {nextStep}. After step3 → /vendor/dashboard.
- /vendor/dashboard (VS3.4): reads Vendor; if pending_listings → wizard prompts (canGoLive checklist: name✓ campus✓ agreement✓ / photo□ / listing□); if live → placeholder dashboard. Step4 photo upload (uploadAndModerate → save profilePhotoUrl → re-eval canGoLive). Step5 first listing (POST /api/listings). On both done → status='live'.
- /api/vendor/upload-photo (VS3.4): uploadAndModerate → on approved save Vendor.profilePhotoUrl.
- /api/listings (VS3.4): create Listing (title, desc, priceMin/Max, categoryId, photos via uploadAndModerate each) → active.
- /become-vendor (VS3.6): gate (auth shopper, not vendor, not suspended); same Phase A wizard (reuse /onboarding/vendor components) → on complete link Identity to Vendor, role upgrade to 'vendor' on canGoLive. Settings "Vendor Account" section + shopper dashboard eligible banner. /for-vendors CTA → /become-vendor; Footer link → /for-vendors (per Reversal 8).
- /vendor/[id] public (VS3.5): wrap loadVendorStorefront with canVendorBePublic → null → notFound() (404, fixes 500). "unavailable" state if precondition fails.

## Verification (per chunk + global)
Per chunk: tsc clean (both pkgs) → route 200/expected → harness where applicable.
Global E2E walk-through (VS3.7): create vendor (intent=vendor) → Phase A 1→2→3 → Vendor exists pending_listings → /vendor/dashboard wizard → Phase B photo+listing → status live → /vendor/[id] public → shopper→vendor upgrade (same Identity, role upgraded) → resume after abandon (localStorage) → visibility revocation (delete listing → unavailable). Cloudinary mock approved+rejected. Grep for isPublic === 0.

## Risks
1. Doc 03 §4.2 drift (flagged above).
2. /vendor/[id] 500 root cause must be confirmed during VS3.5 (likely StorefrontGrid/Hero shape mismatch on showcase vs fixture vendors) — will diagnose with real request, not assume.
3. Listing model extension touches mock MOCK_EXPLORE_LISTINGS shape — keep priceMinor for compat or migrate; will migrate mock to new fields to avoid dual shape.
4. Post-auth chain redirects touch VS2 pages (/consent, /select-campus) — low risk, additive only.
5. localStorage resume is client-only (Phase 9 → server); acceptable for mock phase, documented.

## Not in VS3 (per brief)
Visual polish (VS7), Messaging (VS6), Shopper dashboard beyond basic redirect (VS4), Vendor dashboard beyond basic redirect (VS5), Staff onboarding (VS7).
