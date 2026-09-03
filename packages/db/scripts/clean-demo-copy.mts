import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  // Remove the demo-review note from descriptions (immersion break); keep
  // honest, real-sounding copy.
  const rows: any[] = await sql`SELECT id, name, description FROM vendors`;
  for (const v of rows) {
    const d = (v.description ?? "").replace(/\s*\(Delete via admin when done reviewing\.?\)\s*/gi, "").trim();
    if (d !== v.description) {
      await sql`UPDATE vendors SET description = ${d} WHERE id = ${v.id}`;
      console.log("cleaned:", v.name, "->", d.slice(0, 60));
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
