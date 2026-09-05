/** Deep-dive into the saved Lighthouse report: when did the hero VISUALLY appear,
 *  and where did main-thread CPU time go? */
import { readFileSync } from "fs";

const r = JSON.parse(readFileSync("C:/Users/Legacy/AppData/Local/Temp/lighthouse-report.json", "utf8"));
const a = r.audits;

console.log("== screenshot-thumbnails (visual timeline) ==");
const st = a["screenshot-thumbnails"]?.details?.items ?? [];
for (const t of st) {
  console.log(`  ${String(t.timing).padStart(6)}ms  ${t.data ? "(frame)" : ""}`);
}

console.log("\n== final-screenshot present ==", !!a["final-screenshot"]?.details?.data);

console.log("\n== mainthread-work-breakdown (top 8) ==");
const mt = a["mainthread-work-breakdown"]?.details?.items ?? [];
for (const i of mt.slice(0, 8)) {
  console.log(`  ${Math.round(i.duration)}ms  ${i.groupLabel}`);
}

console.log("\n== bootup-time (script eval + parse, top 8) ==");
const bt = a["bootup-time"]?.details?.items ?? [];
for (const i of bt.slice(0, 8)) {
  const parse = i.scriptParse ?? 0;
  console.log(`  total ${Math.round(i.total)}ms (parse ${Math.round(parse)})  ${i.url.slice(0, 90)}`);
}

console.log("\n== LCP subparts again ==");
const det = a["lcp-breakdown-insight"]?.details?.items ?? [];
for (const it of det) {
  if (it.type === "table") for (const row of it.items) console.log(`  ${row.subpart}: ${Math.round(row.duration)}ms`);
  if (it.type === "node") console.log("  node:", it.selector);
}

console.log("\n== font requests + timing ==");
const net = a["network-requests"]?.details?.items ?? [];
for (const n of net) {
  if (/woff2/i.test(n.url)) {
    console.log(`  ${Math.round((n.transferSize ?? 0) / 1024)}KB  start=${Math.round(n.networkRequestTime)}ms end=${Math.round(n.networkEndTime)}ms  ${n.url.slice(-40)}`);
  }
}

console.log("\n== critical-request-chains depth ==");
const crc = a["critical-request-chains"]?.details;
const chains = crc?.chains ?? {};
console.log("  top-level nodes:", Object.keys(chains).length);
for (const k of Object.keys(chains).slice(0, 6)) {
  const c = chains[k];
  console.log(`  ${c.request?.url?.slice(0, 80)} (${c.request?.transferSize ?? 0}B)`);
}
