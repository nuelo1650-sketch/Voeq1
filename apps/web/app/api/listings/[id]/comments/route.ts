import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockCommentRepo, mockListingsRepo, mockVendorRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/listings/[id]/comments — PUBLIC read (Doc 03 §3.9: public-read,
 * auth-to-act). Flat comments, newest first, hidden ones excluded. Author
 * display name resolved server-side (no raw identityId leaked to the client).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const comments = await mockCommentRepo.listByListing(id);
  // Resolve viewer so the client knows which comments are the author's own
  // (isMine flag — no raw authorId leaked, but edit/delete UI can render).
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const viewer = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;
  // Batch-resolve author names in ONE query (avoid N+1 per comment).
  const authorIds = Array.from(new Set(comments.map((c) => c.authorId)));
  const authors = authorIds.length
    ? await Promise.all(authorIds.map((aid) => mockAuthRepo.getIdentityById?.(aid)))
    : [];
  const nameById = new Map<string, string>();
  authors.forEach((a) => { if (a) nameById.set(a.id, a.name); });
  const withNames = comments.map((c) => ({
    // P-A round 22 (DATA FIX): pick PUBLIC fields only — previously `...c`
    // shipped authorId/listingId/status to the client, contradicting the
    // Omit<Comment,...> contract and leaking raw identity ids.
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    authorName: nameById.get(c.authorId) ?? "Shopper",
    isMine: viewer ? viewer.id === c.authorId : false,
  }));
  return NextResponse.json({ comments: withNames });
}

/**
 * POST /api/listings/[id]/comments — auth required. Flat (no threading).
 * Body 2-1000 chars.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const listing = await mockListingsRepo.getById(id);
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (text.length < 2 || text.length > 1000) {
    return NextResponse.json({ error: "body must be 2-1000 characters" }, { status: 400 });
  }

  const comment = await mockCommentRepo.create({ listingId: id, authorId: identity.id, body: text });
  // P-A round 39 (notifications): notify the LISTING OWNER (vendor) of a new
  // comment — in-app only, first name in copy, no PII leak. Resolve the owner
  // through the vendor linked to this listing.
  const ownerVendor = await mockVendorRepo.getById(listing.vendorId);
  if (ownerVendor?.identityId && ownerVendor.identityId !== identity.id) {
    const { mockNotificationRepo } = await import("@voeq/data");
    const first = (identity.name?.trim() ?? "Someone").split(/\s+/)[0]?.slice(0, 24) || "Someone";
    await mockNotificationRepo.create({
      recipientId: ownerVendor.identityId,
      type: "system",
      title: `${first} commented on ${listing.title}`,
      body: text.slice(0, 120),
      refId: id,
    });
  }
  return NextResponse.json({ ok: true, comment });
}
