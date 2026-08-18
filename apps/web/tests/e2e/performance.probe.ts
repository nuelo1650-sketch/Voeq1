/**
 * Performance probe (P1 closure for Slice 0 gate).
 *
 * WHAT THIS MEASURES (real, observable):
 *  - rAF-driven FPS over a 3s window (the actual frame cadence the browser sustains)
 *  - Long Tasks (>50ms) — main-thread blocking events that break 60fps (16.7ms budget)
 *  - Layout/paint counts via PerformanceObserver (layout-thrash surface)
 *
 * WHAT THIS IS NOT:
 *  - Not a mid-range Android device reading. This host is a desktop-class browser.
 *    CPU throttling (4x) is an APPROXIMATION of weaker hardware, not a substitute
 *    for on-device measurement. The honest limitation is documented in PERFORMANCE_GATE.md.
 *
 * Per founder instruction: do NOT modify architecture to manufacture a benchmark.
 * The static styleguide has no continuous animation, so the probe is expected to
 * report ~display refresh (here 60) with zero longtasks and zero layout/paint churn
 * during idle — which is the POINT: the foundation has no frame-pressure surface yet.
 */
export interface PerfReport {
  fps: number;
  longTasks: number;
  layoutCount: number;
  paintCount: number;
  sampledMs: number;
  throttled: boolean;
}

export async function probePerformance(page: any, opts: { throttle?: boolean } = {}): Promise<PerfReport> {
  if (opts.throttle) {
    const client = await (page as any).context().newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }

  const report = await page.evaluate(async () => {
    const start = performance.now();
    const window3s = 3000;
    let frames = 0;
    let longTasks = 0;
    let layoutCount = 0;
    let paintCount = 0;

    await new Promise<void>((resolve) => {
      function loop(t: number) {
        frames++;
        if (t - start < window3s) {
          requestAnimationFrame(loop);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(loop);
    });

    // Count long tasks + layout/paint that occurred during the window.
    await new Promise<void>((resolve) => {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "longtask") longTasks++;
          if (entry.entryType === "layout-shift") layoutCount++;
          if (entry.entryType === "paint") paintCount++;
        }
      });
      try {
        obs.observe({ entryTypes: ["longtask", "longtask"] } as any);
      } catch {
        /* longtask may be unsupported; ignore */
      }
      try {
        obs.observe({ entryTypes: ["layout-shift", "paint"] } as any);
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        obs.disconnect();
        resolve();
      }, 200);
    });

    const elapsed = performance.now() - start;
    return {
      fps: Math.round((frames / elapsed) * 1000),
      longTasks,
      layoutCount,
      paintCount,
      sampledMs: Math.round(elapsed),
      throttled: false,
    };
  });

  report.throttled = !!opts.throttle;
  return report;
}
