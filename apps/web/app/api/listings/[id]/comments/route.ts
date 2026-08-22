import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockCommentRepo, mockListingsRepo } from "@voeq/data";
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
  const withNames = await Promise.all(
    comments.map(async (c) => {
      const author = await mockAuthRepo.getIdentityById?.(c.authorId);
      return { ...c, authorName: author?.name ?? "Shopper" };
    }),
  );
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
  return NextResponse.json({ ok: true, comment });
}
