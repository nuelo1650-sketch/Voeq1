"use client";

import { useEffect, useState } from "react";
import { Grid, Column, Stack, Type } from "@voeq/ui";
import { ContourEdge, ActivityNode } from "@voeq/contour";
import type { ActivityNodeData } from "@voeq/contour";
import type { ActivityEvent } from "@voeq/data";
import { getActivityEvents, DEV_SEED_FLAG } from "../../lib/activitySource";

/**
 * ContourSignature — Landing's strongest contour expression (Doc 05 A.3 / Doc 07 §7.6).
 *
 * RULE (founder Option A): the contour COMMUNICATES activity, it does not MANUFACTURE it.
 *  - No activity -> ZERO nodes, a neutral "contour-empty" state. Page is NOT "alive".
 *  - Dev-only deterministic seed (?seed=1 in non-prod) -> meaningful nodes with campusZone.
 *
 * Each node pulses ONCE then rests (D.5); reduced-motion -> static (global rule).
 * No fake geography: campusZone is a neutral key, never drawn as a place.
 */
const TYPE_INTENSITY: Record<string, number> = {
  "new-listing": 0.7,
  "vendor-open": 0.5,
  "trending": 0.9,
};

export function ContourSignature() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isDevSeed, setIsDevSeed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get(DEV_SEED_FLAG);
    const isDev = process.env.NODE_ENV !== "production";
    const data = getActivityEvents(isDev, seed);
    setEvents(data);
    setIsDevSeed(isDev && seed === "1");
  }, []);

  const nodes: ActivityNodeData[] = events.map((e) => ({
    id: e.id,
    intensity: TYPE_INTENSITY[e.type] ?? 0.5,
    label: `${e.type} · ${e.campusZone} · ${e.refId}`,
  }));

  return (
    <Grid>
      <Column span={12}>
        <Stack space={2}>
          <ContourEdge />
          {nodes.length === 0 ? (
            <Type data-testid="contour-empty" tone="muted" size="sm">
              No live activity right now — the marketplace is quiet.
            </Type>
          ) : (
            <Stack space={1} style={{ flexDirection: "row", gap: "var(--space-1)" }}>
              {isDevSeed && (
                <Type data-testid="dev-seed-banner" tone="gold" size="sm">
                  DEV FIXTURE SEED — not production data
                </Type>
              )}
              {nodes.map((n) => (
                <ActivityNode key={n.id} data={n} data-testid="activity-node" />
              ))}
            </Stack>
          )}
          <ContourEdge />
        </Stack>
      </Column>
    </Grid>
  );
}
