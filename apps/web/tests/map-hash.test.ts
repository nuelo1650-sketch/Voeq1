import { describe, it, expect } from "vitest";
import { hashToOffset } from "@/lib/map/hashToOffset";

describe("hashToOffset", () => {
  it("is deterministic — same id → same offset", () => {
    expect(hashToOffset("listing-abc-123")).toEqual(hashToOffset("listing-abc-123"));
  });

  it("produces different offsets for different ids", () => {
    const a = hashToOffset("listing-1");
    const b = hashToOffset("listing-2");
    expect(a).not.toEqual(b);
  });

  it("stays within ±0.01° (~1km)", () => {
    for (let i = 0; i < 100; i++) {
      const [lat, lng] = hashToOffset(`test-${i}`);
      expect(Math.abs(lat)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(lng)).toBeLessThanOrEqual(0.01);
    }
  });

  it("has no collisions among the first 100 ids", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const key = JSON.stringify(hashToOffset(`listing-${i}`));
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
