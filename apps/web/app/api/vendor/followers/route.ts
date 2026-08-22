import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mockAuthRepo, mockFollowRepo, mockIdentityRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.12 — List followers of THIS vendor (owner-only). Returns follower identity
 * summaries (name only — no PII leak, Doc 09 §9.16). Count derived from real records.
 */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity || !identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const follows = await mockFollowRepo.listByVendor(identity.vendorId);
  const followers = await Promise.all(
    follows.map(async (f) => {
      const id = await mockIdentityRepo.getById(f.followerId);
      return { id: f.followerId, name: id?.name ?? "Someone", followedAt: f.createdAt };
    }),
  );
  return NextResponse.json({ ok: true, followers, count: followers.length });
}
