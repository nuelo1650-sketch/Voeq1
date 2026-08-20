import { test, expect } from "@playwright/test";

/**
 * Vendor Storefront (PUBLIC) — PG-PUB-004 (Doc 04), Doc 05 A.3 (Deep environment).
 * Verifies: route renders for a valid vendor id, not-found for an unknown id,
 * the Deep hero (name + "Student Vouched" + derived rating), the listings grid
 * (or honest empty state), the reviews graceful-absence copy, the no-op Follow /
 * Message CTAs, and the Deep environment override on <main>.
 */
test.describe("Vendor Storefront (PG-PUB-004)", () => {
  test("renders for a valid vendor id with hero + grid + trust", async ({ page }) => {
    await page.goto("/vendor/v1");
    await expect(page.getByTestId("storefront-page")).toBeVisible();
    await expect(page.getByTestId("storefront-hero")).toBeVisible();
    await expect(page.getByTestId("storefront-name")).toContainText(/Mama Nkechi/i);
    await expect(page.getByTestId("storefront-vouched")).toContainText(/Student Vouched/i);
    // Derived rating from real mock listings (v1 has rated listings).
    await expect(page.getByTestId("storefront-rating")).toContainText(/★/);
    // Grid renders the vendor's listings (v1 = Mama Nkechi, l1 + l4).
    await expect(page.getByTestId("storefront-grid")).toBeVisible();
    await expect(page.getByTestId("listing-card")).toHaveCount(2);
    await expect(page.getByTestId("listing-card").first()).toBeVisible();
    // Reviews graceful absence.
    await expect(page.getByTestId("storefront-reviews-empty")).toContainText(/No reviews yet/i);
    // CTAs present + no-op (visible, not disabled).
    const follow = page.getByTestId("storefront-follow-btn");
    const message = page.getByTestId("storefront-message-btn");
    await expect(follow).toBeVisible();
    await expect(message).toBeVisible();
    await expect(follow).toBeEnabled();
    await expect(message).toBeEnabled();
  });

  test("unknown vendor id -> not-found", async ({ page }) => {
    const res = await page.goto("/vendor/does-not-exist");
    // notFound() yields a 404 status; page must not render the storefront shell.
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId("storefront-page")).toHaveCount(0);
  });

  test("renders in Deep environment (data-env='deep' on <main>)", async ({ page }) => {
    await page.goto("/vendor/v1");
    await expect(page.getByTestId("storefront-page")).toHaveAttribute("data-env", "deep");
    // The root <html> stays Cream (Deep is scoped to this page only).
    await expect(page.locator("html")).toHaveAttribute("data-env", "cream");
  });

  test("Follow / Message CTAs are no-op (do not navigate or error)", async ({ page }) => {
    await page.goto("/vendor/v1");
    await page.getByTestId("storefront-follow-btn").click();
    await page.getByTestId("storefront-message-btn").click();
    // Still on the storefront, no crash / navigation away.
    await expect(page.getByTestId("storefront-page")).toBeVisible();
  });

  test("vendor with listings shows its grid (v2 = Campus Books, 2 listings)", async ({ page }) => {
    // v2 (Campus Books) has l2 + l7 in the mock dataset -> 2 cards, not empty.
    await page.goto("/vendor/v2");
    await expect(page.getByTestId("storefront-grid")).toBeVisible();
    await expect(page.getByTestId("listing-card")).toHaveCount(2);
    // Empty-state copy must NOT appear when listings exist.
    await expect(page.getByTestId("storefront-grid-empty")).toHaveCount(0);
  });
});
