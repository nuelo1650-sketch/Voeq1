import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

// Intercept API calls
const apiCalls: string[] = [];
p.on("response", (r) => {
  if (r.url().includes("/api/explore")) apiCalls.push(`${r.status()} ${r.url()}`);
});

await p.goto("http://localhost:3031/explore?next=old", { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(2000);

// Get initial cards count
const initialCards = await p.locator(".voeq-grid .card").count();

// Type in search
const input = p.locator("input[type='search']");
await input.fill("a");
await p.waitForTimeout(1500);

const afterCards = await p.locator(".voeq-grid .card").count();

console.log("initialCards:", initialCards);
console.log("afterCards:", afterCards);
console.log("apiCalls:", apiCalls.length);
apiCalls.forEach(c => console.log("  ", c));

await b.close();
