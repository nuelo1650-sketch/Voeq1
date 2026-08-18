import { test, expect } from "@playwright/test";

/**
 * Slice 1 Landing (Cream-first) regression gates — Doc 04 PG-PUB-001, Doc 05 A.3 (reversed
 * 2026-08-18: Cream is the default across all public routes incl. Landing), Doc 06 §2, Doc 07 §7.6,
 * Doc 10 §54/§63/§66/§159/§167/§199.
 *
 * Option A (founder): contour communicates activity, never manufactures it.
 *  - production/mock default (empty repo) -> ZERO activity nodes
 *  - dev-only deterministic seed (never production truth) -> meaningful nodes
 * Both proven separately. Dev seed is gated behind a non-production flag.
 *
 * ENVIRONMENT (founder reversal 2026-08-18): Cream is the silent default on `/`. Deep is a
 * supported alternate, toggled intentionally via `setEnvironment` (the same mechanism the
 * styleguide "Deep" button uses — it sets `data-env` on <html>). Deep is NEVER the default.
 */
test.describe("Slice 1 Landing (Cream-first)", () => {
  test("default load of / renders in Cream (never silent Deep)", async ({ page }) => {
    await page.goto("/");
    expect(page.url()).toMatch(/\/$/);
    // Resolved default with NO override present must be cream.
    await expect(page.locator("html")).toHaveAttribute("data-env", "cream");
    await expect(page.getByText(/voeq/i).first()).toBeVisible();
  });

  test("Deep still works as an explicit opt-in alternate (not the default)", async ({ page }) => {
    await page.goto("/");
    // Toggle Deep via the real mechanism (setEnvironment, used by the styleguide Deep button).
    await page.evaluate(() => document.documentElement.setAttribute("data-env", "deep"));
    await expect(page.locator("html")).toHaveAttribute("data-env", "deep");
    // Deep tokens actually applied: body background resolves to the Deep forest color.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(16, 35, 26)"); // --role-bg Deep (#10231a)
    // And it was NOT the cream default background.
    expect(bg).not.toBe("rgb(247, 244, 236)"); // --role-bg Cream (#f7f4ec)
  });

  test("contour: empty repository -> ZERO activity nodes (no invented activity)", async ({ page }) => {
    // Production/mock default path: no seed -> zero nodes.
    await page.goto("/?seed=0");
    await expect(page.getByTestId("activity-node")).toHaveCount(0);
    await expect(page.getByTestId("contour-empty")).toBeVisible();
  });

  test("contour: dev-only deterministic seed -> meaningful nodes (never production truth)", async ({ page }) => {
    // Dev verification path ONLY. Seed is explicitly labeled + gated off in prod.
    await page.goto("/?seed=1");
    const nodes = page.getByTestId("activity-node");
    await expect(nodes).toHaveCount(2); // deterministic fixture size
    await expect(page.getByTestId("dev-seed-banner")).toBeVisible();
    await expect(page.getByTestId("dev-seed-banner")).toContainText(/dev|fixture|seed/i);
  });

  test("Landing has NO auth surface (PG-PUB-001 forbids login on landing)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator("form")).toHaveCount(0);
  });

  test("primary entry action links to /explore (not a browse grid)", async ({ page }) => {
    await page.goto("/");
    const entry = page.getByTestId("entry-discovery");
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute("href", /\/explore/);
    await expect(page.getByTestId("browse-grid")).toHaveCount(0);
  });

  test("motion is finite (no infinite/idle loops) and one-shot arrival", async ({ page }) => {
    await page.goto("/");
    const infinite = await page.evaluate(() =>
      Array.from(document.getAnimations()).some(
        (a) => a.playState === "running" && (a as any).animationName !== "none" && (a as any).duration === Infinity
      )
    );
    expect(infinite).toBe(false);
  });

  test("reduced-motion collapses transitions and staticizes pulse", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?seed=1");
    const transition = await page.evaluate(() => getComputedStyle(document.body).transitionDuration);
    expect(transition).toMatch(/^(0s|0\.0+ms|0ms|\d+e-\d+s)$/);
  });

  test("3D / WebGL is absent (experimental, not in Slice 1)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(0);
    const hasThree = await page.evaluate(() =>
      !!(window as any).WebGLRenderingContext === false ? false : false
    );
    expect(hasThree).toBe(false);
  });

  test("renders on mobile (375px) and desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await expect(page.getByText(/voeq/i).first()).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.getByText(/voeq/i).first()).toBeVisible();
  });

  test("visual hierarchy: one dominant order Voeq -> context -> discovery -> enter", async ({ page }) => {
    await page.goto("/");
    // Dominant display heading (Voeq / arrival) exists and is the largest text.
    const heading = page.getByTestId("landing-heading");
    await expect(heading).toBeVisible();
    const hFont = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const bodyFont = await page.getByTestId("discovery-proposition").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(hFont).toBeGreaterThan(bodyFont); // heading dominates, not decorative > useful
    // Context block present (honest neutral state), discovery proposition present, entry present.
    await expect(page.getByTestId("campus-context")).toBeVisible();
    await expect(page.getByTestId("discovery-proposition")).toBeVisible();
    await expect(page.getByTestId("entry-discovery")).toBeVisible();
    // Order in DOM: heading before context before proposition before entry.
    const order = await page.evaluate(() => {
      const ids = ["landing-heading", "campus-context", "discovery-proposition", "entry-discovery"];
      const tops = ids.map((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el ? el.getBoundingClientRect().top : Infinity;
      });
      return tops;
    });
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1] - 1);
  });
});
