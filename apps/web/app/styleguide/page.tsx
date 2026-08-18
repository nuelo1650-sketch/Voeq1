"use client";

import { useState, useEffect } from "react";
import { Grid, Column, Stack, Surface, Type, Button } from "@voeq/ui";
import { ContourEdge, CampusFingerprint, useContourData } from "@voeq/contour";
import { setEnvironment, type VoeqEnvironment } from "@voeq/design-tokens";

/**
 * Styleguide — FOUNDATION VERIFICATION ARTIFACT (Doc 06 §2 gate).
 * It demonstrates the system: type roles, token roles, spacing, grid, controls,
 * states, environment flip, and contour primitives in their LEGITIMATE (data-gated)
 * states. It is deliberately NOT a product mockup (no landing/storefront).
 * Kept as a dev/QA artifact (founder decision, Slice 1).
 */
export default function Styleguide() {
  const [env, setEnv] = useState<VoeqEnvironment>("cream");
  const contour = useContourData(); // empty by default → no invented activity

  // Styleguide demos Cream by default; the app root is Deep (Landing). Correct on mount.
  useEffect(() => {
    setEnvironment("cream");
  }, []);

  function flip(next: VoeqEnvironment) {
    setEnv(next);
    setEnvironment(next);
  }

  return (
    <main style={{ paddingBlock: "var(--space-5)" }}>
      <Grid>
        <Column span={12}>
          <Stack space={2}>
            <Type tone="display" size="display">
              Voeq Foundation
            </Type>
            <Type tone="muted">
              Slice 0 styleguide — system demonstration only, not a product surface.
            </Type>
            <ContourEdge />
          </Stack>
        </Column>

        <Column span={12}>
          <Stack space={2} style={{ flexDirection: "row", gap: "var(--space-2)" }}>
            <Button
              variant={env === "cream" ? "primary" : "ghost"}
              onClick={() => flip("cream")}
            >
              Cream (default)
            </Button>
            <Button
              variant={env === "deep" ? "primary" : "ghost"}
              onClick={() => flip("deep")}
            >
              Deep
            </Button>
            <Type tone="muted" style={{ alignSelf: "center" }}>
              active: {env}
            </Type>
          </Stack>
        </Column>

        <Column span={6}>
          <Surface>
            <Stack space={2}>
              <Type tone="accent">Type roles</Type>
              <Type size="display" tone="display">Display Aa</Type>
              <Type size="xl">Heading xl</Type>
              <Type size="lg">Heading lg</Type>
              <Type>Body md</Type>
              <Type tone="muted">Muted md</Type>
              <Type tone="gold">Gold accent</Type>
              <Type tone="danger">Danger</Type>
            </Stack>
          </Surface>
        </Column>

        <Column span={6}>
          <Surface sunken>
            <Stack space={2}>
              <Type tone="accent">Spacing scale (8pt)</Type>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span
                    style={{
                      width: `var(--space-${n})`,
                      height: 12,
                      background: "var(--role-accent)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Type tone="muted">space-{n}</Type>
                </div>
              ))}
            </Stack>
          </Surface>
        </Column>

        <Column span={12}>
          <Surface>
            <Stack space={2}>
              <Type tone="accent">12-column grid</Type>
              <Grid>
                {Array.from({ length: 12 }).map((_, i) => (
                  <Column key={i} span={1}>
                    <div
                      style={{
                        background: "var(--role-surface-sunken)",
                        border: "1px solid var(--role-border)",
                        borderRadius: "var(--radius)",
                        textAlign: "center",
                        padding: "var(--space-1)",
                      }}
                    >
                      <Type tone="muted">{i + 1}</Type>
                    </div>
                  </Column>
                ))}
              </Grid>
            </Stack>
          </Surface>
        </Column>

        <Column span={6}>
          <Surface>
            <Stack space={2}>
              <Type tone="accent">Controls &amp; states</Type>
              <Button>Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <input
                aria-label="sample input"
                placeholder="sample input"
                style={{
                  fontFamily: "var(--role-font-ui)",
                  padding: "var(--space-1)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--role-border)",
                  background: "var(--role-bg)",
                  color: "var(--role-text)",
                }}
              />
              <Type tone="muted">Focus any control → 2px accent-strong ring (B.8)</Type>
            </Stack>
          </Surface>
        </Column>

        <Column span={6}>
          <Surface>
            <Stack space={2}>
              <Type tone="accent">Contour primitives (data-gated)</Type>
              <Type tone="muted">
                With no real activity, primitives render neutral / empty — no invented geography.
              </Type>
              <CampusFingerprint />
              <div style={{ display: "flex", gap: "var(--space-1)" }}>
                {contour.length === 0 ? (
                  <Type tone="muted">ActivityNode: empty (correct)</Type>
                ) : null}
              </div>
            </Stack>
          </Surface>
        </Column>
      </Grid>
    </main>
  );
}
