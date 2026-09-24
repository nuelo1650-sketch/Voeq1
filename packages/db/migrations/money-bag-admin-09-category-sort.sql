-- ADMIN-09: add sort_order to categories table. Idempotent.
-- Pinned: "Other" slug gets the highest sort_order value so it always sorts last.
-- Apply to TEST first, verify, then prod.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Create index for ordering (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_categories_sort_order') THEN
    CREATE INDEX idx_categories_sort_order ON categories(sort_order);
  END IF;
END$$;

-- Backfill sort_order for existing seeded categories based on their known display order.
-- "Other" always gets the highest value (99999) so it sorts last.
-- The display order follows the explore-view seed taxonomy (by id alphabetical as stable proxy).
UPDATE categories SET sort_order = CASE slug
  WHEN 'food' THEN 10
  WHEN 'fashion' THEN 20
  WHEN 'tech-repairs' THEN 30
  WHEN 'beauty-care' THEN 40
  WHEN 'academic-services' THEN 50
  WHEN 'books' THEN 60
  WHEN 'printing' THEN 70
  WHEN 'photography' THEN 80
  WHEN 'tailoring' THEN 90
  WHEN 'logistics' THEN 100
  WHEN 'home-essentials' THEN 110
  WHEN 'health-wellness' THEN 120
  WHEN 'groceries' THEN 130
  WHEN 'tutorials' THEN 140
  WHEN 'rentals' THEN 150
  WHEN 'events' THEN 160
  WHEN 'travel-transport' THEN 170
  WHEN 'student-support' THEN 180
  WHEN 'other' THEN 99999
  -- Any other seeded/unseeded categories: position after known ones by alphabetical id
  ELSE 50000 + (ascii(left(id, 1)) * 100)
END
WHERE sort_order = 0;
