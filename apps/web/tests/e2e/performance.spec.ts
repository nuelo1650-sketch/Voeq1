import { test, expect } from "@playwright/test";
import { probePerformance } from "./performance.probe";

/**
 * Slice 0 performance gate (P1 closure).
 * Asserts the foundation has NO frame-pressure surface: no long tasks, no layout/paint
 * churn during the sampling window, at both normal and 4x CPU-throttled (weaker-hardware
 * approximation). FPS is REPORTED, not asserted to 60 — we cannot guarantee display
 * refresh here, and a static page's idle FPS is not the budget we care about (that's
 * Slice 1's scroll/animation pressure). The real gate: zero longtasks + zero layout/paint.
 */
test.describe("Slice 0 performance budget", () => {
  test("no long tasks / layout / paint under normal load", async ({ page }) => {
    await page.goto("/styleguide");
    const r = await probePerformance(page, { throttle: false });
    console.log(`[perf:normal] fps=${r.fps} longTasks=${r.longTasks} layout=${r.layoutCount} paint=${r.paintCount} over ${r.sampledMs}ms`);
    expect(r.longTasks).toBe(0);
    expect(r.layoutCount).toBe(0);
    expect(r.paintCount).toBe(0);
  });

  test("no long tasks / layout / paint under 4x CPU throttle (weaker-hardware approximation)", async ({ page }) => {
    await page.goto("/styleguide");
    const r = await probePerformance(page, { throttle: true });
    console.log(`[perf:throttled-4x] fps=${r.fps} longTasks=${r.longTasks} layout=${r.layoutCount} paint=${r.paintCount} over ${r.sampledMs}ms`);
    expect(r.longTasks).toBe(0);
    expect(r.layoutCount).toBe(0);
    expect(r.paintCount).toBe(0);
  });
});
