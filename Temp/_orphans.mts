import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const rows = await sql`SELECT id, email, created_at FROM identities WHERE email LIKE 'lx-%' OR email LIKE 'rbg-%' OR email LIKE 'mbg-%' ORDER BY created_at DESC LIMIT 10`;
console.log("orphans:", JSON.stringify(rows.map((r) => r.email)));
const li = await sql`SELECT count(*)::int AS n FROM listings WHERE id LIKE 'mbg-%' OR id LIKE 'rbg-%' OR id LIKE 'lx-%'`;
console.log("orphan listings:", li[0].n);
