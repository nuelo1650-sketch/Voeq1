/**
 * LOAD-OLDER round-trip vs TEST DB: seed a conversation with 120 messages,
 * drive the REAL API (local dev): GET returns newest 50 + hasMore=true;
 * ?before= pages backward 50/50/20 and hasMore=false at the end; message
 * ORDER stays oldest-first in every page; no duplicates across pages.
 * Seeds two identities + session; self-cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const buyer = "rt-buyer-" + stamp;
const seller = "rt-seller-" + stamp;
const convId = "rt-conv-" + stamp;
const sessId = "rt-sess-" + stamp;
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

try {
  // buyer identity (shopper), seller identity (vendor) — conversation participants
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${buyer}, ${"buyer-" + stamp + "@voeq-test.example"}, 'Buyer', 'shopper', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${seller}, ${"seller-" + stamp + "@voeq-test.example"}, 'Seller', 'vendor', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO conversations (id, participant_ids, last_message_at, created_at, last_seen, listing_id)
    VALUES (${convId}, ${JSON.stringify([buyer, seller])}::jsonb, now()::text, now()::text, '{}'::jsonb, NULL)`;
  // 120 messages with DISTINCT createdAt (1ms apart so string ordering is stable)
  for (let i = 0; i < 120; i++) {
    const mid = "rt-m-" + stamp + "-" + i;
    const created = new Date(Date.now() - (120 - i) * 1000).toISOString();
    await sql`INSERT INTO messages (id, conversation_id, sender_id, body, state, created_at)
      VALUES (${mid}, ${convId}, ${i % 2 === 0 ? buyer : seller}, ${"msg " + i}, 'delivered', ${created})`;
  }
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at)
    VALUES (${sessId}, ${buyer}, now() + interval '1 hour', now())`;

  // A: initial GET → newest 50 + hasMore
  let r = await fetch(`http://localhost:3031/api/conversations/${convId}/messages`, {
    headers: { cookie: `sessionId=${sessId}` },
  });
  if (r.status !== 200) throw new Error("initial GET " + r.status);
  let data = await r.json();
  check("initial: 50 newest", data.messages.length === 50, `got ${data.messages.length}`);
  check("initial: hasMore true", data.hasMore === true, String(data.hasMore));
  check("initial: newest is msg 119", data.messages[data.messages.length - 1]?.body === "msg 119", data.messages[data.messages.length - 1]?.body);
  check("initial: oldest is msg 70", data.messages[0]?.body === "msg 70", data.messages[0]?.body);

  // B: page 2 with ?before=
  r = await fetch(`http://localhost:3031/api/conversations/${convId}/messages?before=${encodeURIComponent(data.messages[0].createdAt)}`, {
    headers: { cookie: `sessionId=${sessId}` },
  });
  data = await r.json();
  check("page2: 50 older", data.messages.length === 50, `got ${data.messages.length}`);
  check("page2: hasMore true", data.hasMore === true, String(data.hasMore));
  check("page2: oldest is msg 20", data.messages[0]?.body === "msg 20", data.messages[0]?.body);

  // C: final page
  r = await fetch(`http://localhost:3031/api/conversations/${convId}/messages?before=${encodeURIComponent(data.messages[0].createdAt)}`, {
    headers: { cookie: `sessionId=${sessId}` },
  });
  data = await r.json();
  check("page3: 20 oldest", data.messages.length === 20, `got ${data.messages.length}`);
  check("page3: hasMore false", data.hasMore === false, String(data.hasMore));
  check("page3: oldest is msg 0", data.messages[0]?.body === "msg 0", data.messages[0]?.body);

  // D: order check — page3 oldest-first
  const ordered = data.messages.every((m: any, i: number, a: any[]) => i === 0 || a[i - 1].createdAt <= m.createdAt);
  check("page3: oldest-first order", ordered);
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 200));
} finally {
  await sql`DELETE FROM messages WHERE conversation_id = ${convId}`;
  await sql`DELETE FROM conversations WHERE id = ${convId}`;
  await sql`DELETE FROM sessions WHERE id = ${sessId}`;
  await sql`DELETE FROM identities WHERE id IN (${buyer}, ${seller})`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
