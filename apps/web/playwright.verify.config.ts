import { defineConfig, devices } from "@playwright/test";

/**
 * VERIFY MATRIX (Phase 1) — multi-device rendered verification.
 * Read-only by design: every check inspects the rendered page (geometry,
 * images, console) and NEVER mutates. Mutating flow tests run separately
 * against the test-DB server in Phase 3.
 *
 * Targets the running dev server :3030 (real Neon, read-only GETs).
 */
export default defineConfig({
  testDir: "./tests/verify",
  timeout: 60000,
  retries: 0,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never", outputFolder: "verify-report" }]],
  use: {
    baseURL: "http://localhost:3030",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "phone-390", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } },
    { name: "pixel-412", use: { browserName: "chromium", viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" } },
    { name: "tablet-768", use: { browserName: "chromium", viewport: { width: 768, height: 1024 }, isMobile: false, hasTouch: true } },
    { name: "desktop-1280", use: { browserName: "chromium", viewport: { width: 1280, height: 900 } } },
    { name: "desktop-1920", use: { browserName: "chromium", viewport: { width: 1920, height: 1080 } } },
  ],
});
