-- MONEY BAG D2a — vendor cover photo (hybrid banner, Option C).
-- Idempotent. pgTable twin declared in schema.ts IN THE SAME COMMIT (Phase A lesson).
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS photo_cover text;
