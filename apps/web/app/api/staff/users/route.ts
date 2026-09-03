import { NextRequest, NextResponse } from "next/server";
import {
  mockIdentityRepo,
  mockAuthEventStore,
  reinstateExpiredSuspensions,
  hasCapability,
  logAudit,
  type Identity,
} from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * Staff batch 1 / task 8 — user lookup for the enforcement panel.
 *
 *   GET /api/staff/users?q=<term>   → search by email/name substring (cap: audit.read)
 *   GET /api/staff/users?id=<uuid>  → one user's detail (cap: audit.read)
 *
 * Privacy: raw IPs in auth events are personal data — they are ONLY included
 * when the actor also holds `account.suspend` (admin+). Moderators see the
 * event kinds/timestamps without the IP column.
 *
 * Side effect (by design): every staff lookup runs the suspension-expiry
 * sweep first, so a term that ended shows as reactivated immediately — this
 * is the "no cron" auto-expiry trigger from the plan.
 */

/** Strip credential material + cap payload fields. Never return passwordHash. */
function toPublicUser(id: Identity) {
  return {
    id: id.id,
    email: id.email,
    name: id.name,
    role: id.role,
    staffRole: id.staffRole ?? null,
    intent: id.intent,
    accountStatus: id.accountStatus,
    emailVerified: id.emailVerified,
    campus: id.campus,
    vendorId: id.vendorId,
    suspensionExpiresAt: id.suspensionExpiresAt ?? null,
    warningCount: id.warningCount ?? 0,
    createdAt: id.createdAt,
  };
}

export async function GET(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("audit.read");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  // Lazy auto-expiry: suspended accounts whose term passed flip back to
  // active BEFORE we read, so the panel never shows a stale suspension.
  await reinstateExpiredSuspensions().catch(() => undefined);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const q = searchParams.get("q")?.trim().toLowerCase();

  // Raw-IP visibility is a separate, higher gate than the lookup itself.
  const maySeeRawIp = hasCapability(actor.staffRole, "account.suspend");

  if (id) {
    const target = await mockIdentityRepo.getById(id);
    if (!target) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const events = await mockAuthEventStore
      .queryBy({ identityId: id, limit: 50 })
      .catch(() => []);
    return NextResponse.json({
      ok: true,
      user: toPublicUser(target),
      events: events.map((e) => ({
        event: e.event,
        at: e.at,
        userAgent: e.userAgent,
        ip: maySeeRawIp ? e.ip : undefined,
      })),
    });
  }

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: false, error: "q_min_2" }, { status: 400 });
  }

  const all = await mockIdentityRepo.list();
  const users = all
    .filter((u) => u.accountStatus !== "deleted")
    .filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q),
    )
    .slice(0, 50);

  await logAudit("staff.user_search", actor.id, { q, hits: users.length });
  return NextResponse.json({ ok: true, users: users.map(toPublicUser) });
}
