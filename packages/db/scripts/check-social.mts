import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
for (const t of ["saved_items","follows","likes","reviews","page_events","messages"]) {
  try { const r = await sql(`SELECT count(*) c FROM ${t}`); console.log(t, "=", r[0].c); }
  catch(e) { console.log(t, "ERR"); }
}
