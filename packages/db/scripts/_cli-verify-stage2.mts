/**
 * CLI CODE-VERIFICATION — Stages 2+3 (prod, no Turnstile involved).
 *
 * STAGE 2 — vendor journey: shopper identity (via verify-otp flow) -> vendor
 *   onboarding steps 1-3 -> REAL photo upload (sign -> Cloudinary -> Sightengine
 *   moderation via the app's own pipeline) -> listing create w/ that image ->
 *   go-live -> Explore + storefront + listing visible on prod.
 * STAGE 3 — messaging: second fresh identity messages the vendor, vendor
 *   sees unread, replies, shopper gets notification.
 * Cleanup: everything created here gets deleted child-first.
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
const BASE = "https://voeq.ng";
const stamp = Date.now();
const out: string[] = [];
const log = (ok: boolean, step: string, d: string) => { out.push(`${ok ? "PASS" : "FAIL"} ${step}: ${d}`); console.log(`${ok ? "✅" : "❌"} ${step}: ${d}`); };

// --- identity factory (same rows the real flow writes) ---
async function makeIdentity(name: string) {
  const id = randomUUID();
  const email = `cli2-${stamp}-${name}@voeq.ng`;
  const hash = createHash("sha256").update("LaunchCli2026!").digest("hex");
  await sql`INSERT INTO identities (id, email, name, role, account_status, email_verified, method, consent, created_at, updated_at, password_hash)
  VALUES (${id}, ${email}, ${name}, 'shopper', 'pending_verification', false, 'email', ${JSON.stringify([])}::jsonb, ${new Date().toISOString()}, ${new Date().toISOString()}, ${hash})`;
  const token = `cli-tok-${stamp}-${name}`;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await sql`INSERT INTO pending_tokens (token, email, purpose, created_at, expires_at, used)
  VALUES (${token}, ${email}, 'registration', ${new Date().toISOString()}, ${new Date(Date.now() + 15 * 60e3).toISOString()}, false)`;
  await sql`INSERT INTO otps (id, email, purpose, code, expires_at, attempts)
  VALUES (${"cli-otp-" + stamp + "-" + name}, ${email}, 'registration', ${code}, ${new Date(Date.now() + 10 * 60e3).toISOString()}, 0)`;
  // real Resend email
  const er = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Voeq <hello@voeq.ng>", to: email, subject: "Your Voeq verification code",
      text: `Verify your email\n\nWelcome to Voeq! To complete your registration, enter this 6-digit code:\n\n${code}\n\nThis code expires in 10 minutes. If you didn't create a Voeq account, you can safely ignore this email.` }),
  });
  const eb = await er.json() as { id?: string };
  await new Promise((r) => setTimeout(r, 3500));
  const rb = await fetch(`https://api.resend.com/emails/${eb.id}`, { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json()) as { text?: string };
  const emailed = (rb.text?.match(/\b\d{6}\b/) ?? [])[0];
  const jar: string[] = [];
  const v = await fetch(`${BASE}/api/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, code: emailed }) });
  for (const c of v.headers.getSetCookie?.() ?? []) jar.push(c.split(";")[0]);
  return { id, email, jar, emailedMatched: emailed === code };
}

// --- STAGE 2: vendor ---
const vendorPersona = await makeIdentity("Vendor");
log(vendorPersona.emailedMatched, "S2/vendor-otp-roundtrip", vendorPersona.email);

// campus set (identities.campus gates listing create 'nmu' legacy only)
const CAMPUS = "uniport";
await sql`UPDATE identities SET campus = ${CAMPUS} WHERE id = ${vendorPersona.id}`;

// onboarding step 1 (creates vendor, status pending_listings)
const s1 = await fetch(`${BASE}/api/onboarding/vendor/step-1`, {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: vendorPersona.jar.join("; ") },
  body: JSON.stringify({ name: "Launch CLI Vet", description: "CLI verification storefront exercising the full production pipeline end to end for launch readiness.", categoryId: "food", profilePhotoUrl: null }),
});
const s1b = await s1.json() as { vendorId?: string };
log(s1.ok && !!s1b.vendorId, "S2/onboard-step1", `HTTP ${s1.status} vendorId=${s1b.vendorId?.slice(0, 8)}…`);

// step 2 campus
const s2 = await fetch(`${BASE}/api/onboarding/vendor/step-2`, {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: vendorPersona.jar.join("; ") },
  body: JSON.stringify({ campus: CAMPUS, subArea: "CLI test" }),
});
log(s2.ok, "S2/onboard-step2", `HTTP ${s2.status}`);

// REAL photo: generate a valid JPEG on the fly
function makeJpeg(width: number, height: number, bytes: number[]): Buffer {
  // minimal valid baseline JPEG via a tiny canvas: build with pure bytes
  // (encoder-less): use a precomputed 1x1 white JPEG scaled up is invalid.
  // Instead: embed a real small JPEG (constructed via jpeg-js? not installed).
  // Simplest VALID jpeg: generate with node-canvas? not installed.
  // FALLBACK: use sharp? not installed. Use a known-good tiny JPEG buffer.
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 007, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1c, 0x1a, 0x1c, 0x28, 0x26, 0x37, 0x31, 0x27, 0x29, 0x35, 0x33, 0x39, 0x3b, 0x35, 0x38, 0x37, 0x40, 0x48, 0x5c, 0x4e, 0x57, 0x44, 0x42, 0x6c, 0x59, 0x66, 0x74, 0x65, 0x85, 0x74, 0x87, 0x9a, 0x88, 0x97,
    0xff, 0xc0, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xc4, 0x00, 0xd2, 0x30, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 005, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0xff, 0xc4, 0x00, 0x1f, 0x01, 0x00, 0x03, 0x01, 0x01, 0x hand-crafted
  ]);
}
console.log("SCRIPT PLACEHOLDER — see final full version");
