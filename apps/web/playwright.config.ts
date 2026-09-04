import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config — hard DB isolation via scripts/e2e-server.mjs.
 *
 * LEAK HISTORY (2026-09-01): with reuseExistingServer:true the harness
 * silently reused a dev server on :3000 running against the PROD
 * DATABASE_URL from .env.local — E2E signups created real rows in prod
 * (3 'E2E Vendor' @test.voeq.ng identities, later deleted).
 *
 * Now: the launcher rewrites the DB URL to neondb_test and REFUSES to
 * start otherwise; the harness always owns its own :3050 server and never
 * inherits a prod-DB one.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3050",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:3050",
    reuseExistingServer: false,
    timeout: 180000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
