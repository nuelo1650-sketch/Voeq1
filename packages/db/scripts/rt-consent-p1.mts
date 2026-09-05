/**
 * Round-trip test for Config Console P1: consent wired to the agreements table.
 * Chain proven against TEST DB via the real repo code path:
 *   1. resolveCurrentAgreementVersions returns the seeded current rows
 *   2. acceptConsent stamps the RESOLVED versions (not constants)
 *   3. isConsentCurrent true for that acceptance
 *   4. Publish privacy v2 (kind-scoped setCurrent) → isConsentCurrent flips FALSE
 *      (the user must re-consent — this is the whole point of the wiring)
 *   5. Re-accept → stamps v2 → isConsentCurrent true again
 *   6. terms stays current throughout (kind-scoping, no cross-kind leak)
 * Cleans up after itself. Run: npx tsx scripts/rt-consent-p1.mts (from packages/db)
 */
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { getDb, schemaRef as s } from "../src/client.js";
import { realConsentRepo, realAgreementRepo, resolveCurrentAgreementVersions } from "../src/repos.js";
import { realIdentityRepo } from "../src/repos.js";

// Test DB URL = prod URL with DATABASE name rewritten (anchored on `?` so the
// ROLE name is never touched).
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
process.env.DATABASE_URL = prodUrl.includes("/neondb?")
  ? prodUrl.replace("/neondb?", "/neondb_test?")
  : prodUrl.replace(/\/neondb$/, "/neondb_test");

const db = getDb();
let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
};

// ---- setup: throwaway identity ---------------------------------------------
const ident = await realIdentityRepo.createPending({
  email: `rt-p1-${Date.now()}@voeq-test.ng`,
  name: "RT P1",
  passwordHash: "x",
  method: "email",
  intent: "shopper",
});
check("setup: identity created", !!ident.id);

// ---- 1. resolver returns seeded versions -----------------------------------
const v0 = await resolveCurrentAgreementVersions();
check("resolver: terms=2026-08-01 from seeded row", v0.terms === "2026-08-01", JSON.stringify(v0));
check("resolver: privacy=2026-08-01 from seeded row", v0.privacy === "2026-08-01");

// ---- 2. accept stamps resolved versions ------------------------------------
await realConsentRepo.accept(ident.id, "email");
const latest1 = await realConsentRepo.latest(ident.id);
check("accept stamps resolved terms version", latest1?.termsVersion === "2026-08-01", `got ${latest1?.termsVersion}`);
check("accept stamps resolved privacy version", latest1?.privacyVersion === "2026-08-01", `got ${latest1?.privacyVersion}`);

// ---- 3. isCurrent true ------------------------------------------------------
check("isCurrent true after acceptance", await realConsentRepo.isCurrent(ident.id) === true);

// ---- 4. publish privacy v2 → consent goes stale ------------------------------
const p2 = await realAgreementRepo.create({ kind: "privacy", version: "rt-p1-privacy-v2", body: "rt" });
await realAgreementRepo.setCurrent(p2.id);
const v1 = await resolveCurrentAgreementVersions();
check("resolver: privacy flips to v2 after publish", v1.privacy === "rt-p1-privacy-v2", JSON.stringify(v1));
check("resolver: terms UNCHANGED by privacy publish (kind-scoped)", v1.terms === "2026-08-01");
check("isCurrent flips FALSE after privacy v2 (user must re-consent)",
  await realConsentRepo.isCurrent(ident.id) === false,
  "THE chain: config publish → consent wall");

// ---- 5. re-accept stamps v2 → current again ----------------------------------
await realConsentRepo.accept(ident.id, "email");
const latest2 = await realConsentRepo.latest(ident.id);
check("re-accept stamps privacy v2", latest2?.privacyVersion === "rt-p1-privacy-v2", `got ${latest2?.privacyVersion}`);
check("isCurrent true after re-accept", await realConsentRepo.isCurrent(ident.id) === true);

// ---- cleanup ------------------------------------------------------------------
// Restore privacy 2026-08-01 as current (test-DB hygiene), remove probe rows.
await realAgreementRepo.setCurrent("agr-privacy-2026-08-01");
await db.delete(s.agreements).where(eq(s.agreements.id, p2.id));
await db.delete(s.identities).where(eq(s.identities.id, ident.id));
const after: any[] = await db.select().from(s.agreements);
const tCur = after.find((a) => a.kind === "terms" && a.isCurrent);
const pCur = after.find((a) => a.kind === "privacy" && a.isCurrent);
check("cleanup: terms current restored", tCur?.version === "2026-08-01");
check("cleanup: privacy current restored", pCur?.version === "2026-08-01");
check("cleanup: probe agreement removed", !after.some((a) => a.version === "rt-p1-privacy-v2"));
const leftoverId: any[] = await db.select().from(s.identities).where(eq(s.identities.id, ident.id));
check("cleanup: probe identity removed", leftoverId.length === 0);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
