-- ONBOARD-03: make vendors.campus nullable. Idempotent.
ALTER TABLE vendors ALTER COLUMN campus DROP NOT NULL;
