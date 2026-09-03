import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

async function migrate(url: string, label: string) {
  const sql = neon(url);
  const cols: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='page_events'`;
  if (cols.length === 0) {
    await sql`CREATE TABLE page_events (
      id text PRIMARY KEY,
      identity_id text,
      type text NOT NULL,
      ref_id text,
      path text,
      platform text,
      ip_hash text,
      at text NOT NULL
    )`;
    console.log(`[${label}] CREATED page_events`);
  } else {
    console.log(`[${label}] page_events exists`);
  }
  const idx: any[] = await sql`SELECT indexname FROM pg_indexes WHERE tablename='page_events'`;
  if (!idx.some((i) => i.indexname === "page_events_type_at_idx")) {
    await sql`CREATE INDEX page_events_type_at_idx ON page_events (type, at)`;
    console.log(`[${label}] added index`);
  }
}
await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
console.log("done");
