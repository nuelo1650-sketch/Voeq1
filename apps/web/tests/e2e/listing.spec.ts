import { test, expect } from "@playwright/test";

/**
 * Slice 3 Listing Detail (PUBLIC) — PG-PUB-005 (Doc 04), Doc 05 B.15.3 Editorial / C.6 /
 * B.6 / D.4.1 continuity / Doc 01+03 LOCKED native (not WhatsApp) message CTA.
 * Verifies the editorial object renders, imagery leads, price/availability are data,
 * trust shows "Student Vouched", and the message CTA opens a NATIVE composer.
 */
test.describe("Slice 3 Listing Detail (PG-PUB-005)", () => {
  test("renders editorial detail: title, price, vendor, native message CTA", async ({ page }) => {
    await page.goto("/listing/l1");
    await expect(page.getByTestId("listing-detail")).toBeVisible();
    await expect(page.getByTestId("listing-detail-title")).toContainText(/Jollof/i);
    await expect(page.getByTestId("listing-detail-price")).toContainText(/R\s/);
    await expect(page.getByTestId("listing-detail-vendor")).toContainText(/Mama Nkechi/i);
    await expect(page.getByTestId("listing-detail-message-cta")).toBeVisible();
    // Trust language is the locked "Student Vouched", never "Verified".
    await expect(page.getByTestId("listing-detail-verified")).toContainText(/Student Vouched/i);
  });

  test("imagery leads: image frame present (monogram fallback when no image)", async ({ page }) => {
    await page.goto("/listing/l1");
    // l1 has an image in the mock dataset -> framed image renders.
    await expect(page.getByTestId("listing-detail-image-frame")).toBeVisible();
    await expect(page.getByTestId("listing-detail-gallery")).toBeVisible();
  });

  test("message CTA opens a NATIVE composer (not WhatsApp)", async ({ page }) => {
    await page.goto("/listing/l1");
    await page.getByTestId("listing-detail-message-cta").click();
    const composer = page.getByTestId("listing-detail-composer");
    await expect(composer).toBeVisible();
    await page.getByTestId("listing-detail-send").click();
    await expect(page.getByTestId("listing-detail-status")).toContainText(/native/i);
  });

  test("unknown id -> not-found state with back link to Explore", async ({ page }) => {
    await page.goto("/listing/does-not-exist");
    await expect(page.getByTestId("listing-detail-notfound")).toBeVisible();
    await expect(page.getByTestId("listing-detail-back")).toHaveAttribute("href", /\/explore/);
  });

  test("renders in Cream (default env, never silent Deep)", async ({ page }) => {
    await page.goto("/listing/l1");
    await expect(page.locator("html")).toHaveAttribute("data-env", "cream");
  });

  test("continuity entrance: no infinite/idle animation after mount", async ({ page }) => {
    await page.goto("/listing/l1");
    await page.waitForTimeout(900);
    const running = await page.getByTestId("listing-detail").evaluate((el) =>
      (el as HTMLElement).getAnimations().some((a) => a.playState === "running")
    );
    expect(running).toBe(false);
  });
});
