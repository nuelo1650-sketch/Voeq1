import { useState } from "react";
import type { ActivityNodeData } from "./ActivityNode";

/**
 * Pure resolver for contour data-gating (B.12 / A.12). Returns REAL activity when
 * supplied; otherwise returns EMPTY so contour primitives render nothing meaningful.
 * Kept pure (no React) so the contract is unit-testable without a renderer. The
 * DEFAULT is empty — never a synthetic demo. Callers must pass real data.
 */
export function resolveContourData(seed?: ActivityNodeData[]): ActivityNodeData[] {
  return seed ?? [];
}

/**
 * React binding over resolveContourData. In Slice 4+ this is replaced by a real
 * repo call (packages/data). Slice 0 only defines the contract + the empty default.
 */
export function useContourData(seed?: ActivityNodeData[]): ActivityNodeData[] {
  const [data] = useState<ActivityNodeData[]>(() => resolveContourData(seed));
  return data;
}
