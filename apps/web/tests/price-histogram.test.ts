import { describe, it, expect } from "vitest";

// Pure histogram builder (mirrors PriceRangeSlider's internal logic)
function buildHistogram(values: number[], min: number, max: number, buckets: number): number[] {
  if (!values.length) return Array(buckets).fill(0);
  const range = max - min || 1;
  const counts = Array(buckets).fill(0);
  for (const v of values) {
    const idx = Math.min(buckets - 1, Math.floor(((v - min) / range) * buckets));
    counts[idx]++;
  }
  return counts;
}

describe("buildHistogram", () => {
  it("returns empty histogram for no values", () => {
    expect(buildHistogram([], 0, 100, 12)).toEqual(Array(12).fill(0));
  });

  it("distributes values into correct buckets", () => {
    const prices = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const hist = buildHistogram(prices, 100, 1000, 10);
    expect(hist.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it("handles single value", () => {
    const hist = buildHistogram([500], 0, 1000, 12);
    expect(hist.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("clamps max value to last bucket", () => {
    const hist = buildHistogram([1000], 0, 1000, 10);
    expect(hist[9]).toBe(1);
    expect(hist.slice(0, 9).every((v) => v === 0)).toBe(true);
  });

  it("handles identical min/max (zero range)", () => {
    const hist = buildHistogram([500, 500, 500], 500, 500, 12);
    expect(hist.reduce((a, b) => a + b, 0)).toBe(3);
  });
});
