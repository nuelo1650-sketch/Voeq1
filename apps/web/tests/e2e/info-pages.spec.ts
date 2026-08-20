import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/about", title: "About Voeq" },
  { path: "/terms", title: "Terms of Service" },
  { path: "/privacy", title: "Privacy Policy" },
  { path: "/help", title: "Help" },
  { path: "/for-vendors", title: "For Vendors" },
];

for (const p of PAGES) {
  test(`info page ${p.path} renders shell + title + nav + footer`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.getByTestId("info-page-shell")).toBeVisible();
    await expect(page.getByTestId("info-page-title")).toHaveText(p.title);
    await expect(page.getByTestId("landing-nav")).toBeVisible();
    await expect(page.getByTestId("landing-footer")).toBeVisible();
  });
}

test("for-vendors CTA links to /signup", async ({ page }) => {
  await page.goto("/for-vendors");
  const cta = page.getByTestId("for-vendors-cta");
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/signup");
});
