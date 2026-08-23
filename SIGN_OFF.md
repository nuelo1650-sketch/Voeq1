# Voeq — Founder Sign-off Checklist (Pre-Launch)

**Slice status:** VS1–VS7 shipped. Production-readiness (Phase 9 reversal) D.1–D.12 complete except this sign-off.

**Hard rule:** Hermes built and verified everything below against REAL services. Nothing is mocked in the launch path. Commit/push is gated — none of this is committed yet; say the word (standalone "Go") and I'll commit + push `origin/master`.

## ✅ Verified by Hermes (live, against real providers)
- [x] **D.1** Env + boot validation (`validateEnv` aborts prod boot on missing keys)
- [x] **D.2** Neon + Drizzle schema + **seed actually runs** (was a false pass before — `seed.ts` had no top-level call; fixed). DB now has 10 campuses / 6 vendors / 25 listings.
- [x] **D.3** Real auth repos (Neon); pending-status session bug fixed
- [x] **D.4** Images: **signed Cloudinary upload + Sightengine fail-closed** live-verified (real URL on happy path; 1×1 rejected; 5-image cap enforced)
- [x] **D.5** Email: **Resend real send** live-verified (`id=beb025f2…`); 11 branded templates; dev fallback
- [x] **D.6** Turnstile on signup (403 on bad token, live)
- [x] **D.7** Vercel config: `next.config.mjs` rewrite + `vercel.json` + CORS (live-verified)
- [x] **D.8** Render `render.yaml` + CORS middleware (live-verified)
- [x] **D.9** `/api/health` DB-connected (`200 {"status":"ok","db":"up"}`, live)
- [x] **D.10** **20/20 critical E2E tests pass** against live Neon + Cloudinary + Sightengine + Resend
- [x] **D.11** `DEPLOY.md` runbook written

## 🔲 Your call before launch (founder decisions / actions)
- [ ] **Rotate exposed secrets** (they were pasted in chat): Render API key, Neon password, Resend key, Cloudinary secret, Sightengine secret, Turnstile secret, Google secret, `VOEQ_SESSION_SECRET`. (Listed in DEPLOY.md.)
- [ ] **Enable rate limiting in prod**: set `VOEQ_RATE_LIMIT_DISABLED=false` on Render (currently `true` in dev → disabled).
- [ ] **Confirm Resend sender domain** `noreply@voeq.ng` is verified in the Resend dashboard (sending worked in dev; dashboard verification is the founder step).
- [ ] **Vercel ↔ Render wiring**: set `NEXT_PUBLIC_API_URL` (Render URL) on Vercel; `NEXT_PUBLIC_SITE_URL=https://voeq.ng` on both.
- [ ] **DNS**: `voeq.ng` → Vercel; confirm `www` + apex.
- [ ] **Google OAuth**: authorize the production redirect URIs in the Google console.
- [ ] **Cloudinary/Sightengine**: confirm the `jq9gwigz` / `382123782` accounts are on a paid-ready plan if launch traffic expects volume.
- [ ] **UptimeRobot** (or equiv) → `https://voeq.ng/api/health`.
- [ ] **Smoke test in a browser** on the deployed URL: signup (Turnstile), OTP email arrives, listing create with image upload, vendor photo upload.

## 🛑 STOP — review gate
This is the end of autonomous build. Working tree is **uncommitted** by design (commit/push gated on your second standalone "Go").

**Open questions for you:**
1. Any secrets already rotated? If yes, update `.env.local` + dashboards.
2. Confirm the 5-image cap + fail-closed moderation behavior matches your expectation (reject-on-error = no unmoderated image goes live, even if Sightengine is down).
3. Anything in the "Your call" list you want me to handle vs. do yourself?

— Hermes
