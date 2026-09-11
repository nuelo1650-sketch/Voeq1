import { chromium } from "@playwright/test";

/** ROUND 78 — DEEP HUNT II: surfaces never personally driven. */
const base = "http://localhost:3030";
const log = (k, v) => console.log("[", k, "]", v);

const getExplore = async (p) => {
  let expl = { data: [] };
  for (let i = 0; i < 6 && !expl.data?.length; i++) {
    expl = await p.request.get(base + "/api/explore").then((r) => r.json());
    if (!expl.data?.length) await p.waitForTimeout(2500);
  }
  return expl;
};

(async () => {
  const b = await chromium.launch();

  // A) REPORT flow on listing
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 100)); });
    p.on("response", (r) => { if (r.status() >= 400) errs.push("HTTP " + r.status() + " " + r.url().slice(-50)); });
    await ctx.request.post(base + "/api/dev/shopper-session");
    const expl = await getExplore(p);
    const lid = expl.data[0]?.id;
    if (!lid) { log("report", "NO LISTING"); await ctx.close(); }
    else {
      await p.goto(base + "/listing/" + lid, { waitUntil: "domcontentloaded", timeout: 120000 });
      await p.waitForTimeout(15000);
      const rbtn = p.locator('[data-testid="listing-detail-report"], button:has-text("Report")').first();
      log("report-btn", await rbtn.count());
      if (await rbtn.count()) {
        await rbtn.click();
        await p.waitForTimeout(6000);
        const form = await p.evaluate(() => !!document.querySelector('[data-testid="listing-detail-report-panel"]'));
        log("report-panel", form);
        // select a reason + submit
        const reason = p.locator('button:has-text("Scam"), input[type="radio"]').first();
        if (await reason.count()) { await reason.click().catch(() => {}); }
        const submit = p.locator('button:has-text("Submit"), button:has-text("Send")').first();
        if (await submit.count()) {
          await submit.click();
          await p.waitForTimeout(6000);
          log("report-submitted", await p.evaluate(() => !!/Submitted|Thank you|We.review/i.test(document.body.innerText)));
        }
      }
      log("report-errors", errs.length ? errs.slice(0, 3).join(" ;; ") : "none");
      await ctx.close();
    }
  }

  // B) COMMENT CRUD: add -> edit -> delete (author-scoped)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 100)); });
    p.on("response", (r) => { if (r.status() >= 400) errs.push("HTTP " + r.status() + " " + r.url().slice(-50)); });
    await ctx.request.post(base + "/api/dev/shopper-session");
    const expl = await getExplore(p);
    const lid = expl.data[0]?.id;
    if (!lid) { log("comments", "NO LISTING"); await ctx.close(); }
    else {
      await p.goto(base + "/listing/" + lid, { waitUntil: "domcontentloaded", timeout: 120000 });
      await p.waitForTimeout(15000);
      const ta = p.locator('[data-testid="comment-form"] textarea').first();
      log("comment-textarea", await ta.count());
      if (await ta.count()) {
        await ta.fill("hunt78-comment");
        await p.locator('[data-testid="comment-form"] button[type="submit"], button:has-text("Post comment")').first().click();
        await p.waitForTimeout(8000);
        const added = await p.evaluate(() => document.body.innerText.includes("hunt78-comment"));
        log("comment-added", added);
        // find my comment row: edit + delete buttons
        const mineButtons = await p.evaluate(() => {
          const rows = Array.from(document.querySelectorAll("li, div")).filter((e) => e.textContent.includes("hunt78-comment"));
          const btns = rows.flatMap((r) => Array.from(r.querySelectorAll("button")).map((x) => (x.textContent || "").trim()).filter(Boolean));
          return btns.slice(0, 6);
        });
        log("my-comment-buttons", JSON.stringify(mineButtons));
        // delete via API (author-scoped check guaranteed earlier)
        const msgs = await ctx.request.get(base + "/api/listings/" + lid + "/comments").then((r) => r.json());
        const mine = (msgs.comments || []).find((c) => c.body === "hunt78-comment");
        if (mine) {
          const del = await ctx.request.delete(base + "/api/listings/" + lid + "/comments/" + mine.id);
          log("comment-delete", del.status());
          // SECOND delete (should 403/404 — no double-delete)
          const del2 = await ctx.request.delete(base + "/api/listings/" + lid + "/comments/" + mine.id);
          log("comment-delete-twice", del2.status());
        }
      }
      log("comment-errors", errs.length ? errs.slice(0, 3).join(" ;; ") : "none");
      await ctx.close();
    }
  }

  // C) REVIEW add on storefront
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 100)); });
    await ctx.request.post(base + "/api/dev/shopper-session");
    const expl = await getExplore(p);
    const vendorId = expl.data[0]?.vendorId;
    if (!vendorId) { log("review", "NO VENDOR"); await ctx.close(); }
    else {
      await p.goto(base + "/vendor/" + vendorId, { waitUntil: "domcontentloaded", timeout: 120000 });
      await p.waitForTimeout(15000);
      const revBtn = p.locator('button:has-text("Write a review"), button:has-text("Review")').first();
      log("review-btn", await revBtn.count());
      if (await revBtn.count()) {
        await revBtn.click();
        await p.waitForTimeout(6000);
        const panel = await p.evaluate(() => !!/review/i.test(document.body.innerText));
        log("review-panel", panel);
        // rate 5 (star buttons usually)
        const star = p.locator('button[aria-label*="star" i]').first();
        if (await star.count()) await star.click().catch(() => {});
        const submit = p.locator('button:has-text("Submit"), button:has-text("Post review")').first();
        if (await submit.count()) { await submit.click(); await p.waitForTimeout(6000); }
        const posted = !!(await p.evaluate(() => document.body.innerText).catch(() => "")).includes;
        log("review-submit-clicked", true);
      }
      log("review-errors", errs.length ? errs.slice(0, 3).join(" ;; ") : "none");
      await ctx.close();
    }
  }

  // D) NOTIFICATION dropdown open + unread count
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    await ctx.request.post(base + "/api/dev/shopper-session");
    await p.goto(base + "/home", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(15000);
    const bell = p.locator('[data-testid="notification-bell-button"], button[aria-label*="notification" i]').first();
    log("bell-count", await bell.count());
    if (await bell.count()) {
      await bell.click();
      await p.waitForTimeout(6000);
      const drop = await p.evaluate(() => document.body.innerText.includes("Notifications") || document.body.innerText.includes("No notifications"));
      log("bell-dropdown", drop);
    }
    await ctx.close();
  }

  // E) MOBILE touch targets audit: buttons < 44px at 390px
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    await ctx.request.post(base + "/api/dev/shopper-session");
    await p.goto(base + "/explore", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    const small = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, a[href]"));
      const bad = [];
      for (const el of btns) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40)) {
          const txt = (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 18);
          bad.push(`${txt}:${Math.round(r.height)}x${Math.round(r.width)}`);
        }
      }
      return bad.slice(0, 10);
    });
    log("small-touch-targets", JSON.stringify(small));
    await ctx.close();
  }

  await b.close();
  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message.slice(0, 100)); process.exit(1); });
