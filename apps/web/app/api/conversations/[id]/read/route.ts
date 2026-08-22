import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockConversationRepo, mockMessageRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS6.9 — Mark a conversation read for the current participant. Participant-only.
 * Server-authoritative read state (Doc 09 §9.10). Updates lastSeen.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: convId } = await params;
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conv = await mockConversationRepo.getById(convId);
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!conv.participantIds.includes(identity.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await mockMessageRepo.markRead(convId, identity.id);
  await mockConversationRepo.touchLastSeen(convId, identity.id);
  return NextResponse.json({ ok: true });
}
