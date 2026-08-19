"use client";

import { useCallback, useEffect, useState } from "react";
import { loadExplore, type ExploreParams, type ExploreResult, type ExploreStatus } from "@voeq/data";

/**
 * useExploreData — drives the Explore data boundary (Doc 04 PG-PUB-002 states).
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

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    loadExplore(params)
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
