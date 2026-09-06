/**
 * FLAG ENFORCEMENT round-trip vs TEST DB via the real repos + live API:
 * A: isFlagEnabled returns true for a flag with no row (fail-open default).
 * B: set signups.enabled=false → isFlagEnabled false → signup API 503s.
 * C: restore true → signup API proceeds past the flag gate (401 anon is fine
 *    — it means the gate PASSED and auth ran).
 * D: set messaging.enabled=false → conversation-create 503s.
 * E: unknown flag key → true (fail-open by contract).
 * Self-cleans (restores flags + deletes throwaway rows).
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);
const { realFeatureFlagRepo } = await import("../src/repos");
const { isFlagEnabled } = await import("@voeq/data");

const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

try {
  // A: absent row → default true (prod has 0 flag rows today)
  const before = await isFlagEnabled("signups.enabled");
  check("A: absent flag row → true (fail-open default)", before === true, String(before));

  // B: opt out → gate reads false
  await realFeatureFlagRepo.set("signups.enabled", false, "rt probe");
  const off = await isFlagEnabled("signups.enabled");
  check("B: signups.enabled=false → isFlagEnabled false", off === false, String(off));

  // B2: signup API 503s with the flag off (Turnstile/body never reached)
  const r1 = await fetch("http://localhost:3031/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "x@y.zz", password: "longenough1", name: "X", intent: "shopper", consent: true }),
  });
  check("B2: signup API → 503 while paused", r1.status === 503, String(r1.status));

  // C: restore → gate passes (anon hits a LATER error class, not 503)
  await realFeatureFlagRepo.set("signups.enabled", true, "rt probe");
  const r2 = await fetch("http://localhost:3031/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "x@y.zz", password: "longenough1", name: "X", intent: "shopper", consent: true }),
  });
  check("C: signup proceeds past flag gate when re-enabled", r2.status !== 503, String(r2.status));

  // D: messaging gate
  await realFeatureFlagRepo.set("messaging.enabled", false, "rt probe");
  const r3 = await fetch("http://localhost:3031/api/conversations", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "sessionId=bogus" },
    body: JSON.stringify({ vendorId: "any" }),
  });
  check("D: conversation-create → 503 while messaging disabled", r3.status === 503, String(r3.status));
  await realFeatureFlagRepo.set("messaging.enabled", true, "rt probe");

  // D2: messaging gate passes when enabled (401 anon = past the flag)
  const r4 = await fetch("http://localhost:3031/api/conversations", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "sessionId=bogus" },
    body: JSON.stringify({ vendorId: "any" }),
  });
  check("D2: conversation-create proceeds past flag gate when enabled", r4.status === 401, String(r4.status));

  // E: unknown key → true
  const unknown = await isFlagEnabled("no.such.flag");
  check("E: unknown flag key → true (fail-open)", unknown === true, String(unknown));
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
} finally {
  // restore: remove both probe flag rows entirely (absent = default true)
  await sql`DELETE FROM feature_flags WHERE key IN ('signups.enabled', 'messaging.enabled')`;
  console.log("cleaned (flag rows removed — absent = default true)");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
