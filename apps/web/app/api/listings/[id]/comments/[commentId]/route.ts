import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockCommentRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * PATCH /api/listings/[id]/comments/[commentId] — edit own comment body.
 * DELETE — delete own comment.
 * P-A round 22 (FEATURE): comments had GET+POST only — authors could NOT edit
 * or delete their comments (user-reported). Auth + author-only (the repo
 * update/remove is scoped to authorId, so a mismatch is a hard no-op).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId } = await params;
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const newBody = typeof body?.body === "string" ? body.body.trim() : "";
  if (!newBody) return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
  if (newBody.length > 1000) return NextResponse.json({ error: "Comment is too long (max 1000)." }, { status: 400 });

  const updated = await mockCommentRepo.update(commentId, identity.id, newBody);
  if (!updated) return NextResponse.json({ error: "Not found or not your comment." }, { status: 404 });

  return NextResponse.json({ ok: true, comment: { id: updated.id, body: updated.body, createdAt: updated.createdAt } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId } = await params;
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const removed = await mockCommentRepo.remove(commentId, identity.id);
  if (!removed) return NextResponse.json({ error: "Not found or not your comment." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
