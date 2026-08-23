import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockAuthRepo,
  mockVendorRepo,
  mockConversationRepo,
  mockMessageRepo,
  checkRateLimit,
  logAudit,
} from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";
import { broadcastMessage, broadcastStateChange, pushNotification } from "@/lib/sse-bus";

/**
 * VS6.6 / VS6.7 / VS6.8 — Conversation messages.
 * POST: send a message (participant-only, 1-4000 chars, rate-limited 30/min,
 *   idempotent via clientMsgId, FAIL_TEST -> 503 + failed state, suspended vendor
 *   cannot send). GET: list messages (participant-only 403 IDOR), mark delivered
 *   for the recipient on fetch. State is server-authoritative.
 */
async function getParticipant(convId: string, cookie: string | undefined) {
  const identity = await mockAuthRepo.currentIdentity(cookie ?? null);
  if (!identity) return { identity: null as null, conv: null as null, forbidden: false };
  const conv = await mockConversationRepo.getById(convId);
  if (!conv) return { identity, conv: null, forbidden: false };
  if (!conv.participantIds.includes(identity.id)) {
    return { identity, conv, forbidden: true };
  }
  return { identity, conv, forbidden: false };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: convId } = await params;
  const store = await cookies();
  const { identity, conv, forbidden } = await getParticipant(convId, store.get(SESSION_COOKIE)?.value);

  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (forbidden) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const messages = await mockMessageRepo.listByConversation(convId, null, 50);
  // Mark delivered for the recipient (not the sender) on fetch.
  await mockMessageRepo.markDelivered(convId, identity.id);
  // T3 — reflect delivered transitions on the sender's stream (per message).
  for (const m of messages) {
    if (m.senderId !== identity.id && m.state === "delivered") {
      broadcastStateChange(convId, m.id, "delivered", m.readAt ?? null);
    }
  }
  await mockConversationRepo.touchLastSeen(convId, identity.id);
  return NextResponse.json({ ok: true, messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: convId } = await params;
  const store = await cookies();
  const { identity, conv, forbidden } = await getParticipant(convId, store.get(SESSION_COOKIE)?.value);

  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (forbidden) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Read-only mode: suspended vendor can READ but not SEND (VS6.11).
  const vendor = await mockVendorRepo.getById(identity.vendorId ?? "");
  if (vendor && vendor.status === "suspended") {
    return NextResponse.json({ error: "vendor_suspended", message: "Your storefront is suspended. You can read messages but cannot reply." }, { status: 403 });
  }

  // Rate limit: 30 messages / 60s per identity (Doc 09 §9.13).
  const rl = await checkRateLimit(`msg:${identity.id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited", retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  let body: { body?: string; clientMsgId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < 1) return NextResponse.json({ error: "body_empty" }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "body_too_long" }, { status: 400 });

  // Mock failure trigger (VS6.8): explicit failure, never silent loss.
  if (text === "FAIL_TEST") {
    const failed = await mockMessageRepo.create({
      conversationId: convId,
      senderId: identity.id,
      body: text,
      clientMsgId: body.clientMsgId,
    });
    await mockMessageRepo.updateState(failed.id, "failed");
    return NextResponse.json({ ok: false, failed: true, message: failed }, { status: 503 });
  }

  const message = await mockMessageRepo.create({
    conversationId: convId,
    senderId: identity.id,
    body: text,
    clientMsgId: body.clientMsgId,
  });
  // T3 — push to every connected participant in this conversation.
  broadcastMessage(convId, message);
  await mockConversationRepo.updateLastMessageAt(convId, message.createdAt);
  await mockConversationRepo.touchLastSeen(convId, identity.id);
  await logAudit("message.sent", identity.id, { conversationId: convId, messageId: message.id });

  // Notify the OTHER participant (VS6.19): in-app only, generic body, no leak.
  const otherId = conv.participantIds.find((p) => p !== identity.id);
  if (otherId) {
    const { mockNotificationRepo } = await import("@voeq/data");
    const { mockIdentityRepo } = await import("@voeq/data");
    const other = await mockIdentityRepo.getById(otherId);
    const notification = await mockNotificationRepo.create({
      recipientId: otherId,
      type: "new_message",
      title: `New message from ${other?.name ?? "Someone"}`,
      body: "Tap to view",
      refId: convId,
    });
    // T4 — push to the recipient's user stream if connected.
    pushNotification(notification);
  }

  return NextResponse.json({ ok: true, message }, { status: 200 });
}
