import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, mockConversationRepo, mockMessageRepo, mockIdentityRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS6.5 — Find-or-create a conversation for a (shopper, vendor) pair.
 * Idempotent: the same shopper+vendor always returns the same conversation.
 * Auth required; the caller is the shopper (participantIds = [shopperId, vendor.identityId]).
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { vendorId?: string; listingId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const vendorId = typeof body.vendorId === "string" ? body.vendorId.trim() : "";
  if (!vendorId) return NextResponse.json({ error: "vendorId_required" }, { status: 400 });

  const vendor = await mockVendorRepo.getById(vendorId);
  if (!vendor || !vendor.identityId) {
    return NextResponse.json({ error: "vendor_not_found" }, { status: 404 });
  }
  // A shopper messaging their own vendor account is not possible (one Identity),
  // but guard against identity mismatch just in case.
  if (vendor.identityId === identity.id) {
    return NextResponse.json({ error: "cannot_message_self" }, { status: 400 });
  }

  const conversation = await mockConversationRepo.create({
    participantIds: [identity.id, vendor.identityId],
    listingId: body.listingId ?? null,
  });
  await logAudit("conversation.created", identity.id, { conversationId: conversation.id, vendorId });
  return NextResponse.json({ ok: true, conversation }, { status: 200 });
}

/** VS6.12 — List conversations for the current identity (newest first). */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conversations = await mockConversationRepo.listForIdentity(identity.id);
  const rows = await Promise.all(
    conversations.map(async (c) => {
      const otherId = c.participantIds.find((p) => p !== identity.id) ?? "";
      const other = otherId ? await mockIdentityRepo.getById(otherId) : null;
      const msgs = await mockMessageRepo.listByConversation(c.id, null, 1);
      const last = msgs[msgs.length - 1];
      return {
        id: c.id,
        name: other?.name ?? "Someone",
        lastMessagePreview: last?.body ?? "",
        lastMessageAt: c.lastMessageAt,
        unread: 0, // unread count derived client-side from notifications; list shows 0 placeholder
      };
    }),
  );
  return NextResponse.json({ ok: true, conversations: rows });
}
