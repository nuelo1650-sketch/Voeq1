"use client";

import { useEffect, useState } from "react";
import { Grid, Column, Stack, Type } from "@voeq/ui";
import { ContourEdge, ActivityNode, CampusFingerprint } from "@voeq/contour";
import type { ActivityNodeData } from "@voeq/contour";
import type { ActivityEvent } from "@voeq/data";
import { getActivityEvents, DEV_SEED_FLAG } from "../../lib/activitySource";

/**
 * ContourSignature — Landing's STRONGEST contour expression (Doc 05 A.3 / Doc 07 §7.6).
 *
 * RULE (founder Option A): the contour COMMUNICATES activity, it does not MANUFACTURE it.
 *  - No activity -> ZERO nodes, neutral "contour-empty" state. Page is NOT "alive".
 *  - Dev-only deterministic seed (?seed=1 in non-prod) -> meaningful nodes with campusZone.
 *
 * Task B Part 2 richness:
 *  - Each node pulses ONCE then rests (D.5); reduced-motion -> static (global rule).
 *  - Nodes are laid out to EXPRESS DENSITY (B.11): higher-intensity events sit nearer the
 *    center and render larger; positions are deterministic (id-hash) and ABSTRACT — never
 *    drawn as real geography. A cluster of nodes = campus density.
 *  - CampusFingerprint (B.11) is wired in: it renders a neutral placeholder when empty and
 *    a real-activity shape when nodes exist (fed the node intensities).
 * No fake geography: campusZone remains a neutral key.
 */
const TYPE_INTENSITY: Record<string, number> = {
  "new-listing": 0.7,
  "vendor-open": 0.5,
  "trending": 0.9,
};

// Deterministic 0..1 hash from id so layout is stable, not flickering random.
function hash01(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

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

  const FIELD = 220; // px, abstract contour field (not a map)
  const CENTER = FIELD / 2;

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
            <Stack space={1}>
              {isDevSeed && (
                <Type data-testid="dev-seed-banner" tone="gold" size="sm">
                  DEV FIXTURE SEED — not production data
                </Type>
              )}
              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                {/* Density field: nodes positioned by intensity (abstract, not geographic). */}
                <div
                  data-testid="contour-field"
                  style={{
                    position: "relative",
                    width: FIELD,
                    height: FIELD,
                    maxWidth: "100%",
                  }}
                >
                  {nodes.map((n) => {
                    const r = 0.25 + (1 - n.intensity) * 0.6; // higher intensity -> nearer center
                    const angle = hash01(n.id) * Math.PI * 2;
                    const x = CENTER + Math.cos(angle) * CENTER * r - 4;
                    const y = CENTER + Math.sin(angle) * CENTER * r - 4;
                    return (
                      <ActivityNode
                        key={n.id}
                        data={n}
                        data-testid="activity-node"
                        style={{
                          position: "absolute",
                          left: `${x}px`,
                          top: `${y}px`,
                          width: 6 + n.intensity * 8,
                          height: 6 + n.intensity * 8,
                        }}
                      />
                    );
                  })}
                </div>
                {/* CampusFingerprint (B.11) — neutral placeholder when empty, activity shape when present. */}
                <CampusFingerprint
                  data-testid="campus-fingerprint"
                  activity={nodes.map((n) => n.intensity)}
                />
              </div>
            </Stack>
          )}
          <ContourEdge />
        </Stack>
      </Column>
    </Grid>
  );
}
