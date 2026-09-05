/**
 * LCP root-cause probe: run Lighthouse (the same engine as PageSpeed) against
 * PROD voeq.ng with mobile emulation, and print the LCP element breakdown.
 * Ground truth before any fix — the board assumed 'hero image priority' but
 * the hero has NO image (text + CSS floaty cards), so the assumption needs
 * verifying against the actual audit.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const URL = "https://voeq.ng/";
const OUT = "C:/Users/Legacy/AppData/Local/Temp/lighthouse-report.json";

// Lighthouse CLI via npx, pointing at our Playwright Chromium (no system Chrome needed)
import { execFileSync } from "child_process";

const args = [
  "lighthouse",
  URL,
  "--output=json",
  `--output-path=${OUT}`,
  "--only-categories=performance",
  "--form-factor=mobile",
  "--screen-size=412,823",          // Pixel-ish, matches Lighthouse default mobile
  "--throttling-method=simulate",
  "--chrome-flags=--headless=new",
  "--quiet",
];
console.log("running lighthouse (this takes ~60-90s)...");
execFileSync("npx", args, {
  cwd: "C:/Users/Legacy/Documents/voeq",
  stdio: "inherit",
  timeout: 240000,
  shell: process.platform === "win32",
});

const report = JSON.parse(await (await import("fs")).promises.readFile(OUT, "utf8"));
const audits = report.audits;

console.log("\n=== SCORES ===");
console.log("performance:", Math.round(report.categories.performance.score * 100));

console.log("\n=== METRICS ===");
for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"]) {
  const a = audits[k];
  if (a) console.log(`${k}: ${a.displayValue} (score ${a.score})`);
}

console.log("\n=== LCP BREAKDOWN (phases) ===");
const lcp = audits["largest-contentful-paint-element"];
if (lcp?.details?.items) {
  for (const item of lcp.details.items) {
    for (const sub of item.items ?? []) {
      console.log(`  phase: ${sub.phase ?? "?"} — ${Math.round((sub.timing ?? 0))}ms — ${sub.node?.nodeLabel ?? ""}`.slice(0, 140));
    }
  }
}

console.log("\n=== LCP element selector ===");
if (lcp?.details?.items?.[0]?.items?.[0]?.node) {
  console.log(JSON.stringify(lcp.details.items[0].items[0].node.selector, null, 1).slice(0, 300));
  console.log("path:", (lcp.details.items[0].items[0].node.path || "").slice(0, 120));
}

console.log("\n=== RENDER-BLOCKING ===");
const rb = audits["render-blocking-resources"];
if (rb?.details?.items) {
  for (const i of rb.details.items) console.log(`  ${i.url?.slice(0, 100)} — ${i.wastedMs}ms`);
}

console.log("\n=== NETWORK DEPENDENCY (LCP critical path) ===");
const nd = audits["network-dependency-tree"];
if (nd?.details) console.log(JSON.stringify(nd.details).slice(0, 900));
