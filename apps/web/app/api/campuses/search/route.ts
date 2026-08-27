import { NextRequest, NextResponse } from "next/server";
import { acquireNominatimSlot } from "@voeq/db";
import { getCurrentIdentity } from "@/lib/session";

/**
 * GET /api/campuses/search?q=... — debounced-by-client, throttled-by-server campus
 * autocomplete backed by OpenStreetMap Nominatim.
 *
 * Throttling: all users funnel through a single shared DB-backed 1 req/sec slot
 * (acquireNominatimSlot). This protects OSM's usage policy regardless of how many
 * concurrent users or server instances exist. See packages/db/src/repos.ts.
 *
 * URL is intentionally `format=json` (NOT `format=format=json` — that typo would 404).
 * User-Agent is required by Nominatim's policy.
 */
export async function GET(req: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] }, { status: 200 });

  const claimed = await acquireNominatimSlot(`campus-search:${identity.id}`);
  if (!claimed) {
    return NextResponse.json(
      { error: "nominatim_unavailable", message: "Search is busy — try again in a moment." },
      { status: 503 },
    );
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      `${q} Nigeria`,
    )}&format=json&limit=5`;
    const res = await fetch(url, {
      headers: {
        // Nominatim policy requires a descriptive User-Agent.
        "User-Agent": "Voeq/1.0 (campus lookup; +https://voeq.ng)",
        Accept: "application/json",
      },
      // Don't let a hung upstream block the request indefinitely.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "nominatim_error", message: "Search is busy — try again in a moment." },
        { status: 502 },
      );
    }
    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      name?: string;
    }>;
    const results = data.map((r) => ({
      name: r.name ?? r.display_name,
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
    return NextResponse.json({ results }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "nominatim_unavailable", message: "Search is busy — try again in a moment." },
      { status: 503 },
    );
  }
}
