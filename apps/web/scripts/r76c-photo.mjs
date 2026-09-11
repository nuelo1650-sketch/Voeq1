import { chromium } from "@playwright/test";
import fs from "fs";

/** ROUND 76c — PHOTO UPLOAD isolation (real label click → filechooser) + messaging logs retained. */
const base = "http://localhost:3030";
const log = (k, v) => console.log("[", k, "]", v);

(async () => {
  const b = await chromium.launch();

  // MESSAGING roundtrip (quick)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 110)); });
    p.on("response", (r) => { if (r.status() >= 400) errs.push("HTTP " + r.status() + " " + r.url().slice(-55)); });
    await ctx.request.post(base + "/api/dev/shopper-session");
    let expl = { data: [] };
    for (let i = 0; i < 6 && !expl.data?.length; i++) {
      expl = await ctx.request.get(base + "/api/explore").then((r) => r.json());
      if (!expl.data?.length) await p.waitForTimeout(3000);
    }
    if (expl.data?.length) {
      const lid = expl.data[0].id;
      await p.goto(base + "/listing/" + lid, { waitUntil: "domcontentloaded", timeout: 120000 });
      await p.waitForTimeout(15000);
      const msgBtn = p.locator('button:has-text("Message")').first();
      if (await msgBtn.count()) {
        await msgBtn.click();
        await p.waitForTimeout(8000);
        log("contact-url", p.url().slice(0, 60));
        log("composer", await p.evaluate(() => !!document.querySelector("textarea") || !!document.querySelector("[contenteditable]")));
        log("sse", await p.evaluate(() => /Connected|Connecting/.test(document.body.innerText)));
      }
    }
    log("msg-errors", errs.length ? errs.slice(0, 4).join(" ;; ") : "none");
    await ctx.close();
  }

  // PHOTO: real label click path (the label wraps the input; clicking it opens chooser)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 110)); });
    p.on("response", (r) => { if (r.status() >= 400) errs.push("HTTP " + r.status() + " " + r.url().slice(-55)); });
    await ctx.request.post(base + "/api/dev/vendor-session", { data: { vendorId: "3647302d-a59a-404d-aa45-8d0f33eff748" } });
    await p.goto(base + "/vendor/storefront", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(15000);
    const jpg = await p.request.get("https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo/jollof-bowl.jpg");
    fs.writeFileSync("C:/Users/Legacy/Documents/voeq/apps/web/tmp-photo.jpg", await jpg.body());

    // find the label containing "Click to upload photo"
    const label = p.locator('label:has-text("Click to upload photo"), label:has-text("Upload new")').first();
    const chooserPromise = p.waitForEvent("filechooser", { timeout: 20000 });
    await label.click();
    const chooser = await chooserPromise;
    await chooser.setFiles("C:/Users/Legacy/Documents/voeq/apps/web/tmp-photo.jpg");
    log("file-chosen", true);
    await p.waitForTimeout(25000);
    const after = await p.evaluate(() => {
      const alertEl = document.querySelector('[role="alert"]');
      const imgs = Array.from(document.querySelectorAll("img")).map((i) => (i.getAttribute("src") || "").slice(0, 90));
      return { alert: alertEl?.textContent?.slice(0, 90) ?? null, imgs: imgs.filter((s) => s.includes("voeq/")).slice(0, 3) };
    });
    log("after-upload", JSON.stringify(after));
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(15000);
    const persist = await p.evaluate(() => Array.from(document.querySelectorAll("img")).map((i) => (i.getAttribute("src") || "").slice(0, 90)).filter((s) => s.includes("voeq/") && s.includes("v1788")));
    log("persist-after-refresh", JSON.stringify(persist.slice(0, 3)));
    log("photo-errors", errs.length ? errs.slice(0, 4).join(" ;; ") : "none");
    await ctx.close();
  }

  await b.close();
  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message.slice(0, 120)); process.exit(1); });
