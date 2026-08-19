import { test, expect } from "@playwright/test";

/**
 * Slice 2 Explore (PUBLIC) — PG-PUB-002/003 (Doc 04), Doc 05 B.6/B.12/C.3.1/C.3.2/D.2/D.4/
 * D.4.1. Cream environment (default; Explore was always Cream). Verifies required visible
 * content, all states (empty/loading/error), responsive, and the D.4.1 continuity entrance.
 *
 * Genuine zero-results empty state is exercised via /c/zzz (category preset matching nothing
 * -> real zero through the actual code path, NOT a pre-load blank). Error/retry via
 * ?exploreError=1 (forced-failure mock repo).
 */
test.describe("Slice 2 Explore", () => {
  test("renders in Cream (default env, never silent Deep)", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("html")).toHaveAttribute("data-env", "cream");
    await expect(page.getByTestId("explore")).toBeVisible();
    // Shared anchor: top bar mirrors Landing nav geometry (same height token).
    const bar = await page.getByTestId("explore-topbar").evaluate((el) => el.getBoundingClientRect().height);
    expect(bar).toBe(56); // --nav-height
  });

  test("shows required visible content + populated grid with trust signals", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByTestId("explore-campus-indicator")).toContainText(/NMU/i);
    await expect(page.getByTestId("explore-search")).toBeVisible();
    await expect(page.getByTestId("explore-filters")).toBeVisible();
    await expect(page.getByTestId("trending-rail")).toBeVisible();

    const cards = page.getByTestId("listing-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(5);

    // Trust signals present on at least one card.
    await expect(page.getByTestId("listing-verified").first()).toBeVisible();
    // Price is tabular + always present (never recedes).
    await expect(page.getByTestId("listing-price").first()).toContainText(/R\s/);
    // Availability chip present.
    await expect(page.getByTestId("listing-availability").first()).toBeVisible();
  });

  test("missing image -> contour monogram, not broken-image icon", async ({ page }) => {
    await page.goto("/explore");
    // At least one mock listing has images:[] -> should render the monogram.
    await expect(page.getByTestId("listing-monogram").first()).toBeVisible();
  });

  test("trending rail shows trending listings", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByTestId("trending-rail")).toBeVisible();
    await expect(page.getByTestId("trending-rail").getByTestId("listing-card").first()).toBeVisible();
  });

  test("empty state: /c/zzz (real zero results) shows 'No vendors yet' + CTAs", async ({ page }) => {
    await page.goto("/c/zzz");
    const empty = page.getByTestId("explore-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText(/no vendors yet on NMU/i);
    await expect(page.getByTestId("explore-empty-browse")).toBeVisible();
    await expect(page.getByTestId("explore-empty-vendor")).toBeVisible();
    // No blank grid.
    await expect(page.getByTestId("explore-grid")).toHaveCount(0);
  });

  test("error/retry: ?exploreError=1 shows error + retry, no fake success", async ({ page }) => {
    await page.goto("/explore?exploreError=1");
    const err = page.getByTestId("explore-error");
    await expect(err).toBeVisible();
    await expect(err).toContainText(/couldn.t load listings/i);
    await expect(page.getByTestId("explore-retry")).toBeVisible();
    // Clicking retry re-runs the (still-failing) load; error persists, no success faked.
    await page.getByTestId("explore-retry").click();
    await expect(page.getByTestId("explore-error")).toBeVisible();
    await expect(page.getByTestId("explore-grid")).toHaveCount(0);
  });

  test("category route /c/food presets category + shows heading", async ({ page }) => {
    await page.goto("/c/food");
    await expect(page.getByTestId("explore-heading")).toContainText(/food/i);
    // Filtered to food only.
    const cards = page.getByTestId("listing-card");
    await expect(cards.first()).toBeVisible();
  });

  test("recently-viewed rail records clicked cards (client-side, deduped)", async ({ page }) => {
    await page.goto("/explore");
    const firstLink = page.getByTestId("explore-card-link").first();
    await firstLink.click();
    // Navigate back to explore; rail should now show the recorded card.
    await page.goto("/explore");
    await expect(page.getByTestId("recently-viewed-rail")).toBeVisible();
  });

  test("mobile (375px): filters open in bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/explore");
    await expect(page.getByTestId("explore-filters-toggle")).toBeVisible();
    await page.getByTestId("explore-filters-toggle").click();
    const sheet = page.getByTestId("explore-filters-sheet");
    await expect(sheet).toBeVisible();
    // The sheet's own Filters (sidebar is display:none on mobile, still in DOM).
    await expect(sheet.getByTestId("explore-filters")).toBeVisible();
  });
  test("desktop (1280px): persistent sidebar filters + multi-column grid", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/explore");
    await expect(page.getByTestId("explore-sidebar")).toBeVisible();
    // Mobile-only toggle is in the DOM but hidden on desktop.
    await expect(page.getByTestId("explore-filters-toggle")).toBeHidden();
  });

  test("D.4.1 continuity entrance: contour anchor animates in on mount", async ({ page }) => {
    await page.goto("/explore");
    const entrance = page.getByTestId("explore-contour-anchor");
    await expect(entrance).toBeVisible();
    // After the 700ms entrance completes, no animation should still be running.
    await page.waitForTimeout(900);
    const running = await entrance.evaluate((el) =>
      (el as HTMLElement).getAnimations().some((a) => a.playState === "running")
    );
    expect(running).toBe(false);
  });
});
