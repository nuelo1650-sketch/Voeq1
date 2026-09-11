/** Hydration-error check: load landing/explore/live, fail if React logs a
 *  hydration mismatch. Run: npx tsx scripts/rt-mb-hydration.mts (dev :3031). */
import { chromium } from "playwright";

const BASE = process.env.MB_BASE ?? "http://localhost:3031";
const routes = ["/", "/explore", "/explore/live", "/explore/trending"];
const HYD = /hydration|did not match|Text content|server rendered|regenerated on the client/i;

let failures = 0;
const browser = await chromium.launch();
const page = await browser.newPage();
const seen: string[] = [];
page.on("console", (m) => {
  const t = m.text();
  if (HYD.test(t)) { seen.push(t.slice(0, 160)); failures++; }
});
page.on("pageerror", (e) => {
  if (HYD.test(e.message)) { seen.push("pageerror: " + e.message.slice(0, 160)); failures++; }
});

for (const r of routes) {
  await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  console.log(`visited ${r}`);
}
await browser.close();
if (seen.length) {
  console.log("HYDRATION ERRORS:\n" + [...new Set(seen)].join("\n---\n"));
  console.log(`FAILED: ${failures}`);
  process.exit(1);
}
console.log("ALL PASS — zero hydration errors across " + routes.length + " routes");
