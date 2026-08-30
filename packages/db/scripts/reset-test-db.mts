import { neon } from "@neondatabase/serverless";

const prodUrl = process.env.DATABASE_URL!;
const testDirect = prodUrl.replace(/-pooler\./, ".").replace(/\/neondb(\?|$)/, "/neondb_test?sslmode=require");
const test = neon(testDirect);

// Drop enums + tables that the earlier partial runs may have left, so we run clean.
const drops = [
  'DROP TABLE IF EXISTS follows, likes, listings, magic_links, notifications, otps, pending_tokens, reports, reviews, sessions, staff_cases, user_preferences, vendors, wishlist_items, identities, messages, comments, conversations, agreements, feature_flags, activity_events, audit_log, categories, campuses, nominatim_throttle CASCADE',
];
for (const d of drops) {
  try { await test(d); console.log("dropped tables"); } catch (e) { console.log("drop tables:", (e as Error).message.slice(0, 80)); }
}
for (const name of ["account_status","auth_method","user_role","otp_purpose","message_state","report_category","campus_source","campus_status"]) {
  try { await test(`DROP TYPE IF EXISTS "${name}" CASCADE`); } catch { /* ignore */ }
}
const left = await test("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
console.log("tables remaining:", left.map((t) => t.table_name).join(", ") || "(none)");
process.exit(0);
