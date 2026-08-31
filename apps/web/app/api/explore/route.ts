import { NextRequest, NextResponse } from "next/server";
import { loadExplore, type ExploreParams } from "@voeq/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/explore
 *
 * P-A fix (2026-08-31): the Explore page previously imported loadExplore DIRECTLY
 * into the browser bundle (@voeq/data). Inside that bundle,
 *   const USE_REAL = !!process.env.DATABASE_URL;
 * evaluated to FALSE (DATABASE_URL is a server-only secret; Vercel does not inline
 * non-NEXT_PUBLIC vars into client JS) -> the client always rendered the MOCK demo
 * vendors even after the DB wipe, while storefront/API routes read the real (empty)
 * DB. Symptom: demo vendors forever, 404 storefront, grid looked like the old build.
 *
 * This route runs SERVER-SIDE where DATABASE_URL exists (USE_REAL true), so it
 * returns REAL Neon data only. The client now fetches it — mock repos are gone
 * from the browser bundle entirely.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const params: ExploreParams = {
    campus: sp.get("campus") ?? undefined,
    query: sp.get("query") ?? undefined,
    categoryPreset: sp.get("categoryPreset") ?? undefined,
    category: sp.get("category") ?? undefined,
    sort: (sp.get("sort") as ExploreParams["sort"]) ?? undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    minRating: sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
    verifiedOnly: sp.get("verifiedOnly") === "true",
    featuredOnly: sp.get("featuredOnly") === "true",
    openNow: sp.get("openNow") === "true",
    hasPhotos: sp.get("hasPhotos") === "true",
    recentlyActive: sp.get("recentlyActive") === "true",
    forceError: sp.get("exploreError") === "1",
  };

  try {
    const result = await loadExplore(params);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Explore failed" },
      { status: 500 },
    );
  }
}
