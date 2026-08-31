"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExploreParams, ExploreResult, ExploreStatus } from "@voeq/data";

/**
 * useExploreData — drives the Explore data boundary (Doc 04 PG-PUB-002 states).
 *
 * P-A fix (2026-08-31): fetches /api/explore (SERVER route) instead of importing
 * loadExplore from @voeq/data directly. The old client-side import evaluated
 *   USE_REAL = !!process.env.DATABASE_URL
 * as FALSE in the browser bundle (server-only secret) -> Explore always rendered
 * MOCK demo vendors. Now the server route reads REAL Neon data and the mock repos
 * are entirely absent from the client bundle.
 *
 * Exposes {status, data, trending, error, cached, retry}. Retry re-runs the same load.
 * Never fakes a success state: on failure status is "error" and cached last-good (if any)
 * is retained so partial recovery can render (Doc 04 error/recovery rule).
 */
export interface UseExploreData {
  status: ExploreStatus;
  data: ExploreResult["data"];
  trending: ExploreResult["trending"];
  error?: string;
  cached?: ExploreResult["data"];
  retry: () => void;
}

export function useExploreData(params: ExploreParams): UseExploreData {
  const [state, setState] = useState<ExploreResult>({
    status: "loading",
    data: [],
    trending: [],
  });
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  const qs = (p: ExploreParams): string => {
    const q = new URLSearchParams();
    if (p.campus) q.set("campus", p.campus);
    if (p.query) q.set("query", p.query);
    if (p.categoryPreset) q.set("categoryPreset", p.categoryPreset);
    if (p.category) q.set("category", p.category);
    if (p.sort) q.set("sort", p.sort);
    if (p.minPrice != null) q.set("minPrice", String(p.minPrice));
    if (p.maxPrice != null) q.set("maxPrice", String(p.maxPrice));
    if (p.minRating != null) q.set("minRating", String(p.minRating));
    if (p.verifiedOnly) q.set("verifiedOnly", "true");
    if (p.featuredOnly) q.set("featuredOnly", "true");
    if (p.openNow) q.set("openNow", "true");
    if (p.hasPhotos) q.set("hasPhotos", "true");
    if (p.recentlyActive) q.set("recentlyActive", "true");
    if (p.forceError) q.set("exploreError", "1");
    return q.toString();
  };

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    fetch(`/api/explore?${qs(params)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Explore request failed (${r.status})`);
        return r.json() as Promise<ExploreResult>;
      })
      .then((res) => {
        if (cancelled) return;
        setState((prev) => ({ ...res, cached: res.data.length ? res.data : prev.cached }));
      })
      .catch((e) => {
        if (cancelled) return;
        setState((prev) => ({
          status: "error",
          data: [],
          trending: [],
          error: e instanceof Error ? e.message : "Unknown error",
          cached: prev.cached,
        }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params), nonce]);

  return {
    status: state.status,
    data: state.data,
    trending: state.trending,
    error: state.error,
    cached: state.cached,
    retry,
  };
}
