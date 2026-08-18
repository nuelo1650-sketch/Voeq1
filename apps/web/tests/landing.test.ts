import { describe, expect, it } from "vitest";
import { resolveContourData } from "@voeq/contour";

/**
 * Slice 1 unit gates — contour communication, not manufacture.
 * Two states proven SEPARATELY (founder Option A):
 *  - empty repo  -> zero nodes (no invented activity, ever)
 *  - real-shaped -> meaningful node carrying intensity/label
 * The ActivityEvent -> ActivityNodeData mapping (with campusZone in label) is covered
 * by e2e using the dev seed fixture; here we lock the gate primitive's contract.
 */
describe("Slice 1 contour — communicates, does not manufacture", () => {
  it("empty activity -> zero nodes (production/mock default)", () => {
    const data = resolveContourData([]);
    expect(data).toHaveLength(0);
  });

  it("real-shaped node data -> node carries intensity + label", () => {
    const seeded = resolveContourData([
      { id: "evt-1", intensity: 0.6, label: "new-listing · campus:default · listing-7" },
    ]);
    expect(seeded).toHaveLength(1);
    expect(seeded[0].intensity).toBe(0.6);
    expect(seeded[0].label).toContain("campus:default");
  });

  it("never invents geography — label key is neutral, not a coordinate", () => {
    const seeded = resolveContourData([
      { id: "evt-2", intensity: 0.4, label: "vendor-open · campus:default · vendor-3" },
    ]);
    expect(seeded[0].label).not.toMatch(/map|geo|lat|lng|coord/i);
  });
});
