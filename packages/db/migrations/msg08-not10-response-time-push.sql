-- MSG-08 — Vendor response-time tracking.
-- Idempotent. Records when a buyer sends the first message and when the vendor first replies.
-- pgTable twin declared in schema.ts IN THE SAME COMMIT.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS buyer_message_at text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS vendor_reply_at text;

-- NOT-10 — Push notification subscriptions.
-- Stores Web Push Protocol subscription endpoints per identity.
-- pgTable twin declared in schema.ts IN THE SAME COMMIT.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id text PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  identity_id text NOT NULL,
  created_at text NOT NULL DEFAULT '',
  updated_at text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS push_subscriptions_identity_idx ON push_subscriptions (identity_id);
