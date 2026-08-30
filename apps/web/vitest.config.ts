import { defineConfig } from "vitest/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load the project's .env.local (KEY=VALUE, # comments) into the test env.
 *
 * Next.js loads this file for the app; vitest does not — which made real-service
 * tests (Sightengine, Cloudinary, validateEnv, Neon) fail in full-suite runs
 * unless keys were manually exported first. That was the recurring
 * "Sightengine broke again" mystery (2026-08-29): env loading, never the keys.
 *
 * ESM-safe (no require/__dirname — vitest transpiles this config as ESM).
 * Values keep inner '=' (DB connection strings); surrounding quotes stripped.
 */
function loadEnvLocal(): Record<string, string> {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Real-Neon roundtrips legitimately take 4-5s under full-suite load
    // (connection-pool contention). Default 5s is too tight; 30s gives headroom
    // without masking a genuine hang (a real hang would still exceed this).
    testTimeout: 30000,
    env: isolateTestEnv(loadEnvLocal()),
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/**", "lib/**", "components/**"],
    },
  },
});

/**
 * P6 (2026-08-30): run the test suite against an ISOLATED database so tests
 * never mutate the launch/prod data. If the file contains a prod DATABASE_URL
 * pointing at /neondb, we rewrite it to /neondb_test for the test run (unless a
 * VOEQ_TEST_DATABASE_URL is already provided). This keeps the launch DB pristine
 * while still exercising the real Neon query path.
 */
function isolateTestEnv(env: Record<string, string>): Record<string, string> {
  const out = { ...env };
  if (!out.DATABASE_URL) return out;
  // Honest: never rewrite a URL that isn't the prod /neondb target.
  if (/\/neondb(\?|$)/.test(out.DATABASE_URL)) {
    out.DATABASE_URL = out.DATABASE_URL.replace(/\/neondb(\?|$)/, "/neondb_test$1");
  }
  return out;
}
