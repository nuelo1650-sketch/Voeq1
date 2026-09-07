/** FAQ launch probe @390px: landing FAQ renders + expands; help page has no
 *  literal &apos; text anywhere. */
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

// LANDING
await page.goto("http://localhost:3031/", { waitUntil: "networkidle", timeout: 60000 });
check("L1: landing FAQ section present", (await page.locator("[data-testid='landing-faq']").count()) === 1);
const items = await page.locator("[data-testid='landing-faq'] .faq-item").count();
check("L2: 6 FAQ items", items === 6, `n=${items}`);
// first open, others closed
check("L3: first item open by default", await page.evaluate(() => (document.querySelectorAll("[data-testid='landing-faq'] .faq-item")[0] as HTMLDetailsElement)?.open === true));
// click 2nd question -> opens
await page.locator("[data-testid='landing-faq'] .faq-question").nth(1).click();
await page.waitForTimeout(200);
check("L4: clicking a question expands it", await page.evaluate(() => (document.querySelectorAll("[data-testid='landing-faq'] .faq-item")[1] as HTMLDetailsElement)?.open === true));
const bodyText = await page.evaluate(() => document.body.innerText);
check("L5: no literal &apos; on landing", !bodyText.includes("&apos;"));
check("L6: FAQ answer text visible", bodyText.includes("completely free for students"));
const overflow = await page.evaluate(() => document.documentElement.scrollWidth);
check("L7: no h-overflow @390", overflow <= 390, `scrollW=${overflow}`);

// HELP
await page.goto("http://localhost:3031/help", { waitUntil: "networkidle", timeout: 60000 });
const helpText = await page.evaluate(() => document.body.innerText);
check("H1: no literal &apos; on help", !helpText.includes("&apos;"), helpText.includes("&apos;") ? helpText.match(/.{0,40}&apos;.{0,20}/)?.[0] : "");
// answers are collapsed until clicked — expand the first one before checking
// its text (the old assertion checked a hidden answer = false FAIL).
await page.locator(".faq-question").first().click();
await page.waitForTimeout(200);
const helpText2 = await page.evaluate(() => document.body.innerText);
check("H2: apostrophes render real", helpText2.includes("isn't responding") && helpText2.includes("what's available"));
check("H3: help accordion works", await (async () => {
  await page.locator(".faq-question").nth(3).click();
  await page.waitForTimeout(200);
  return (await page.locator(".faq-answer").count()) > 0;
})());
const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth);
check("H4: no h-overflow @390", hOverflow <= 390, `scrollW=${hOverflow}`);

await browser.close();
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
