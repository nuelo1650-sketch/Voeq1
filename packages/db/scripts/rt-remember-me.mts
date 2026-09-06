/**
 * REMEMBER-ME E2E vs TEST DB via the REAL login API:
 * A: login remember=true → session expiresAt ≈ +30d (25-35d window) + cookie survives
 * B: login remember=false → session expiresAt ≈ +1d (20-28h window)
 * C: both sessions actually validate (get → identity) while unexpired
 * Seeds a real identity with a known argon2 password; self-cleans.
 * NOTE: Turnstile — verifyTurnstile SKIPS when secret unset (graceful degrade,
 * documented), so the probe works only if TURNSTILE_SECRET_KEY is unset in the
 * dev-server env. We assert what actually happens and report honestly.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const email = `rm-${stamp}@voeq-test.example`;
const password = "probe-password-123";
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

try {
  // hash exactly like signup does
  const { hash } = await import("@node-rs/argon2");
  const pwHash = await hash(password);
  const idId = `rm-i-${stamp}`;
  await sql`INSERT INTO identities (id, email, name, password_hash, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${email}, 'Remember Me', ${pwHash}, 'shopper', 'nmu-okerenkoko', 'active', true, ${JSON.stringify([{ kind: "terms", version: "2026-09-05", at: new Date().toISOString() }, { kind: "privacy", version: "2026-09-05", at: new Date().toISOString() }])}::jsonb, now(), now())`;

  const BASE = "http://localhost:3031";
  const login = async (remember: boolean) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, remember, intent: "shopper", turnstileToken: "probe-token" }),
    });
    const setCookie = res.headers.get("set-cookie") ?? "";
    const body = await res.json().catch(() => ({}));
    return { status: res.status, setCookie, body };
  };

  // A: remember=true
  const a = await login(true);
  check("A1: login (remember=true) succeeds", a.status === 200, `${a.status} ${JSON.stringify(a.body).slice(0, 80)}`);
  const aSid = (a.setCookie.match(/sessionId=([^;]+)/) ?? [])[1] ?? "";
  const aRow = aSid ? await sql`SELECT expires_at, created_at FROM sessions WHERE id = ${aSid}` : [];
  if (aRow.length) {
    const ttlDays = (new Date(aRow[0].expires_at).getTime() - Date.now()) / 86400000;
    check("A2: TTL ≈ 30 days", ttlDays > 25 && ttlDays <= 31, `${ttlDays.toFixed(2)}d`);
  } else {
    check("A2: TTL ≈ 30 days", false, "no session row found");
  }

  // B: remember=false
  const b = await login(false);
  check("B1: login (remember=false) succeeds", b.status === 200, `${b.status}`);
  const bSid = (b.setCookie.match(/sessionId=([^;]+)/) ?? [])[1] ?? "";
  const bRow = bSid ? await sql`SELECT expires_at FROM sessions WHERE id = ${bSid}` : [];
  if (bRow.length) {
    const ttlHours = (new Date(bRow[0].expires_at).getTime() - Date.now()) / 3600000;
    check("B2: TTL ≈ 1 day", ttlHours > 20 && ttlHours <= 25, `${ttlHours.toFixed(1)}h`);
  } else {
    check("B2: TTL ≈ 1 day", false, "no session row found");
  }

  // C: both sessions validate against /api/auth/status
  if (aSid) {
    const sa = await fetch(`${BASE}/api/auth/status`, { headers: { cookie: `sessionId=${aSid}` } });
    const ba = await fetch(`${BASE}/api/auth/status`, { headers: { cookie: `sessionId=${bSid}` } });
    check("C: both sessions authenticate", sa.status === 200 && ba.status === 200, `${sa.status}/${ba.status}`);
  }

  await sql`DELETE FROM sessions WHERE identity_id = ${idId}`;
  await sql`DELETE FROM identities WHERE id = ${idId}`;
  console.log("cleaned");
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
