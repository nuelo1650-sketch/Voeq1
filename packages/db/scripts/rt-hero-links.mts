/** B4 launch probe @390px: landing hero CTAs are real crawlable links.
 *  A: "Explore marketplace" is an <a href="/explore"> (not a button).
 *  B: category chips are <a href="/explore?category=...">.
 *  C: tapping the CTA navigates; search form still router.pushes with query.
 *  D: no horizontal overflow. */
import { chromium } from "playwright";

const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });

// A: primary CTA is a real anchor
const cta = await page.evaluate(`(() => {
  const el = document.querySelector("[data-testid='hero-explore-cta']");
  return el ? JSON.stringify({ tag: el.tagName, href: el.getAttribute("href") }) : "none";
})()`);
const c = JSON.parse(cta);
check("A1: hero CTA is <a>", c.tag === "A", cta);
check("A2: CTA href=/explore", c.href === "/explore", c.href ?? "");

// B: chips are anchors with category params
const chips = await page.evaluate(`(() => {
  return [...document.querySelectorAll("a.hero-chip")].map(a => a.getAttribute("href"));
})()`);
check("B1: 5 category chips are anchors", chips.length === 5, JSON.stringify(chips));
check("B2: chips carry /explore?category=", chips.every((h: string) => h.startsWith("/explore?category=")));

// C: tap CTA navigates (cold-compile: waitForURL)
await page.locator("[data-testid='hero-explore-cta']").click();
await page.waitForURL(/\/explore/, { timeout: 25000 }).catch(() => {});
check("C1: tapping CTA navigates to /explore", page.url().includes("/explore"), page.url().slice(0, 60));

// search form still works (router.push with query)
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.fill(".hero-search-input", "rice");
await page.locator("button.hero-search-btn").click();
await page.waitForURL(/\/explore\?q=rice/, { timeout: 25000 }).catch(() => {});
check("C2: search still routes with query", page.url().includes("q=rice"), page.url().slice(0, 70));

// D: no overflow
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
check("D1: no h-overflow @390", sw <= 390, `scrollW=${sw}`);

await browser.close();
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
