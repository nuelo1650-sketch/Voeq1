import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:3404", trace: "on-first-retry" },
  webServer: {
    command: "npx next dev -p 3404",
    url: "http://localhost:3404",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
