import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const audits: any[] = await sql`SELECT type, metadata FROM audit_log WHERE at > (now() - interval '10 minutes') ORDER BY at DESC LIMIT 8`;
  console.log("recent audits:", audits.length);
  for (const a of audits) console.log(" -", a.type, "|", JSON.stringify(a.metadata).slice(0, 80));
}
main();
