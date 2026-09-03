import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

async function main() {
  // Test identity through the real verify flow: what does verify-otp do?
  // 1) Is RESEND_API_KEY configured in this local env? (Render holds the real one)
  const hasKey = /RESEND_API_KEY=.+/.test(env);
  const resendFrom = (env.match(/RESEND_FROM_EMAIL=([^\n]+)/) ?? env.match(/RESEND_FROM=([^\n]+)/))?.[1];
  console.log("local RESEND_API_KEY present:", hasKey);
  console.log("local RESEND_FROM:", resendFrom ?? "(none)");

  // 2) Check whether a WELCOME email was ever attempted: look at audits
  const audits: any[] = await sql`SELECT * FROM audit_log WHERE type LIKE '%welcome%' OR type LIKE '%email%' ORDER BY at DESC LIMIT 5`;
  console.log("audit email events:", audits.length);
  for (const a of audits) console.log("  -", a.type, "|", JSON.stringify(a.metadata).slice(0, 80));
}
main().catch((e) => { console.error(e); process.exit(1); });
