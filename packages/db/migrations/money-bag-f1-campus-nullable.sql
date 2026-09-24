-- MONEY BAG F1 COMPLETION — non-campus vendors: vendors.campus must be nullable.
-- Founder 2026-09-13: "hope non campus vendor to show and work" — the areas
-- taxonomy (B3) + repo area filtering + /explore/areas pages exist, but the
-- wizard FORCES a campus choice (campus NOT NULL), so no vendor could ever
-- exist on an area alone. Additive, idempotent.
ALTER TABLE vendors ALTER COLUMN campus DROP NOT NULL;
