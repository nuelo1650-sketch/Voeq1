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

for (const p of [
  { path: "/about", heading: "Why We Exist" },
  { path: "/terms", heading: "1. What Voeq Is" },
  { path: "/privacy", heading: "1. What We Collect" },
  { path: "/for-vendors", heading: "Why Sell on Voeq?" },
  // /press has a different structure (release bodies under <article>); covered by the
  // dedicated "press release bodies" test below, not this generic sibling-<p> check.
]) {
  test(`info page ${p.path} section '${p.heading}' has real copy (no empty placeholder)`, async ({ page }) => {
    await page.goto(p.path);
    const section = page.getByRole("heading", { name: p.heading, level: 2 });
    await expect(section).toBeVisible();
    // The copy lives in the first <p> or <ul> of the heading's parent <section> (sibling of the h2).
    const block = section.locator("xpath=../p | ../ul").first();
    await expect(block).toBeVisible();
    const text = (await block.innerText()).replace(/\{?\/\* PLACEHOLDER \*\/\}?/g, "").trim();
    expect(text.length).toBeGreaterThan(0);
  });
}

test("Terms + Privacy show 'Last updated: [date]' and real section prose", async ({ page }) => {
  for (const path of ["/terms", "/privacy"]) {
    await page.goto(path);
    await expect(page.getByText(/Last updated:/)).toBeVisible();
    // Spot-check a real provided clause is present (not placeholder).
    const shellText = await page.getByTestId("info-page-shell").innerText();
    expect(shellText).toContain("support@voeq.ng");
  }
});

test("help FAQ answers are non-empty", async ({ page }) => {
  await page.goto("/help");
  const dds = page.locator("dd");
  const count = await dds.count();
  expect(count).toBe(6);
  for (let i = 0; i < count; i++) {
    const text = (await dds.nth(i).innerText()).replace(/\{?\/\* PLACEHOLDER \*\/\}?/g, "").trim();
    expect(text.length, `FAQ answer ${i} is empty`).toBeGreaterThan(0);
  }
});

test("press release bodies are non-empty (no literal placeholder text)", async ({ page }) => {
  await page.goto("/press");
  const bodies = page.locator('[data-testid="press-releases"] article p').filter({ hasNotText: "2026" });
  const count = await bodies.count();
  expect(count).toBe(2);
  for (let i = 0; i < count; i++) {
    const text = (await bodies.nth(i).innerText()).replace(/\{?\/\* PLACEHOLDER \*\/\}?/g, "").trim();
    expect(text.toLowerCase(), `press body ${i} still placeholder`).not.toContain("placeholder press release");
    expect(text.length, `press body ${i} is empty`).toBeGreaterThan(0);
  }
});
