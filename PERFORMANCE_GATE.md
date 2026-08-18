# Performance Gate — Voeq Slice 0 → Slice 1

**Status:** Slice 0 verification CONDITIONAL PASS → resolved by this document + `tests/e2e/performance.spec.ts`.
**Owner:** Hermes · **Reviewed:** 2026-08-18 (founder sign-off on P1).

---

## 1. The verification gap P1 closed

Slice 0's Playwright suite proved: mobile + desktop render, no infinite animation,
reduced-motion honored, contour data-gated. That is **absence-of-bad-pattern** evidence.
It did **not** establish the blueprint's 60fps-on-mid-range-Android budget — a
**presence-of-budget** claim. Those are different. P1 required one of:

1. Demonstrate the budget on the intended device class, **or**
2. Document why the static foundation has no measurable frame-pressure surface yet,
   and establish the exact gate Slice 1 must satisfy.

We did **(2)**. We did not modify architecture to manufacture a benchmark.

---

## 2. What the probe actually measured (real output, 2026-08-18)

| Condition | FPS (rAF) | Long tasks (>50ms) | Layout | Paint | Window |
|---|---|---|---|---|---|
| Normal | 57 | 0 | 0 | 0 | 3203 ms |
| 4× CPU throttle | 47 | 0 | 0 | 0 | 3780 ms |

Tool: `tests/e2e/performance.probe.ts` — rAF frame counter + PerformanceObserver
(longtask / layout-shift / paint), run via Playwright Chromium on this host
(desktop-class browser, not a device).

**Interpretation:** zero long tasks and zero layout/paint churn in both conditions.
The foundation performs **no per-frame work** — there is no continuous animation, no
scroll-linked JS, no layout thrash. The FPS delta (57 → 47) under 4× throttle is the
rAF sampling cadence yielding to the throttled event loop, **not** frame pressure
(a static page does no work per frame to "miss"). So:

> The Slice 0 foundation has **no frame-pressure surface**. The budget is *vacuously*
> satisfied because there is nothing to budget against yet.

---

## 3. Honest limitation (NOT swept under the rug)

- **This is not a mid-range Android reading.** The probe runs on a desktop browser.
  CPU throttling (4×) is a *rough approximation* of weaker hardware, not a real device.
- A static page with no animation has nothing for FPS to measure meaningfully. Reporting
  "57 fps" as a *performance achievement* would be a lie — it is idle.
- **Therefore the 60fps-on-mid-range-Android budget is NOT yet proven.** It becomes
  provable only when Slice 1 introduces the real pressure surface: scroll, contour
  activity rendering, image-heavy storefront content.

---

## 4. Exact Slice 1 performance gate (what "proven" means)

Slice 1 (Landing — Deep) introduces the first real pressure surface. Before Slice 1 is
marked verification-PASS, the following MUST hold, measured on the **throttled** profile
(4× CPU, `Emulation.setCPUThrottlingRate`) **and** reported for a real mid-range Android
device when available:

| Metric | Gate | Rationale |
|---|---|---|
| Long tasks | **0** during landing scroll + contour render | Main-thread blocking breaks 60fps |
| Layout shifts (CLS) | **< 0.1** on load + scroll | Doc 10 a11y/visual stability |
| Sustained FPS | **≥ 50** during 10s scroll w/ contour activity | 60fps target, 50 floor for mid-range |
| First Contentful Paint | **< 1.5s** (throttled) | Perceived latency on weak hardware |
| Reflow/paint churn | no layout thrash on scroll (no per-frame `getBoundingClientRect` in hot loop) | Prevents jank |

**Measurement rule:** the perf probe is extended in Slice 1 to (a) drive a real scroll
loop with contour activity enabled, (b) sample FPS + longtasks over 10s, (c) assert the
table above. The mid-range-Android row is filled from a real device (or explicitly marked
UNMEASURED with the throttle approximation noted) — never fabricated.

**Non-goals for Slice 1 perf:** we do NOT optimize a static page; we ONLY assert that the
*introduced* pressure surface stays within budget. If Slice 1 has no animated contour on
the landing (it may be a static hero), the gate reduces to FCP + CLS + zero longtasks,
and the FPS gate activates at the slice where continuous contour activity first renders
(Slice 4 / storefront).

---

## 5. Where this lives in the repo

- `apps/web/tests/e2e/performance.probe.ts` — reusable probe (rAF + observers + throttle).
- `apps/web/tests/e2e/performance.spec.ts` — Slice 0 assertions (zero longtask/layout/paint).
- This file — the gate contract for Slice 0→1.
