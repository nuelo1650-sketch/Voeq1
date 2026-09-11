/** Find + scrub empty-string OR null entries in listings.images (prod). */
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

// Robust: any images[] containing a non-string or empty string (the LIKE
// '%""%' check missed [null] — a JSON null, which the render guard already
// filters but the data should be clean).
const rows = await sql`SELECT id, title, images FROM listings WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(images) e WHERE jsonb_typeof(e) <> 'string' OR e #>> '{}' = '')`;
console.log("affected:", JSON.stringify(rows.map((r) => ({ id: r.id, title: r.title, images: r.images }))));

if (process.argv[2] === "--apply") {
  for (const r of rows) {
    const clean = (r.images as (string | null)[]).filter((u): u is string => typeof u === "string" && u.trim() !== "");
    await sql`UPDATE listings SET images = ${JSON.stringify(clean)}::jsonb WHERE id = ${r.id}`;
    console.log("scrubbed", r.id, "->", clean.length, "images");
  }
  const after = await sql`SELECT count(*) AS n FROM listings WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(images) e WHERE jsonb_typeof(e) <> 'string' OR e #>> '{}' = '')`;
  console.log("remaining affected:", after[0].n);
}
process.exit(0);
