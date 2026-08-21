import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { mockAuthRepo, mockVendorRepo, mockListingsRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.4 — First listing creation (Phase B, step 2 of 2).
 * Creates a listing under the vendor linked to this identity.
 */
const schema = z.object({
  title: z.string().trim().min(3, "Title is required."),
  priceMinMinor: z.number().int().nonnegative("Price must be ≥ 0."),
  priceMaxMinor: z.number().int().nonnegative().nullable().optional(),
  categoryId: z.string().min(1, "Category is required."),
  description: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "No vendor account." }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { title, priceMinMinor, priceMaxMinor, categoryId, description, images } = parsed.data;

  const listing = await mockListingsRepo.create({
    vendorId: identity.vendorId,
    title,
    priceMinMinor,
    priceMaxMinor: priceMaxMinor ?? null,
    categoryId,
    description: description ?? null,
    images: images ?? [],
  });

  return NextResponse.json({ ok: true, listingId: listing.id });
}
