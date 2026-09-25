import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const t = readFileSync("apps/web/.env.local", "utf8");
const m = t.match(/^DATABASE_URL=(.*)$/m);
const sql = neon(m![1]);
const rows = await sql`SELECT id, name, slug FROM categories WHERE is_active = true ORDER BY sort_order ASC`;
console.log(JSON.stringify(rows, null, 2));
