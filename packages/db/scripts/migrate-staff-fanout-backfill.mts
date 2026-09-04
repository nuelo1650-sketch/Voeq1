/**
 * Staff fan-out backfill (2026-09-04): re-point the 7 stranded 'admin' inbox
 * rows at real staff identities so they become readable. Re-pointing (not
 * duplicating) keeps history at one row per event: each event becomes one
 * notification for EVERY current super_admin (2 in prod roster), since the
 * events were triage-tier. Idempotent: only touches recipient_id='admin'.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const PROD = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
const sql = neon(PROD);

const staff = await sql`
  SELECT id, staff_role FROM identities
  WHERE staff_role IS NOT NULL AND account_status = 'active'`;
const supers = staff.filter((s: any) => s.staff_role === "super_admin");
console.log(`staff roster: ${staff.length} | super_admins: ${supers.length}`);
if (!supers.length) throw new Error("no super_admin to receive backfilled alerts");

const stranded = await sql`
  SELECT id, type, ref_id, created_at FROM notifications WHERE recipient_id = 'admin'`;
console.log(`stranded 'admin' rows: ${stranded.length}`);

// For each stranded row: re-point to first super_admin, then insert a copy
// for each additional super_admin (so every super gets the alert, one-time).
const now = new Date().toISOString();
let repointed = 0;
let copied = 0;
for (const row of stranded) {
  await sql`UPDATE notifications SET recipient_id = ${supers[0].id} WHERE id = ${row.id}`;
  repointed++;
  for (const extra of supers.slice(1)) {
    await sql`
      INSERT INTO notifications (id, recipient_id, type, title, body, ref_id, read, created_at)
      VALUES (${'n' + row.id.slice(1) + extra.id.slice(0, 4)}, ${extra.id}, ${row.type}, 'Admin alert (backfilled)', 'Staff alert from the old shared inbox — now delivered to your bell.', ${row.ref_id}, false, ${now})`;
    copied++;
  }
}
console.log(`re-pointed ${repointed} rows to super_admin #1, copied ${copied} for additional super_admins`);

// read-back: admin inbox empty, staff bells carry the alerts
const adminLeft = await sql`SELECT count(*)::int AS n FROM notifications WHERE recipient_id = 'admin'`;
console.log(`'admin' inbox remaining: ${adminLeft[0].n} (want 0)`);
const bells = await sql`
  SELECT i.email, count(*)::int AS n FROM notifications n
  JOIN identities i ON i.id = n.recipient_id
  WHERE i.staff_role = 'super_admin'
  GROUP BY i.email`;
console.log("super_admin bells now:", JSON.stringify(bells.map((b: any) => ({ ...b, email: b.email.replace(/^(.{3}).*(@.*)$/, "$1***$2") }))));
