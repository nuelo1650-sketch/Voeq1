import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const sql = neon(env.match(/DATABASE_URL=([^\n\r]+)/)[1]);
const r = await sql`SELECT id, email, role, vendor_id, staff_role FROM identities WHERE email = 'dev-shopper@voeq.ng' OR email = 'dev-vendor@voeq.ng' OR email = 'dev-admin@voeq.ng' ORDER BY email LIMIT 8`;
for (const x of r) console.log(String(x.email).padEnd(30), "| role:", String(x.role).padEnd(8), "| vendorId:", String(x.vendor_id ?? "-").slice(0, 12), "| staff:", x.staff_role ?? "-");
