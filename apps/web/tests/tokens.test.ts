import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, DEFAULT_ENVIRONMENT, ROLE_TOKENS } from "@voeq/design-tokens";
import { resolveContourData } from "@voeq/contour";

describe("@voeq/design-tokens metadata", () => {
  it("exposes both environments and defaults to cream", () => {
    expect(ENVIRONMENTS).toContain("cream");
    expect(ENVIRONMENTS).toContain("deep");
    expect(DEFAULT_ENVIRONMENT).toBe("cream");
  });

  it("declares color role tokens (consumed via CSS vars, not hardcoded)", () => {
    expect(ROLE_TOKENS.color).toContain("accent");
    expect(ROLE_TOKENS.color).toContain("gold");
  });
});

describe("@voeq/contour data-gating (B.12 / A.12)", () => {
  it("returns EMPTY by default — no invented activity", () => {
    expect(resolveContourData()).toEqual([]);
  });

  it("renders only what real data provides", () => {
    const seeded = resolveContourData([{ id: "a", intensity: 0.5 }]);
    expect(seeded).toHaveLength(1);
  });
});
