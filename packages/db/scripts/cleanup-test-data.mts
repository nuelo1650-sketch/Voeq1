import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

// 1) RESTORE the demo vendor renamed by subagent step-1 probes.
await sql`UPDATE vendors SET name = 'Demo: Mama Nkechi Kitchen' WHERE id = '3647302d-a59a-404d-aa45-8d0f33eff748'`;
await sql`UPDATE vendors SET description = 'Demo vendor — home-style Nigerian meals on campus, made to order.' WHERE id = '3647302d-a59a-404d-aa45-8d0f33eff748'`;
console.log("restored 3647302d name+description");

// 2) DELETE my own test listing (W2 Publish Confirmation Test) on that vendor.
const delList = await sql`DELETE FROM listings WHERE title = 'W2 Publish Confirmation Test' RETURNING id`;
console.log("deleted test listing:", delList.length ?? 0);

// 3) DELETE subagent test vendors (no listings attached).
const testVendors = ["95bdc037-c81b-45e0-856e-481146f0c344", "bdc04f1d"];
for (const v of testVendors) {
  await sql`DELETE FROM vendors WHERE id = ${v}`;
  console.log("deleted test vendor:", v.slice(0, 8));
}

// 4) DELETE audit test reports + staff cases (all created by probes).
const dr = await sql`DELETE FROM reports RETURNING id`;
console.log("deleted reports:", dr.length ?? 0);
const dc = await sql`DELETE FROM staff_cases RETURNING id`;
console.log("deleted staff_cases:", dc.length ?? 0);

// 5) Show final state.
const vs: any[] = await sql`SELECT name, slug FROM vendors ORDER BY name`;
console.log("VENDORS FINAL:");
for (const v of vs) console.log(" -", v.name);
