import { NextRequest, NextResponse } from "next/server";
import { mockCommentRepo, logAudit, notifyContentAction } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * Staff batch 2 — Comment moderation. requireCapability('review.moderate')
 * (same capability the review queue uses; moderators hold it).
 * hide -> status='hidden' (author notified with reason); show -> 'published'.
 * Hide requires a reason >=10 chars — the author deserves to know why their
 * comment disappeared (same integrity rule as the enforcement ladder). Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("review.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { commentId?: string; action?: "hide" | "show"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const commentId = typeof body.commentId === "string" ? body.commentId.trim() : "";
  const action = body.action;
  if (!commentId || (action !== "hide" && action !== "show")) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (action === "hide" && reason.length < 10) {
    return NextResponse.json({ error: "reason_required", detail: "Hide requires a reason of at least 10 characters." }, { status: 400 });
  }

  const comment = await mockCommentRepo.getById(commentId);
  if (!comment) return NextResponse.json({ error: "comment_not_found" }, { status: 404 });

  const patched = await mockCommentRepo.setStatus(comment.id, action === "hide" ? "hidden" : "published");
  if (!patched) return NextResponse.json({ error: "update_failed" }, { status: 500 });

  await logAudit("comment.moderate", actor.id, { commentId, action, reason: reason || undefined, adminAction: true });
  if (action === "hide") {
    await notifyContentAction({
      recipientId: comment.authorId,
      title: "Your comment was hidden by the moderation team",
      reason: reason || undefined,
      refId: comment.listingId,
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, status: patched.status }, { status: 200 });
}
