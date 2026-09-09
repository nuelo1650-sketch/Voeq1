# Voeq — Library Docs (third-party integrations + gotchas)
**Operation Money Bag · Explore + Landing + Related Pages Phase**
*Status: AWAITING FOUNDER CONFIRMATION.*

## Cloudinary (images)
- Direct browser→Cloudinary signed upload via `/api/images/sign` (sha1(sorted params+secret), 60s TTL; secret stays server-side). Server moderates the returned URL — no base64 through server.
- **Delivery**: use `cdnTransform` for transforms; non-Cloudinary URLs pass raw — assert src-equality not `w_900` in probes.
- **C13 Cloudinary-only gate**: only `https://(res.)cloudinary.com/` URLs accepted on listing create/edit — bypass attempts (force:"pass", naked URLs) REJECTED, fail-closed.
- Probe trap: Cloudinary `sample.jpg` ignores `h_2400` (returns 640×360 landscape) — use picsum for tall-image probes.

## Sightengine (moderation)
- POST form fields `api_user`/`api_secret` (NOT Basic auth — that returns "demo API" error).
- Models: properties,nudity,wad. Fail-closed on non-200/network. Unmoderated assets destroyed on failure.
- Env resolves `SIGHTENGINE_API_USER/API_SECRET` FIRST, then legacy `SIGHTENGINE_USER/SECRET` (env-twin trap — vercel env ls shows different names than .env.local).

## Neon Postgres
- Serverless driver via `neon(url)`; **sql templates are LAZY — await every cleanup delete**.
- Test URL derivation: `.env.local` DATABASE_URL with `/neondb?` → `/neondb_test?` (query-string anchored).
- Tables have quirks: `vendors` has NO `created_at`/`updated_at` (identities does); JSON null in `images` ≠ `''` (use `jsonb_typeof` checks, LIKE misses it).

## Turnstile (bot protection)
- On login + signup. `verifyTurnstile` silently SKIPS when secret unset (graceful degrade — unset secret in prod = no protection, no error).
- Hostname check: `TURNSTILE_HOSTNAMES` absent → defaults to localhost-only. Adding the secret WITHOUT hostnames breaks prod signup. URL normalization applied.
- NEVER bypass (founder rule).

## Next.js App Router (version in use: see apps/web/package.json)
- Soft-200 root cause was root `loading.tsx` boundary (notFound() commits 200 under streaming) — no root loading boundary.
- `self.__next_f.push` inline scripts carry Flight/RSC payload as ESCAPED DATA — XSS probes that flag "alert" text inside them are inert (verified: no dialog fires). Standard Next behavior, not injection.
- Hydration float drift: round Math.sin/cos coords in generated SVGs (CampusFingerprint lesson).
- JS-string `&apos;` entities render literally — entities only decode in JSX text nodes.
- React controlled inputs: `fill()+Enter` does NOT fire onChange after hydration — probes need `keyboard.type`.
- Client components can't use node:crypto — media/images/email live behind `@voeq/data/server` barrel only.

## Vercel
- Deploy from monorepo root: `npx vercel deploy --prod --yes`. Don't filter deploy output; recover URL via `npx vercel ls`.
- `vercel env ls` names DIFFER from .env.local for the same vars (alias map in packages/data/src/env.ts). Audit twins before concluding a gap.
- Env changes require redeploy to take effect.

## Render
- Hosted MCP (mcp.render.com/mcp) with API-key header auth only — OAuth/DCR 404s. REST API works directly with the same key: api.render.com/v1/services, /v1/services/<id>/env-vars (response = array of {envVar:{key,value}}; delete by KEY NAME; changes need redeploy).

## Playwright (probes)
- useIsMobile starts false → empty-states match first; cards flip at ~3s dev. `waitForFunction` on children length, never waitForSelector+fixed sleep.
- esbuild + tsx: named functions/arrows inside `page.evaluate` break (`__name is not defined`) — pass string-templated evaluate or `new Function()` body.
- `networkidle` never settles (Turnstile/auth polling) — use `domcontentloaded` + fixed wait.
- Prod matrix: `playwright.verify.prod.config.ts` (120 checks); mobile sweep vs :3031 + test DB.

## lucide-react
- Verify icon names via `grep 'declare const X:' node_modules/lucide-react/dist/lucide-react.d.ts` BEFORE use.
