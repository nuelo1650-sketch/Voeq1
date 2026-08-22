import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.3 — Set contact socials. Owner-only. Phone allowed; WhatsApp BANNED per
 * Doc 13 §13.13. Only phone/instagram/twitter/tiktok keys are accepted; any
 * other key (incl. "whatsapp") is silently dropped.
 */
const ALLOWED: (keyof NonNullable<import("@voeq/data").Vendor["socials"]>)[] = [
  "phone",
  "instagram",
  "twitter",
  "tiktok",
];

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const socials: Record<string, string | undefined> = {};
  for (const key of ALLOWED) {
    const v = (body as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim().length > 0) socials[key] = v.trim();
  }

  const vendor = await mockVendorRepo.patch(identity.vendorId, { socials } as never);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await logAudit("vendor.socials.update", identity.id, { keys: Object.keys(socials) });
  return NextResponse.json({ ok: true, socials: vendor.socials });
}
