import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

// 1) What's behind the views count — page_events by type/ref_id (vendor storefront + listing views)
const types = await sql`SELECT type, ref_id, count(*) n, min("at") first_at, max("at") last_at FROM page_events WHERE type IN ('storefront_view','listing_view') GROUP BY type, ref_id ORDER BY n DESC LIMIT 8`;
console.log("PAGE EVENTS (type/ref_id/count):");
for (const r of types) console.log(" ", r.type, "|", String(r.ref_id).slice(0, 14), "|", r.n, "|", String(r.first_at).slice(0, 10), "->", String(r.last_at).slice(0, 10));

// 2) identity vs vendor vs staff — who's who (Hermes setup = owidavid)
const ids = await sql`SELECT id, name, email, role, "staff_role", "vendor_id", "account_status", "created_at" FROM identities ORDER BY created_at DESC LIMIT 6`;
console.log("\nIDENTITIES (recent):");
for (const r of ids) console.log(" ", r.name, "|", r.email, "| role:", r.role, "| staff:", r.staff_role, "| vendorId:", String(r.vendor_id).slice(0, 10), "|", r.account_status);

// 3) notifications count by recipient
const notifs = await sql`SELECT recipient_id, count(*) n, count(*) FILTER (WHERE "is_read" IS FALSE) unread FROM notifications GROUP BY recipient_id ORDER BY n DESC LIMIT 5`;
console.log("\nNOTIFICATIONS by recipient:");
for (const r of notifs) console.log(" ", String(r.recipient_id).slice(0, 10), "| total:", r.n, "| unread:", r.unread);
