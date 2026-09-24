import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
const j = await (await p.request.get("https://voeq.ng/api/explore?sections=1")).json();
const d = j.data ?? [];
console.log("API n:", d.length);
for (const l of d.slice(0, 6)) {
  console.log(" -", l.id.slice(0, 12), "|", (l.title ?? "").slice(0, 32), "| imgs:", JSON.stringify(l.images ?? []).slice(0, 50), "| price:", l.priceMinor ?? l.priceMinMinor);
}
await b.close();
