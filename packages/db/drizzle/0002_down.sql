-- ============================================================================
-- Rollback for 0002_campus_overhaul.sql
-- Drops everything 0002 added. Reversible in one transaction.
-- NOTE: this does NOT restore deleted SA campus rows — those are restored from
-- the pg_dump taken before the data migration (see DATAMIG step), not from here.
-- ============================================================================

DROP TABLE IF EXISTS nominatim_throttle;
DROP INDEX IF EXISTS campuses_status_slug_idx;
DROP INDEX IF NOT EXISTS campuses_slug_unique;

ALTER TABLE campuses
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng,
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS created_by_user_id,
  DROP COLUMN IF EXISTS created_at;

DROP TYPE IF EXISTS campus_status;
DROP TYPE IF EXISTS campus_source;
