-- Operation Money Bag — Phase A migrations (idempotent, prod+test safe)
-- Run via: neon sql or drizzle migration wrapper. Every statement is CREATE IF NOT EXISTS / ON CONFLICT DO NOTHING.

-- 1. listing_fairness — fair-rotation + fresh-window tracking
CREATE TABLE IF NOT EXISTS listing_fairness (
  listing_id text PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  fresh_window_started_at timestamptz,
  last_shown_at timestamptz,
  shown_hours_this_week numeric(6,2) NOT NULL DEFAULT 0,
  week_started_at timestamptz DEFAULT date_trunc('week', now()),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listing_fairness_week ON listing_fairness(week_started_at);

-- 2. voeq_live_picks — curated daily shelf (Option 1: admin-confirmed)
CREATE TABLE IF NOT EXISTS voeq_live_picks (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  pick_date date NOT NULL,
  why_line text,
  position integer NOT NULL DEFAULT 0,
  confirmed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, pick_date)
);
CREATE INDEX IF NOT EXISTS idx_live_picks_date ON voeq_live_picks(pick_date DESC);

-- 3. vendor_score_snapshot — nightly composite scores (landing showcase reads this)
CREATE TABLE IF NOT EXISTS vendor_score_snapshot (
  vendor_id text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  score numeric(6,4) NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_score_score ON vendor_score_snapshot(score DESC);

-- 4. areas — national taxonomy (36 states + FCT), state → area → subarea
CREATE TABLE IF NOT EXISTS areas (
  id text PRIMARY KEY,
  state_name text NOT NULL,
  area_name text NOT NULL,
  subarea_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (state_name, area_name, subarea_name)
);
CREATE INDEX IF NOT EXISTS idx_areas_state ON areas(state_name);

-- 5. listings.source — seed marker (null = real, 'seed' = founder-commissioned placeholder)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source text;

-- 6. vendors.area_id — non-campus vendor identity
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS area_id text REFERENCES areas(id);

-- 7. listings.created_at (Money Bag fresh window): TEXT ISO timestamp column,
--    backfilled for legacy rows. New writes set it explicitly.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_at text;
UPDATE listings SET created_at = COALESCE(created_at, to_char(now() - interval '30 days', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) WHERE created_at IS NULL;
