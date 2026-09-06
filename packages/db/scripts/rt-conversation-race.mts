/**
 * RACE round-trip vs TEST DB: (A) 20 CONCURRENT conversation creates for the
 * same pair must yield exactly ONE conversation (the pre-fix blind INSERT
 * duplicated under double-tap). (B) concurrent touchLastSeen from both
 * participants must leave BOTH stamps (pre-fix last-write-wins clobbered).
 * Self-cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);
const { realConversationRepo } = await import("../src/repos");

const stamp = Date.now().toString(36);
const a = "rt-a-" + stamp;
const b = "rt-b-" + stamp;
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

try {
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${a}, ${"a-" + stamp + "@voeq-test.example"}, 'A', 'shopper', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${b}, ${"b-" + stamp + "@voeq-test.example"}, 'B', 'vendor', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;

  // A: 20 concurrent creates — find-or-create must collapse them to ONE
  const convs = await Promise.all(
    Array.from({ length: 20 }, () => realConversationRepo.create({ participantIds: [a, b] })),
  );
  const uniqueIds = new Set(convs.map((c) => c.id));
  check("A: 20 concurrent creates → 1 conversation", uniqueIds.size === 1, `unique: ${uniqueIds.size}`);

  const convId = convs[0].id;

  // B: concurrent lastSeen stamps from BOTH participants
  await Promise.all([
    realConversationRepo.touchLastSeen(convId, a),
    realConversationRepo.touchLastSeen(convId, b),
    realConversationRepo.touchLastSeen(convId, a),
    realConversationRepo.touchLastSeen(convId, b),
  ]);
  const row = await sql`SELECT last_seen FROM conversations WHERE id = ${convId}`;
  const lastSeen = row[0]?.last_seen ?? {};
  check("B: both participants' lastSeen survive", Boolean(lastSeen[a]) && Boolean(lastSeen[b]), JSON.stringify(Object.keys(lastSeen)));

  // C: existing conversation with a DIFFERENT listingId still creates new (listing-scoped)
  const conv2 = await realConversationRepo.create({ participantIds: [a, b], listingId: "listing-x" });
  check("C: different listingId → separate conversation", conv2.id !== convId);

  // D: same listingId find-or-create returns the SAME conversation
  const conv3 = await realConversationRepo.create({ participantIds: [a, b], listingId: "listing-x" });
  check("D: same listingId → same conversation", conv3.id === conv2.id);

  await sql`DELETE FROM conversations WHERE participant_ids @> ${JSON.stringify([a])}::jsonb`;
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
} finally {
  await sql`DELETE FROM conversations WHERE participant_ids @> ${JSON.stringify([a])}::jsonb`;
  await sql`DELETE FROM identities WHERE id IN (${a}, ${b})`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
