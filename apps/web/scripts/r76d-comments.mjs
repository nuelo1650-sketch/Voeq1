import { chromium } from "@playwright/test";

/** ROUND 76d — comments CRUD + review + category filter + storefront verification visual. */
const base = "http://localhost:3030";
const log = (k, v) => console.log("[", k, "]", v);

(async () => {
  const b = await chromium.launch();

  // A) CATEGORY filter REAL result
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    await ctx.request.post(base + "/api/dev/shopper-session");
    await p.goto(base + "/explore", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    const cnt = () => p.evaluate(() => document.querySelectorAll('[data-testid="explore-card-link"]').length);
    const all = await cnt();
    const beauty = p.locator('button:has-text("Beauty & Care"), button[data-testid="btn-beauty-care"]').first();
    if (await beauty.count()) {
      await beauty.click();
      await p.waitForTimeout(8000);
      log("beauty-filter", `all=${all} beauty=${await cnt()}`);
      // then search a vendor name with category active
      await p.fill('[data-testid="explore-search"]', "Glam");
      await p.press('[data-testid="explore-search"]', "Enter");
      await p.waitForTimeout(8000);
      log("beauty+search-glam", await cnt());
    } else { log("beauty-chip", "NOT FOUND"); }
    await ctx.close();
  }

  // B) COMMENTS add + see + self-edit + self-delete (author-scoped)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 100)); });
    await ctx.request.post(base + "/api/dev/shopper-session");
    let expl = { data: [] };
    for (let i = 0; i < 6 && !expl.data?.length; i++) {
      expl = await ctx.request.get(base + "/api/explore").then((r) => r.json());
      if (!expl.data?.length) await p.waitForTimeout(3000);
    }
    const lid = expl.data[0].id;
    await p.goto(base + "/listing/" + lid, { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(15000);
    // add comment
    const ta = p.locator('textarea, [contenteditable]').last();
    const hasInput = await ta.count();
    log("comment-input", hasInput);
    if (hasInput) {
      await ta.fill("hunt-test comment");
      await p.locator('button:has-text("Post comment")').first().click().catch(() => {});
      await p.waitForTimeout(8000);
      const hasMine = await p.evaluate(() => document.body.innerText.includes("hunt-test comment"));
      log("comment-added", hasMine);
      // edit/delete buttons?
      const editBtn = await p.evaluate(() => document.querySelector('[data-testid*="edit"], button:has-text("Edit")') ? "yes" : "no");
      log("comment-edit-visible", editBtn);
      // cleanup via API
      const msgs = await ctx.request.get(base + "/api/listings/" + lid + "/comments").then((r) => r.json());
      const mine = (msgs.comments || []).find((c) => c.body === "hunt-test comment");
      if (mine) {
        const del = await ctx.request.delete(base + "/api/listings/" + lid + "/comments/" + mine.id);
        log("comment-delete-api", del.status());
      }
    }
    log("comment-errors", errs.length ? errs.slice(0, 3).join(" ;; ") : "none");
    await ctx.close();
  }

  // C) STOREFRONT VERIFICATION section VISUAL (the 'ugly tool icon'?)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    await ctx.request.post(base + "/api/dev/vendor-session", { data: { vendorId: "3647302d-a59a-404d-aa45-8d0f33eff748" } });
    await p.goto(base + "/vendor/storefront", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(15000);
    await p.screenshot({ path: "scripts/shots/storefront-verification.png", fullPage: true });
    const ver = await p.evaluate(() => {
      const t = document.body.innerText;
      return { hasVerification: /Verification status/.test(t), hasRequestBtn: /Request verification/.test(t) };
    });
    log("verification-ui", JSON.stringify(ver));
    await ctx.close();
  }

  await b.close();
  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message.slice(0, 100)); process.exit(1); });
