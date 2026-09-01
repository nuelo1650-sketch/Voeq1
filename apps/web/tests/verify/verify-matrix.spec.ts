import { test, expect, Page } from "@playwright/test";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

/**
 * VERIFY MATRIX — health assertions, NOT pixel values. These survive redesigns:
 *  - no horizontal overflow (the "half cards" detector)
 *  - all interactive elements inside the viewport (no clipped controls)
 *  - all images actually load (naturalWidth > 0)
 *  - no pageerror / unhandled rejection
 *  - screenshots captured for the human+vision review
 */
const SHOTS = resolve(process.cwd(), "verify-shots");
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

async function capture(page: Page, name: string): Promise<string> {
  const file = resolve(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

/** Assert the page has no horizontal overflow and every button/link is inside the viewport. */
async function assertNoOverflow(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollW: doc.scrollWidth, innerW: window.innerWidth };
  });
  expect(overflow.scrollW, `${label}: document.scrollWidth (${overflow.scrollW}) must be <= innerWidth (${overflow.innerW})`)
    .toBeLessThanOrEqual(overflow.innerW + 1);
}

async function assertInteractiveInside(page: Page, label: string): Promise<void> {
  const clipped = await page.evaluate(() => {
    const vw = window.innerWidth;
    const bad: string[] = [];
    document.querySelectorAll("a,button,[role='button'],input,select").forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      // Only flag visible elements; skip offscreen-in-dropdown or hidden-by-design
      if (r.width === 0 || r.height === 0) return;
      if (r.left < -1 || r.right > vw + 1) {
        const testId = el.getAttribute("data-testid") || el.getAttribute("aria-label") || (el.textContent || "").trim().slice(0, 24);
        bad.push(`x:[${Math.round(r.left)},${Math.round(r.right)}] ${el.tagName} "${testId}"`);
      }
    });
    return bad.slice(0, 12);
  });
  expect(clipped, `${label}: clipped interactive elements:\n${clipped.join("\n")}`).toEqual([]);
}

async function assertImagesLoad(page: Page, label: string): Promise<void> {
  const broken = await page.evaluate(() => {
    const bad: string[] = [];
    document.querySelectorAll("img").forEach((im) => {
      const img = im as HTMLImageElement;
      // allow images still loading (naturalWidth 0 pre-load) to settle once
      if (img.complete && img.naturalWidth === 0) {
        bad.push(`${img.getAttribute("src")?.slice(0, 80) || "(no src)"}`);
      }
    });
    return bad.slice(0, 12);
  });
  expect(broken, `${label}: broken images:\n${broken.join("\n")}`).toEqual([]);
}

const PAGES: Array<[string, boolean?]> = [
  ["", true], // landing is at "/" (root)
  ["explore", true],
  ["login", true],
  ["signup", true],
  ["consent", true],
  ["select-campus", true],
  ["about", true],
  ["help", true],
  ["how-it-works", true],
  ["privacy", true],
  ["terms", true],
  ["careers", true],
  ["press", true],
  ["for-vendors", true],
  ["become-vendor", true],
  ["c/categories", true],
  ["vendor/3647302d-a59a-404d-aa45-8d0f33eff748", true],
  ["listing/f36af9d9-5e06-44a5-93be-6c296fc73995", true],
  ["messages", false], // auth gated — expect redirect; still capture
  ["saved", false], // MISSING page — expect 404; record
  ["home", false], // auth gated
  ["settings", false],
  ["notifications", false],
  ["vendor/dashboard", false],
];

for (const [pagePath, expectPublic] of PAGES) {
  test(`page /${pagePath}`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console.error: ${m.text().slice(0, 160)}`);
    });

    const resp = await page.goto(`/${pagePath}`, { waitUntil: "networkidle" });
    const status = resp?.status() ?? 0;
    const label = `/ ${pagePath}`;

    // Record the status (expected: 200 for public, 3xx/404 for gated)
    console.log(`[${testInfo.project.name}] /${pagePath} -> HTTP ${status}`);

    if (expectPublic && status !== 200) {
      // Page may be static but API-driven; 4xx is a real failure for public pages
      expect(status, `${label}: expected HTTP 200, got ${status}`).toBe(200);
    }

    // Geometry checks (skip when page redirected away or errored hard)
    if (status === 200) {
      await assertNoOverflow(page, label);
      await assertInteractiveInside(page, label);
      await assertImagesLoad(page, label);
    }

    await capture(page, `${testInfo.project.name}-${pagePath.replace(/\//g, "_")}`);
    expect(errors, `${label}: console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });
}
