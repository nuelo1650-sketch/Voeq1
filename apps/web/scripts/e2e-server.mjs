/**
 * E2E server launcher — hard DB isolation (Windows-safe, no shell-isms).
 *
 * LEAK HISTORY (2026-09-01): with reuseExistingServer:true the harness
 * silently reused a dev server on :3000 running against the PROD
 * DATABASE_URL from .env.local — E2E signups created real rows in prod
 * (3 'E2E Vendor' @test.voeq.ng identities, later deleted).
 *
 * This launcher makes the leak impossible:
 *   - reads .env.local's DATABASE_URL, REWRITES neondb -> neondb_test
 *   - REFUSES to start if the URL is not the test database
 *   - spawns next dev on a dedicated port (:3050) with the test env
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const PORT = process.env.E2E_PORT ?? "3050";

const envLocal = readFileSync(".env.local", "utf8");
const m = envLocal.match(/^DATABASE_URL=(.*)$/m);
if (!m) {
  console.error("[e2e-server] FATAL: no DATABASE_URL in .env.local");
  process.exit(1);
}
const testUrl = m[1].trim().replace("/neondb?", "/neondb_test?");
if (!testUrl.includes("neondb_test")) {
  console.error("[e2e-server] FATAL: DB URL does not point at the test database (neondb_test). Refusing to run E2E against any other database.");
  process.exit(1);
}
console.log("[e2e-server] launching on :" + PORT + " with TEST database (neondb_test) — prod unreachable");

const child = spawn("npx", ["next", "dev", "-p", PORT], {
  env: { ...process.env, DATABASE_URL: testUrl },
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
