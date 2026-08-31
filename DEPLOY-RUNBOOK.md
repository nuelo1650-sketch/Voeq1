# Voeq Deploy Runbook (2026-08-31)

Two-part deployment. **Vercel serves the PAGES, Render serves the API** — both must be
deployed separately. Both deploy from the same repo (master, `git@github.com:nuelo1650-sketch/Voeq1.git`).

## What this document is for
Everything between "code is pushed" and "production serves it" — including the gotcha
that cost the whole 2026-08-31 session: **pushing code alone does NOT go live. Both
platforms need to be promoted/redeployed.**

## Architecture (verified via X-Render-Routing headers)
- `voeq.ng` (Vercel) — Next.js pages/UI ONLY. `next.config.mjs` rewrites `/api/*`
  → `${API_PROXY_URL}/api/*` (server-side proxy; the browser never talks to Render).
- `voeq-api` (Render) — the real API (`DATABASE_URL`, Cloudinary, Sightengine,
  Resend, Turnstile, Google OAuth secrets live here per render.yaml).
- **Consequence:** a fix in `packages/data` (e.g. `/api/explore` category filter,
  `/api/listings/[id]` GET) is served by **Render**, NOT Vercel. A fix in a React
  component (explore page, listing detail, auth) is served by **Vercel**.

## Current state (2026-08-31 06:00 UTC)
- Repo HEAD: `89a60fd` (all fixes committed)
- Vercel: latest builds READY but **NOT promoted to production** (target null);
  prod still serves `d63f6c2`.
- Render: serve old code (category filter empty; `/api/listings/:id` → Vercel proxy
  loop 508 because Render's build lacks the GET handler).

## To ship everything (2 steps, ~5 min)

### Step 1 — Vercel: promote latest master
1. Open https://vercel.com/voeq/voeq/deployments (team `voeq`)
2. Find the deployment for commit **`89a60fd`** (state READY)
3. ⋯ → **Promote to Production** (or press "Promote" in the deployment card)
4. Verify:
   ```bash
   curl -s "https://voeq.ng/explore" | grep -c vendored   # new build served
   ```
   (Vercel changes the frontend bundle + client data-fetch wiring.)

### Step 2 — Render: redeploy the API service
1. Open https://render.com → your team → `voeq-api` service
2. **Manual Deploy → Deploy latest commit** (or "New Deploy" + pick master HEAD `89a60fd`)
3. Wait for health check: `GET /api/health` → `{"status":"ok","db":"up"}` (or the
   dashboard's Health Check green tick).
4. Verify (Render serves these — NOT Vercel):
   ```bash
   # category filter fix (was empty):
   curl -s "https://voeq.ng/api/explore?campus=nmu-okerenkoko&category=food-drinks" | head -c 200
   # listing detail GET (was 508 loop):
   curl -s -o /dev/null -w "%{http_code}" "https://voeq.ng/api/listings/<demo-listing-id>"
   # quick-filter honesty (verifiedOnly — all demo vendors verified):
   curl -s "https://voeq.ng/api/vendors" | head -c 200
   ```

### Why "promote only Vercel" is NOT enough
The category-filter fix + listing-GET live in `packages/data` and the route file —
API code that runs on **Render**. Promoting only Vercel fixes the UI/client wiring but
the API responses keep coming from Render's old build. And "deploy only Render"
breaks the frontend proxies if the two diverge. Ship both.
