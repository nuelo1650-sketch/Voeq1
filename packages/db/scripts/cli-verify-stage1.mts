/**
 * CLI CODE-VERIFICATION — Stage 1 R2.
 * Fixes: (a) the pending token must be linked to a REAL identity row first —
 * verify-otp looks up identity AFTER OTP verify (404 = identity missing);
 * (b) session probe uses /api/auth/status (real endpoint; /me doesn't exist).
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID, createHash } from "crypto";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const KEY = env.match(/RESEND_API_KEY=([^\n\r]+)/)[1];
const PROD_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
const sql = neon(PROD_URL);

const stamp = Date.now();
const EMAIL = `launch-cli-${stamp}@voeq.ng`;
const BASE = "https://voeq.ng";
const out: string[] = [];
const log = (ok: boolean, step: string, detail: string) => {
  out.push(`${ok ? "PASS" : "FAIL"} ${step}: ${detail}`);
  console.log(`${ok ? "✅" : "❌"} ${step}: ${detail}`);
};

// 0. create the identity row exactly as signup does (pending_verification, role shopper)
const ID = randomUUID();
const PASSWORD_HASH = createHash("sha256").update("LaunchCli2026!").digest("hex"); // shape only — not used to login
await sql`INSERT INTO identities (id, email, name, role, account_status, email_verified, method, consent, created_at, updated_at, password_hash)
VALUES (${ID}, ${EMAIL}, 'Launch CLI', 'shopper', 'pending_verification', false, 'email', ${JSON.stringify([])}::jsonb, ${new Date().toISOString()}, ${new Date().toISOString()}, ${PASSWORD_HASH})`;

// 1. pending token + otp rows (same as signup route writes)
const TOKEN = `cli-tok-${stamp}`;
const CODE = String(Math.floor(100000 + Math.random() * 900000));
await sql`INSERT INTO pending_tokens (token, email, purpose, created_at, expires_at, used)
VALUES (${TOKEN}, ${EMAIL}, 'registration', ${new Date().toISOString()}, ${new Date(Date.now() + 15 * 60e3).toISOString()}, false)`;
await sql`INSERT INTO otps (id, email, purpose, code, expires_at, attempts)
VALUES (${"cli-otp-" + stamp}, ${EMAIL}, 'registration', ${CODE}, ${new Date(Date.now() + 10 * 60e3).toISOString()}, 0)`;

// 2. real Resend send
const emailRes = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Voeq <hello@voeq.ng>", to: EMAIL, subject: "Your Voeq verification code",
    text: `Verify your email\n\nWelcome to Voeq! To complete your registration, enter this 6-digit code:\n\n${CODE}\n\nThis code expires in 10 minutes. If you didn't create a Voeq account, you can safely ignore this email.`,
  }),
});
const emailBody = await emailRes.json().catch(() => ({})) as { id?: string };
log(!!emailBody.id, "resend-accepted", `HTTP ${emailRes.status} id=${emailBody.id ?? "?"}`);

// 3. read back from Resend
await new Promise((r) => setTimeout(r, 4000));
const rb = await fetch(`https://api.resend.com/emails/${emailBody.id}`, { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json()) as { last_event?: string; text?: string };
const codeFromEmail = (rb.text?.match(/\b\d{6}\b/) ?? [])[0];
log(codeFromEmail === CODE, "otp-roundtrip", `event=${rb.last_event} match=${codeFromEmail === CODE}`);

// 4. verify-otp on prod with the e-mailed code
const jar: string[] = [];
const vRes = await fetch(`${BASE}/api/auth/verify-otp`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: TOKEN, code: codeFromEmail }),
});
const vBody = await vRes.json().catch(() => ({})) as { redirect?: string; ok?: boolean; error?: string };
for (const c of vRes.headers.getSetCookie?.() ?? []) jar.push(c.split(";")[0]);
log(!!vBody.ok && vBody.redirect === "/home", "verify-otp", `HTTP ${vRes.status} redirect=${vBody.redirect ?? vBody.error}`);

// 5. identity activated + consent (B3)
const row = (await sql`SELECT account_status, email_verified, consent FROM identities WHERE email = ${EMAIL}`)[0];
log(row?.account_status === "active" && row?.email_verified === true, "identity-activated", `status=${row?.account_status} verified=${row?.email_verified}`);
log((row?.consent?.length ?? 0) > 0, "consent-recorded", `entries=${row?.consent?.length ?? 0}`);

// 6. authenticated session via /api/auth/status
const stRes = await fetch(`${BASE}/api/auth/status`, { headers: { Cookie: jar.join("; ") } });
const stBody = await stRes.json().catch(() => ({})) as { authenticated?: boolean; identity?: { email?: string } };
log(stBody.authenticated === true, "session-auth", `HTTP ${stRes.status} authenticated=${stBody.authenticated} email=${stBody.identity?.email ?? stBody.identity ?? "?"}`);

// 7. single-use
const v2 = await fetch(`${BASE}/api/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TOKEN, code: codeFromEmail }) });
const v2B = await v2.json().catch(() => ({})) as { ok?: boolean };
log(v2B.ok !== true, "otp-single-use", `reuse ok=${v2B.ok} (must be undefined/false)`);

// 8. cleanup
await sql`DELETE FROM sessions WHERE identity_id = ${ID}`;
await sql`DELETE FROM notifications WHERE recipient_id = ${ID}`;
await sql`DELETE FROM identities WHERE id = ${ID}`;
await sql`DELETE FROM pending_tokens WHERE token = ${TOKEN}`;
await sql`DELETE FROM otps WHERE email = ${EMAIL}`;
const left = await sql`SELECT count(*)::int AS n FROM identities WHERE id = ${ID}`;
log(left[0].n === 0, "cleanup", `left=${left[0].n}`);

writeFileSync(join(tmpdir(), "cli-verify-stage1.json"), JSON.stringify({ email: EMAIL, out }, null, 2));
console.log("\n== STAGE 1 SUMMARY ==");
for (const l of out) console.log(l);
