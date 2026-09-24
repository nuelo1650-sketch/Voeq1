import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
for (const u of ["https://voeq.ng/explore", "https://voeq.ng/explore?next=mb", "https://voeq.ng/"]) {
  await p.goto(u, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4500);
  const mb = await p.evaluate(() => !!document.querySelector('[data-testid="mb-explore"],[data-testid="mb-landing"]'));
  const old = await p.evaluate(() => !!document.querySelector('[data-testid="explore-grid"], .landing-page .landing-nav, [data-testid="landing-nav"]') || !!(document.querySelector("#main-content") || document.querySelector("main")));
  console.log(u, "->", JSON.stringify({ mb: mb, notMB: old }));
}
await b.close();
