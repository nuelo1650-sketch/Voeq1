-- MONEY BAG D2 — Vercel Cron needs the nightly job. No-op migration marker:
-- the crons registration lives in apps/web/vercel.json (schedule 0 21 * * *).
-- CRON_SECRET must exist in Vercel env before the first scheduled run —
-- the /api/cron/nightly route fails closed (500) in prod without it.
-- Nothing to execute; this file documents the deploy step for the scoreboard.
SELECT 1;
