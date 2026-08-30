import { neon } from "@neondatabase/serverless";
import { neon as neon2 } from "@neondatabase/serverless";

const prodUrl = process.env.DATABASE_URL!;
const testDirect = prodUrl.replace(/-pooler\./, ".").replace(/\/neondb(\?|$)/, "/neondb_test?sslmode=require");

const prod = neon(prodUrl.replace(/channel_binding=require&?/, ""));
const test = neon2(testDirect);

// 1) Create the Postgres enum types FIRST (from schema.ts, the source of truth).
const enums: Record<string, string[]> = {
  account_status: ["pending_verification", "active", "suspended", "banned", "deleted"],
  auth_method: ["email", "google"],
  user_role: ["shopper", "vendor", "admin"],
  otp_purpose: ["registration", "google_verify", "email_change"],
  message_state: ["pending", "sent", "delivered", "read", "failed"],
  report_category: ["not_on_campus", "scam", "inappropriate", "impersonation", "harassment", "other"],
  campus_source: ["seeded", "user-added"],
  campus_status: ["verified", "unverified"],
};
for (const [name, vals] of Object.entries(enums)) {
  try {
    await test(`CREATE TYPE "${name}" AS ENUM (${vals.map((v) => `'${v}'`).join(", ")})`);
    console.log(`enum ${name}`);
  } catch (e) {
    const m = (e as Error).message;
    if (/already exists/i.test(m)) console.log(`enum ${name} (already)`);
    else console.log(`enum ${name} ERR: ${m.slice(0, 80)}`);
  }
}

// 2) Create tables. USER-DEFINED columns -> their enum type; defaults verbatim.
const tables = await prod(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name",
);
const names = tables.map((t) => t.table_name).filter((n) => !n.startsWith("_drizzle") && n !== "drizzle");

let created = 0, failed = 0;
for (const t of names) {
  try {
    const cols = await prod(
      `SELECT column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' ORDER BY ordinal_position`,
    );
    if (!cols.length) { failed++; continue; }
    const pkRes = await prod(
      `SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey) WHERE i.indrelid='public.${t}'::regclass AND i.indisprimary`,
    );
    const pkCols = pkRes.map((r) => r.attname);

    const defs = cols.map((c) => {
      let d = `"${c.column_name}"`;
      if (c.data_type === "USER-DEFINED") d += ` ${c.udt_name}`;
      else if (c.data_type === "text") d += " text";
      else if (c.data_type === "boolean") d += " boolean";
      else if (c.data_type === "jsonb" || c.data_type === "json") d += " jsonb";
      else if (c.data_type === "integer") d += " integer";
      else if (c.data_type === "bigint") d += " bigint";
      else if (c.data_type === "double precision") d += " double precision";
      else if (c.data_type === "numeric") d += " numeric";
      else if (c.data_type === "timestamp without time zone") d += " timestamp";
      else if (c.data_type === "timestamp with time zone") d += " timestamptz";
      else d += " text";
      if (pkCols.includes(c.column_name)) d += " PRIMARY KEY";
      else if (c.is_nullable === "NO" && !c.column_default && c.column_name !== "id") d += " NOT NULL";
      if (c.column_default) d += ` DEFAULT ${c.column_default}`;
      return d;
    });
    await test(`CREATE TABLE IF NOT EXISTS "${t}" (${defs.join(", ")})`);
    created++;
  } catch (e) {
    failed++;
    console.log(`FAIL ${t}: ${(e as Error).message.slice(0, 90)}`);
  }
}
console.log(`\nDONE created=${created} failed=${failed}`);
process.exit(0);
