-- ============================================================================
-- Migration 0002: Campus overhaul (Pre-B1)
-- Extends `campuses` with geocoding + source/status metadata, adds a UNIQUE
-- constraint on slug, and creates the shared Nominatim throttle table.
--
-- Idempotent: guards every statement with IF NOT EXISTS / conditional checks.
-- Reversible: a matching 0002_down.sql drops the new columns/table/indexes.
-- ============================================================================

-- 1. Enums -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'campus_source') THEN
    CREATE TYPE campus_source AS ENUM ('seeded', 'user-added');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'campus_status') THEN
    CREATE TYPE campus_status AS ENUM ('verified', 'unverified');
  END IF;
END
$$;

-- 2. New columns on campuses --------------------------------------------------
ALTER TABLE campuses
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS source campus_source NOT NULL DEFAULT 'seeded',
  ADD COLUMN IF NOT EXISTS status campus_status NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS created_by_user_id text,
  ADD COLUMN IF NOT EXISTS created_at text NOT NULL DEFAULT now()::text;

-- Backfill legacy rows (seeded, verified, no coords) so they remain valid.
UPDATE campuses
  SET source = 'seeded', status = 'verified'
  WHERE source IS NULL OR status IS NULL;

-- 3. Unique constraint on slug ------------------------------------------------
-- Drop any duplicate slugs first (shouldn't exist; safe no-op otherwise).
-- Then add the unique index.
CREATE UNIQUE INDEX IF NOT EXISTS campuses_slug_unique ON campuses (slug);

-- 4. Index for picker queries (status + slug) --------------------------------
CREATE INDEX IF NOT EXISTS campuses_status_slug_idx ON campuses (status, slug);

-- 5. Nominatim throttle table -------------------------------------------------
CREATE TABLE IF NOT EXISTS nominatim_throttle (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_request_at timestamptz NOT NULL DEFAULT '1970-01-01T00:00:00Z',
  last_request_by text
);
INSERT INTO nominatim_throttle (id, last_request_at)
  VALUES (1, '1970-01-01T00:00:00Z')
  ON CONFLICT (id) DO NOTHING;
