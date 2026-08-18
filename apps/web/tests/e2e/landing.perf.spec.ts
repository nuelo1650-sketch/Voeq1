import { test, expect } from "@playwright/test";
import { probePerformance } from "./performance.probe";

/**
 * Slice 0 + Slice 1 performance gate.
 * Landing adds the arrival pulse (one-shot) + contour. Asserts no main-thread
 * blocking and no layout/paint churn during load+pulse, normal + 4x throttle.
 * (Per PERFORMANCE_GATE.md: FCP/sustained-FPS budgets are recorded at Slice 1 and
 * filled with real mid-Android numbers when a device is available; throttle is an
 * approximation, not proof.)
 */
test.describe("Performance budget — Landing (Slice 1)", () => {
  test("Landing load + arrival pulse: no long tasks / layout / paint (normal)", async ({ page }) => {
    await page.goto("/");
    const r = await probePerformance(page, { throttle: false });
    console.log(`[perf:landing-normal] fps=${r.fps} longTasks=${r.longTasks} layout=${r.layoutCount} paint=${r.paintCount} over ${r.sampledMs}ms`);
    expect(r.longTasks).toBe(0);
    expect(r.layoutCount).toBe(0);
    expect(r.paintCount).toBe(0);
  });

  test("Landing load + arrival pulse: no long tasks / layout / paint (4x throttle)", async ({ page }) => {
    await page.goto("/");
    const r = await probePerformance(page, { throttle: true });
    console.log(`[perf:landing-throttled-4x] fps=${r.fps} longTasks=${r.longTasks} layout=${r.layoutCount} paint=${r.paintCount} over ${r.sampledMs}ms`);
    expect(r.longTasks).toBe(0);
    expect(r.layoutCount).toBe(0);
    expect(r.paintCount).toBe(0);
  });
});
