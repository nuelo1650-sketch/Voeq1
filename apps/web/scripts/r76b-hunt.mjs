import { chromium } from "@playwright/test";
import fs from "fs";

/** ROUND 76b — DEEP HUNT: the flows never personally driven. */
const base = "http://localhost:3030";
const log = (k, v) => console.log("[", k, "]", v);

(async () => {
  const b = await chromium.launch();

  // 1) MESSAGING full roundtrip: shopper -> contact vendor -> conversation -> send -> read state
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 110)); });
    p.on("response", (r) => { if (r.status() >= 400) errs.push("HTTP " + r.status() + " " + r.url().slice(-55)); });
    await ctx.request.post(base + "/api/dev/shopper-session");
    // get a live vendor id (retry — DB warm-up)
    let expl = { data: [] };
    for (let i = 0; i < 6 && !expl.data?.length; i++) {
      expl = await ctx.request.get(base + "/api/explore").then((r) => r.json());
      if (!expl.data?.length) await p.waitForTimeout(3000);
    }
    if (!expl.data?.length) { log("explore-data", "EMPTY after 6 tries"); await ctx.close(); await b.close(); process.exit(1); }
    const vendorId = expl.data[0].vendorId;
    const listingId = expl.data[0].id;
    // open listing, click Message vendor button
    await p.goto(base + "/listing/" + listingId, { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(15000);
    const msgBtn = p.locator('button:has-text("Message")').first();
    log("msg-btn-count", await msgBtn.count());
    if (await msgBtn.count()) {
      await msgBtn.click();
      await p.waitForTimeout(8000);
      log("after-contact-url", p.url().slice(0, 60));
      // composer present?
      const composer = await p.evaluate(() => !!document.querySelector("textarea") || !!document.querySelector("[contenteditable]"));
      log("composer-present", composer);
      // check SSE status indicator
      const sse = await p.evaluate(() => /Connected|Connecting/.test(document.body.innerText));
      log("sse-status-shown", sse);
    }
    log("messaging-errors", errs.length ? errs.slice(0, 4).join(" ;; ") : "none");
    await ctx.close();
  }

  // 2) EXPLORE filters one by one: category chip, price, sort
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    await ctx.request.post(base + "/api/dev/shopper-session");
    await p.goto(base + "/explore", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    const count = () => p.evaluate(() => document.querySelectorAll('[data-testid="explore-card-link"]').length);
    log("explore-all", await count());
    // category chip: beauty
    const beauty = p.locator('button:has-text("Beauty & Care"), button[data-testid="btn-beauty-care"]').first();
    if (await beauty.count()) { await beauty.click(); await p.waitForTimeout(8000); log("explore-beauty", await count()); }
    // filters panel -> price (guarded: may render a sheet with different inputs)
    try {
      const fbtn = p.locator('button[data-testid="explore-filters-toggle"], button:has-text("Filters")').first();
      if (await fbtn.count()) { await fbtn.click(); await p.waitForTimeout(8000); }
      const inputs = await p.evaluate(() => Array.from(document.querySelectorAll("input")).map((i) => (i.placeholder || i.name || i.type || "?").slice(0, 24)));
      log("filter-inputs", JSON.stringify(inputs.filter((x, i, a) => a.indexOf(x) === i).slice(0, 10)));
    } catch (e) { log("filters-panel", "ERR " + e.message.slice(0, 60)); }
    await ctx.close();
  }

  // 3) VENDOR PROFILE PHOTO upload REAL (filechooser) + PERSIST after refresh
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 110)); });
    await ctx.request.post(base + "/api/dev/vendor-session", { data: { vendorId: "3647302d-a59a-404d-aa45-8d0f33eff748" } });
    await p.goto(base + "/vendor/storefront", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    // download a real jpg
    const jpg = await p.request.get("https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo/jollof-bowl.jpg");
    fs.writeFileSync("C:/Users/Legacy/Documents/voeq/apps/web/tmp-photo.jpg", await jpg.body());
    const chooserPromise = p.waitForEvent("filechooser", { timeout: 20000 });
    // click the photo label/input
    await p.locator('input[type="file"]').first().click().catch(() => {});
    const chooser = await chooserPromise;
    await chooser.setFiles("C:/Users/Legacy/Documents/voeq/apps/web/tmp-photo.jpg");
    log("photo-file-set", true);
    // wait for upload + save + refresh
    await p.waitForTimeout(20000);
    const after = await p.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img")).map((i) => (i.getAttribute("src") || "").slice(0, 90));
      const alertEl = document.querySelector('[role="alert"]');
      return { imgCount: imgs.length, hasNew: imgs.some((s) => s.includes("voeq/") && /v17|q6|pdn|lbj|dj/.test(s)), alert: alertEl?.textContent?.slice(0, 80) ?? null };
    });
    log("photo-upload-state", JSON.stringify(after));
    // PERSIST: reload page, check img still there
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(12000);
    const persist = await p.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img")).map((i) => (i.getAttribute("src") || "").slice(0, 90));
      return imgs.filter((s) => s.includes("voeq/")).slice(0, 3);
    });
    log("photo-persist-after-refresh", JSON.stringify(persist));
    log("photo-errors", errs.length ? errs.slice(0, 4).join(" ;; ") : "none");
    await ctx.close();
  }

  await b.close();
  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
