import { NextRequest, NextResponse } from "next/server";
import { mockCampusRepo } from "@voeq/data";
import { getCurrentIdentity } from "@/lib/session";

/**
 * POST /api/campuses — user-submitted campus creation.
 *
 * Guardrails (per approved plan):
 *  - Auth required (any logged-in user).
 *  - Duplicate-name check: case-insensitive trimmed substring match against existing
 *    campuses (verified + the creator's own unverified). Returns a "did you mean" hint.
 *  - Per-user daily cap (default 5) — basic abuse protection independent of dup check.
 *  - New campus is always `source: 'user-added'`, `status: 'unverified'`, owned by creator.
 *  - Graceful 429 (with resetAt) when over cap; 409-style 200 with `suggested` on dup.
 */
const DAILY_CAP = Number(process.env.VOEQ_CAMPUS_SUBMISSION_CAP ?? 5);

export async function POST(req: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { name?: string; lat?: number; lng?: number; city?: string; state?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  // 1. Per-user daily cap -------------------------------------------------------
  // Count the creator's own user-added campuses from the repo list (no raw SQL).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const existingAll = await mockCampusRepo.list(identity.id);
  const recentCount = existingAll.filter((c) => c.source === "user-added" && c.createdAt >= since).length;
  if (recentCount >= DAILY_CAP) {
    const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return NextResponse.json(
      { error: "submission_cap_exceeded", resetAt, message: `You can add up to ${DAILY_CAP} campuses per day.` },
      { status: 429 },
    );
  }

  // 2. Duplicate-name check (server-enforced) -----------------------------------
  const norm = name.toLowerCase();
  const existing = await mockCampusRepo.list(identity.id);
  const match = existing.find(
    (c) => c.name.toLowerCase().includes(norm) || norm.includes(c.name.toLowerCase()),
  );
  if (match) {
    return NextResponse.json(
      { error: "similar_campus_exists", suggested: match, message: `Did you mean ${match.name}?` },
      { status: 409 },
    );
  }

  // 3. Create ----------------------------------------------------------------
  const created = await mockCampusRepo.create(
    {
      name,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      city: body.city ?? null,
      state: body.state ?? null,
    },
    identity.id,
  );
  return NextResponse.json({ ok: true, campus: created }, { status: 201 });
}
