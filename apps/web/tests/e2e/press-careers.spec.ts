import { test, expect } from "@playwright/test";

test.describe("Press page (PG-PUB-011)", () => {
  test("renders shell, title, nav, footer and the 4 contact fields", async ({ page }) => {
    await page.goto("/press");
    await expect(page.getByTestId("info-page-shell")).toBeVisible();
    await expect(page.getByTestId("info-page-title")).toHaveText("Press");
    await expect(page.getByTestId("landing-nav")).toBeVisible();
    await expect(page.getByTestId("landing-footer")).toBeVisible();
    await expect(page.getByTestId("staff-contact-form")).toBeVisible();
    for (const label of ["Name", "Email", "Publication", "Message"]) {
      await expect(page.getByLabel(label)).toBeVisible();
    }
  });

  test("empty submit surfaces inline required errors", async ({ page }) => {
    await page.goto("/press");
    await page.getByTestId("staff-contact-submit").click();
    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Publication is required.")).toBeVisible();
    await expect(page.getByText("Message is required.")).toBeVisible();
  });

  test("valid submit shows the inline success state", async ({ page }) => {
    await page.goto("/press");
    await page.getByLabel("Name").fill("Jane Doe");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("Publication").fill("TechCrunch");
    await page.getByLabel("Message").fill("Story pitch");
    await page.getByTestId("staff-contact-submit").click();
    await expect(page.getByTestId("staff-contact-success")).toBeVisible();
  });
});

test.describe("Careers page (PG-PUB-012)", () => {
  test("renders 2 roles and the application form with a role select", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.getByTestId("info-page-title")).toHaveText("Careers");
    await expect(page.getByTestId("careers-role")).toHaveCount(2);
    await expect(page.getByTestId("staff-contact-form")).toBeVisible();
    const select = page.getByLabel("Role");
    await expect(select).toBeVisible();
    // placeholder "Select…" + 2 role options
    await expect(select.locator("option")).toHaveCount(3);
  });

  test("selecting a role updates the field value", async ({ page }) => {
    await page.goto("/careers");
    const select = page.getByLabel("Role");
    await select.selectOption("Frontend Engineer");
    await expect(select).toHaveValue("Frontend Engineer");
  });

  test("valid submit shows the inline success state", async ({ page }) => {
    await page.goto("/careers");
    await page.getByLabel("Name").fill("Ada");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Role").selectOption("Community Manager");
    await page.getByLabel("Resume Link").fill("https://example.com/ada.pdf");
    await page.getByLabel("Cover Letter").fill("I love campus commerce");
    await page.getByTestId("staff-contact-submit").click();
    await expect(page.getByTestId("staff-contact-success")).toBeVisible();
  });
});
