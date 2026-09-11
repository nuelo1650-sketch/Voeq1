/** TTFB + request-timing comparison between the two saved Lighthouse reports. */
import { readFileSync } from "fs";

const load = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const pre = load("C:/Users/Legacy/AppData/Local/Temp/lighthouse-report.json");
// the second probe overwrote the same output path — compare audit + env
const post = load("C:/Users/Legacy/AppData/Local/Temp/lighthouse-report.json");

for (const [label, r] of [["post", post]] as const) {
  const a = r.audits;
  const det = a["lcp-breakdown-insight"]?.details?.items ?? [];
  for (const it of det) {
    if (it.type === "table") {
      console.log(`== ${label} LCP subparts ==`);
      for (const row of it.items) console.log(`  ${row.subpart}: ${Math.round(row.duration)}ms`);
    }
    if (it.type === "node") console.log(`${label} LCP node:`, it.selector);
  }
  const net = a["network-requests"]?.details?.items ?? [];
  const logo = net.find((n: any) => n.url.endsWith("/Logo.png"));
  console.log(`${label} Logo.png:`, logo ? `${Math.round(logo.transferSize / 1024)}KB network=${Math.round(logo.networkRequestTime)}ms` : "not in log");
  const ttfb = net.find((n: any) => n.url.endsWith("voeq.ng/"));
  console.log(`${label} doc TTFB-ish:`, ttfb ? `networkRequestTime=${Math.round(ttfb.networkRequestTime)}ms` : "?");
}
