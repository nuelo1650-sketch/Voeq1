import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errors: string[] = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });

await p.goto("http://localhost:3031/explore?next=old", { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(2500);

const topbar = await p.locator(".voeq-topbar").count();
const topbarSearch = await p.locator(".voeq-topbar-search").count();
const backArrow = await p.locator("button[aria-label=\"Back\"]").count();
const hamburger = await p.locator("button[aria-label=\"Open menu\"]").count();
const signinBtn = await p.locator("text=Sign in").count();
const getStartedBtn = await p.locator("text=Get started").count();
const pills = await p.locator("[data-testid*=\"pill\"], .voeq-pill").count();
const sortChips = await p.locator("text=Most popular").count();
const cards = await p.locator(".voeq-grid .card").count();
const filterBtn = await p.getByText("Filters").count();

console.log("topbar:", topbar);
console.log("topbarSearch:", topbarSearch);
console.log("backArrow:", backArrow);
console.log("hamburger:", hamburger);
console.log("signinBtn:", signinBtn);
console.log("getStartedBtn:", getStartedBtn);
console.log("pills:", pills);
console.log("sortChips:", sortChips);
console.log("cards:", cards);
console.log("filterBtn:", filterBtn);
console.log("errors:", errors.length);

await b.close();
