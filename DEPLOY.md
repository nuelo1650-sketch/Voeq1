# Voeq — Deployment Runbook (Launch: end-Aug NMU)

Two services, one repo (`apps/web` is both the web app AND the API/messaging surface):

| Service | Platform | Role | Build |
|---------|----------|------|-------|
| Web     | Vercel   | Pages + `/api/*` (rewritten to Render in prod via `NEXT_PUBLIC_API_URL`) | `next build` |
| API + SSE messaging | Render (Blueprint `render.yaml`) | Same Next app serving `/api` natively on Render; DB, email, images, auth | `next build` (web service) |

On **Vercel**, `next.config.mjs` `rewrites()` maps `/api/:path*` → `${NEXT_PUBLIC_API_URL}` so the 12 client fetches stay same-origin in the browser. On **Render**, `NEXT_PUBLIC_API_URL` is unset, so `/api` is served locally. CORS headers are added by `middleware.ts` as defense-in-depth.

## Pre-launch checklist
1. **Domain**: `voeq.ng`. Set `NEXT_PUBLIC_SITE_URL=https://voeq.ng` on both services.
2. **DNS**: point `voeq.ng` (and `www`) at Vercel; Render service gets its own `*.onrender.com` URL (used as `NEXT_PUBLIC_API_URL` on Vercel).
3. **Secrets** (Render dashboard, `sync:false` ones are one-time): see `render.yaml` + below. Vercel: set the same under Project → Environment Variables.
4. **Resend**: verify `noreply@voeq.ng` as a sender domain in the Resend dashboard (sending already verified in dev).
5. **Cloudinary**: confirm the `jq9gwigz` account + API key/secret (uploads use **signed** calls, no upload preset needed).
6. **Sightengine**: confirm user/secret active (moderation verified live).
7. **Turnstile**: widget already created in Cloudflare; site key on Vercel/Vercel env, secret on Render.
8. **Neon**: DB already provisioned + seeded (see Seed step).

## Required environment variables
All are listed in `.env.example`. Canonical names the code reads:

```
# Shared
DATABASE_URL                      # Neon pooler URL (Render)
VOEQ_SESSION_SECRET              # generated once, 32-byte hex — KEEP SECRET
NEXT_PUBLIC_SITE_URL=https://voeq.ng
CORS_ALLOWLIST=https://voeq.ng,https://www.voeq.ng,https://voeq-web.vercel.app

# Vercel only
NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAEZcnQcg6AZ2SqFM
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=jq9gwigz

# Render only (server-side)
RESEND_API_KEY                   # re_...
RESEND_FROM_EMAIL=noreply@voeq.ng
AUTH_GOOGLE_CLIENT_ID            # Google OAuth
AUTH_GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME=jq9gwigz
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SIGHTENGINE_USER=382123782
SIGHTENGINE_SECRET
TURNSTILE_SECRET_KEY
SUPER_ADMIN_EMAIL=admin@voeq.ng

# Ops
UPSTASH_REDIS_URL / UPSTASH_REDIS_TOKEN   # rate-limit + SSE cross-instance
VOEQ_RATE_LIMIT_DISABLED=false            # MUST be false in prod (enables rate limiting)
```

> Google OAuth var names are `AUTH_GOOGLE_*` (not `GOOGLE_*`). Resend sender is `RESEND_FROM_EMAIL` (not `RESEND_FROM`). `validateEnv("api")` will **abort boot** if any required key is missing in production — fix the dashboard, don't patch the check.

## Seed the database (one-time, idempotent)
```bash
cd packages/db
export DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
npx tsx src/seed.ts
# expects: 10 campuses, 5 categories, 6 vendors, 25 listings
```
Safe to re-run (inserts use `onConflictDoNothing` for campuses/categories; listings append).

## Health check
- `GET /api/health` → `200 {"status":"ok","db":"up"}` when Neon is reachable; `503` otherwise.
- Point UptimeRobot (or similar) at `https://<web>/api/health`. (Sentry deferred to Phase 2.)

## CORS verification
After deploy, from the Vercel origin a preflight `OPTIONS /api/auth/signup` must return `access-control-allow-origin: https://voeq.ng`. If a direct cross-origin call is ever made, `middleware.ts` allowlist handles it.

## Post-launch security (DO NOW)
Keys were pasted in chat and are considered **exposed**. Rotate before/at launch:
- [ ] Render API key
- [ ] Neon database password (then update `DATABASE_URL` in both dashboards)
- [ ] Resend API key
- [ ] Cloudinary API secret
- [ ] Sightengine secret
- [ ] Turnstile secret
- [ ] Google OAuth client secret
- [ ] `VOEQ_SESSION_SECRET` (generate fresh)

`packages/db/drizzle.config.json` holds the DB secret and is **gitignored** — never commit it.

## Rollback
Both services are independent. If the API breaks: redeploy the previous Render deploy; web keeps serving static pages. If web breaks: rollback Vercel deployment. DB is shared — no schema change in this launch slice, so no migration rollback needed.

## Known Phase-2 deferments (not in this launch)
- Sentry (using console + UptimeRobot instead)
- ImageKit (Cloudinary-only)
- Upstash SSE cross-instance hardening (Redis provisioned; wiring is best-effort)
