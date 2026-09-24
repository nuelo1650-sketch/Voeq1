import { NextResponse } from "next/server";
import { mockAreasRepo } from "@voeq/data";

/** GET /api/areas — public areas taxonomy (for off-campus vendor onboarding). */
export async function GET() {
  try {
    const areas = await mockAreasRepo.list();
    return NextResponse.json({ ok: true, areas }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load areas" }, { status: 500 });
  }
}
