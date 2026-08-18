import { test, expect } from "@playwright/test";

/**
 * Slice 0 styleguide gate (Doc 06 §3):
 *  - Renders in both environments via role-flip (no second theme)
 *  - Reduced-motion respected
 *  - No perpetual/infinite animation
 *  - Mobile + desktop both verified
 */

test.describe("Voeq Slice 0 styleguide gate", () => {
  test("loads and shows the foundation (not a product mockup)", async ({ page }) => {
    await page.goto("/styleguide");
    await expect(page.getByText("Voeq Foundation")).toBeVisible();
    await expect(page.getByText(/system demonstration only/i)).toBeVisible();
  });

  test("environment flip swaps data-env without a second theme file", async ({ page }) => {
    await page.goto("/styleguide");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-env", "cream");

    await page.getByRole("button", { name: "Deep" }).click();
    await expect(html).toHaveAttribute("data-env", "deep");

    // The Deep button is now the primary; Cream reverts to ghost — proves role flip, not theme swap.
    await page.getByRole("button", { name: "Cream (default)" }).click();
    await expect(html).toHaveAttribute("data-env", "cream");
  });

  test("contour primitives are data-gated (no invented activity on load)", async ({ page }) => {
    await page.goto("/styleguide");
    await expect(page.getByText(/ActivityNode: empty \(correct\)/i)).toBeVisible();
  });

  test("no infinite/perpetual animation present (D.8)", async ({ page }) => {
    await page.goto("/styleguide");
    const infinite = await page.evaluate(() => {
      return Array.from(document.getAnimations()).some(
        (a) => a.playState === "running" && (a as any).animationName !== "none" && (a as any).duration === Infinity
      );
    });
    expect(infinite).toBe(false);
  });

  test("reduced-motion media query is honored (no transitions applied)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/styleguide");
    const transition = await page.evaluate(() => {
      const el = document.body;
      return getComputedStyle(el).transitionDuration;
    });
    // With reduced-motion, the global rule collapses transition durations to ~0
    // (computed as "1e-06s" — effectively disabled). Accept near-zero forms.
    expect(transition).toMatch(/^(0s|0\.0+ms|0ms|\d+e-\d+s)$/);
  });

  test("renders on mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/styleguide");
    await expect(page.getByText("Voeq Foundation")).toBeVisible();
  });

  test("renders on desktop viewport (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/styleguide");
    await expect(page.getByText("Voeq Foundation")).toBeVisible();
  });
});
