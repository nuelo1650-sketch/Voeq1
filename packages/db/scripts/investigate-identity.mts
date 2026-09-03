import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

// The real user + vendor-linked identities
const ids = await sql`
  SELECT id, name, email, role, staff_role, vendor_id, account_status, created_at, google_subject
  FROM identities
  WHERE email ILIKE '%owidavid%' OR email ILIKE '%voeq.ng' OR vendor_id IS NOT NULL OR staff_role IS NOT NULL
  ORDER BY created_at DESC LIMIT 10`;
console.log("IDENTITIES (relevant):");
for (const r of ids) {
  console.log(" ", r.name ?? "?", "|", r.email, "| role:", r.role, "| staff:", r.staff_role, "| vendorId:", String(r.vendor_id).slice(0, 10), "|", r.account_status, "| gsub:", r.google_subject ? "yes" : "no");
}

// Notifications table columns
const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position`;
console.log("\nNOTIFICATIONS columns:", cols.map((c) => c.column_name).join(", "));

// Vendor 29e56e78 (the 75-view one) vs 3647302d
const vs = await sql`SELECT id, name, status, campus, "identity_id" FROM vendors WHERE id IN ('29e56e78-3d2d-4c30-97ad-88b0dbe3b284'::text, '3647302d-a59a-404d-aa45-8d0f33eff748'::text)`;
console.log("\nVENDORS:");
for (const v of vs) console.log(" ", String(v.id).slice(0, 10), "|", v.name, "|", v.status, "| identity:", String(v.identity_id).slice(0, 10));
