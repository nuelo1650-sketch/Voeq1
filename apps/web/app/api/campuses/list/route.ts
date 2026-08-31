import { NextRequest, NextResponse } from "next/server";
import { mockCampusRepo } from "@voeq/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/campuses/list
 *
 * P-A fix (2026-08-31): CampusSelector + SearchBar previously imported
 * mockCampusRepo directly into the browser bundle. Its USE_REAL gate
 * (!!process.env.DATABASE_URL) evaluates FALSE in the browser -> client showed
 * mock campus fixtures even though the DB had the real 36-campus catalog.
 * This route runs SERVER-SIDE (USE_REAL true) and returns REAL Neon campuses.
 */
export async function GET(req: NextRequest) {
  try {
    const rows = await mockCampusRepo.list(undefined);
    return NextResponse.json({ campuses: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Campuses failed" },
      { status: 500 },
    );
  }
}
