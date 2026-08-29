import { getDb } from "@voeq/db";
import { sql } from "drizzle-orm";

const db = getDb();
for (const t of ["identities", "vendors", "listings", "campuses", "categories", "reviews", "conversations", "messages", "sessions", "otps", "follows", "likes", "comments", "notifications"]) {
  const res = await db.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "${t}"`));
  console.log(`${t}:`, res.rows[0].n);
}
const admin = await db.execute(sql.raw(`SELECT email, staff_role, account_status FROM "identities" WHERE staff_role = 'super_admin'`));
console.log("super-admin:", JSON.stringify(admin.rows));
const campuses = await db.execute(sql.raw(`SELECT COUNT(*)::int AS n, source FROM "campuses" GROUP BY source`));
console.log("campuses by source:", JSON.stringify(campuses.rows));
process.exit(0);
