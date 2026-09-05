/**
 * Round-trip test for Fix A: realMessageRepo.listByConversation must return
 * the NEWEST `limit` messages (ascending), not the oldest. Runs against the
 * TEST DB via the real Drizzle code path. Cleans up after itself.
 */
import { eq } from "drizzle-orm";
import { getDb, schemaRef as s } from "../src/client.js";
import { realMessageRepo } from "../src/repos.js";

const db = getDb(); // uses process.env.DATABASE_URL (set to test DB by caller)
const convId = "rt_test_conv_" + Date.now();
const base = Date.now();
const ts = (i: number) => new Date(base + i * 1000).toISOString(); // 1s apart, no ms collision
const N = 20;

async function seed() {
  await db.insert(s.conversations).values({
    id: convId,
    participantIds: ["rt_a", "rt_b"],
    lastMessageAt: ts(N),
    createdAt: ts(0),
    lastSeen: {},
    listingId: null,
  });
  for (let i = 1; i <= N; i++) {
    await db.insert(s.messages).values({
      id: `${convId}_m${i}`,
      conversationId: convId,
      senderId: i % 2 ? "rt_a" : "rt_b",
      body: `msg-${i}`,
      state: "sent",
      createdAt: ts(i),
      readAt: null,
      clientMsgId: null,
    });
  }
}

async function cleanup() {
  await db.delete(s.messages).where(eq(s.messages.conversationId, convId));
  await db.delete(s.conversations).where(eq(s.conversations.id, convId));
}

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) failures++;
}

try {
  await seed();

  // 1. limit=5 → newest 5 (m16..m20), ascending
  const five = await realMessageRepo.listByConversation(convId, null, 5);
  check("limit=5 returns 5 rows", five.length === 5, `got ${five.length}`);
  check("limit=5 is NEWEST (last = msg-20)", five.at(-1)?.body === "msg-20", `last=${five.at(-1)?.body}`);
  check("limit=5 first = msg-16 (not msg-1)", five[0]?.body === "msg-16", `first=${five[0]?.body}`);
  check("limit=5 ascending order", five.every((m, i) => i === 0 || m.createdAt > five[i - 1].createdAt));

  // 2. limit=1 → inbox preview = newest single message
  const one = await realMessageRepo.listByConversation(convId, null, 1);
  check("limit=1 preview = msg-20 (newest)", one[0]?.body === "msg-20", `got ${one[0]?.body}`);

  // 3. limit >= total → all messages, ascending, oldest first
  const all = await realMessageRepo.listByConversation(convId, null, 200);
  check("limit=200 returns all 20", all.length === 20, `got ${all.length}`);
  check("limit=200 oldest-first display", all[0]?.body === "msg-1" && all.at(-1)?.body === "msg-20");

  // 4. default limit (50) on a 20-msg thread → all 20
  const def = await realMessageRepo.listByConversation(convId);
  check("default limit returns all 20", def.length === 20, `got ${def.length}`);

  // 5. cursor still filters forward, then newest-N of the remainder
  const cur = await realMessageRepo.listByConversation(convId, ts(15), 3);
  check("cursor>15 limit=3 → msg-18..20", cur.map((m) => m.body).join(",") === "msg-18,msg-19,msg-20", cur.map((m) => m.body).join(","));

  // 6. empty conversation
  const empty = await realMessageRepo.listByConversation("nope_" + Date.now(), null, 5);
  check("empty conversation → []", empty.length === 0);
} finally {
  await cleanup();
  console.log(`\ncleaned up ${convId}`);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
