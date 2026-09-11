import { chromium } from "@playwright/test";

/** MANUAL DOUBLE-CHECK (round 76) — fresh evidence, no subagents. */
const base = "http://localhost:3030";
const out = [];
const log = (k, v) => { out.push([k, v]); console.log("[", k, "]", v); };

(async () => {
  const b = await chromium.launch();

  // ── SHOPPER: login page (round-67 auth redesign intact?) ──
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 100)); });
    await p.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(8000);
    const r = await p.evaluate(() => {
      const text = document.body.innerText;
      const btns = Array.from(document.querySelectorAll("button")).map((x) => (x.textContent || "").trim().slice(0, 26));
      return {
        googleFirst: text.indexOf("Continue with Google") !== -1 && text.indexOf("Continue with Google") < text.indexOf("Sign in"),
        consentCheckboxGone: !/\bI agree to the (Terms|Privacy)\b/i.test(text),
        turnstile: /Protect/.test(text) || /Cloudflare/.test(text) || /I'm not a robot/.test(text) || /Verify/.test(text),
        buttons: btns.slice(0, 6),
      };
    });
    log("login", JSON.stringify(r));
    log("login-errors", errs.length ? errs.slice(0, 3).join(" ;; ") : "none");
    await ctx.close();
  }

  // ── VENDOR: dashboard + listings + analytics + storefront ──
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("console", (m) => { if (m.type() === "error" && !/NaN/.test(m.text())) errs.push(m.text().slice(0, 110)); });
    await ctx.request.post(base + "/api/dev/vendor-session", { data: { vendorId: "3647302d-a59a-404d-aa45-8d0f33eff748" } });

    await p.goto(base + "/vendor/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    let r = await p.evaluate(() => ({
      weeklyLinks: document.querySelectorAll('[data-testid="vendor-weekly"] a[href="/vendor/analytics"]').length,
      pills: Array.from(document.querySelectorAll("[data-testid^='pill-']")).map((e) => e.textContent).slice(0, 5),
      quick: !!document.querySelector('[data-testid="vendor-dashboard-client"]'),
    }));
    log("vendor-dashboard", JSON.stringify(r));

    await p.goto(base + "/vendor/listings", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    r = await p.evaluate(() => ({
      rows: document.querySelectorAll("[data-testid^='listing-row-']").length,
      nestedA: document.querySelectorAll("a a").length,
      banner: !!document.querySelector('[data-testid="listings-golive-banner"]'),
      preview: !!document.querySelector('[data-testid="listings-preview-card"]'),
    }));
    log("vendor-listings", JSON.stringify(r));

    await p.goto(base + "/vendor/analytics", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(10000);
    r = await p.evaluate(() => ({ hasViews: document.body.innerText.includes("Views (7d)"), hasMsg: document.body.innerText.includes("Messages") }));
    log("vendor-analytics", JSON.stringify(r));
    log("vendor-errors", errs.length ? errs.slice(0, 3).join(" ;; ") : "none");
    await ctx.close();
  }

  // ── AUTH BOUNDARY re-check (round 75 harness fix + routes) ──
  {
    const anon = await b.newContext();
    const shop = await b.newContext();
    const ven = await b.newContext();
    await shop.request.post(base + "/api/dev/shopper-session");
    await ven.request.post(base + "/api/dev/vendor-session", { data: { vendorId: "3647302d-a59a-404d-aa45-8d0f33eff748" } });
    const code = async (c, path) => { try { return (await c.request.get(base + path)).status(); } catch { return "ERR"; } };
    log("boundary-vendor-analytics", `anon=${await code(anon, "/api/vendor/analytics")} shopper=${await code(shop, "/api/vendor/analytics")} vendor=${await code(ven, "/api/vendor/analytics")}`);
    log("boundary-vendor-weekly", `anon=${await code(anon, "/api/vendor/weekly")} shopper=${await code(shop, "/api/vendor/weekly")} vendor=${await code(ven, "/api/vendor/weekly")}`);
    log("boundary-staff", `shopper=${await code(shop, "/api/staff/analytics")} vendor=${await code(ven, "/api/staff/analytics")}`);
    // shopper should be pure now (harness fix)
    const shopBody = await shop.request.get(base + "/api/vendor/analytics");
    log("shopper-vendor-analytics-body", shopBody.status() + " " + (await shopBody.text()).slice(0, 80));
    await anon.close(); await shop.close(); await ven.close();
  }

  await b.close();
  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
