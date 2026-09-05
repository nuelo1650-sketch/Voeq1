/** Full LCP breakdown + font/network evidence for the landing LCP. */
import { readFileSync } from "fs";

const r = JSON.parse(readFileSync("C:/Users/Legacy/AppData/Local/Temp/lighthouse-report.json", "utf8"));
const a = r.audits;

// Full breakdown table (all subparts)
const det = a["lcp-breakdown-insight"]?.details;
for (const it of det?.items ?? []) {
  if (it.type === "table") {
    for (const row of it.items) {
      console.log(`${row.subpart.padEnd(24)} ${Math.round(row.duration)}ms  ${row.label}`);
    }
  }
  if (it.type === "node") {
    console.log("\nLCP node:", it.selector, "\nlabel:", (it.nodeLabel ?? "").slice(0, 90));
  }
}

// discovery insight
console.log("\n== lcp-discovery-insight ==");
console.log(JSON.stringify(a["lcp-discovery-insight"]?.details ?? {}).slice(0, 400));

// network requests: fonts + the big chunks
console.log("\n== network requests (fonts, css, js > 100KB, slow) ==");
const net = a["network-requests"]?.details?.items ?? [];
for (const n of net) {
  const isFont = /woff2?|\.ttf/i.test(n.url) || (n.resourceType || "").toUpperCase() === "FONT";
  const big = (n.transferSize ?? 0) > 100_000;
  if (isFont || big || (n.resourceType === "Script" && (n.transferSize ?? 0) > 80_000)) {
    console.log(`${(n.resourceType ?? "?").padEnd(9)} ${String(Math.round((n.transferSize ?? 0) / 1024)).padStart(5)}KB  ${n.url.slice(0, 90)}`);
  }
}
console.log("\ntotal requests:", net.length, "total transfer:", Math.round(net.reduce((s, n) => s + (n.transferSize ?? 0), 0) / 1024) + "KB");

// unused bytes quick view
console.log("\n== unused-javascript (top 3) ==");
for (const i of (a["unused-javascript"]?.details?.items ?? []).slice(0, 3)) {
  console.log(`${Math.round((i.wastedBytes ?? 0) / 1024)}KB wasted of ${Math.round((i.totalBytes ?? 0) / 1024)}KB — ${i.url.slice(0, 80)}`);
}
