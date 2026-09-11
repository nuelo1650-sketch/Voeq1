import { chromium } from "@playwright/test";

/**
 * A→Z AUDIT (round 74) — first-hand, no subagent.
 * Part 1: HTTP auth-boundary matrix (anon/shopper/vendor/admin × sensitive endpoints).
 * Part 2: Browser crawl — shopper journey + vendor journey + admin surface.
 * Every finding printed with real evidence (status codes / DOM facts / console errors).
 */
const base = "http://localhost:3030";
const VENDOR_ID = "3647302d-a59a-404d-aa45-8d0f33eff748";

const results = [];
const log = (k, v) => { results.push({ k, v }); console.log("[" + k + "]", v); };

async function session(role) {
  const ctx = await (await import("@playwright/test")).chromium.launch().then((b) => b.newContext({ viewport: { width: 390, height: 844 }, isMobile: role !== "admin" }));
  const b = ctx.browser();
  const r = await ctx.request.post(base + "/api/dev/" + role + "-session", role === "vendor" ? { data: { vendorId: VENDOR_ID } } : {});
  const j = await r.json().catch(() => ({}));
  return { ctx, b, sessionId: j.sessionId, identityId: j.identityId, role };
}

async function main() {
  // ── PART 1: AUTH BOUNDARIES (no browser; honest HTTP) ──────────────
  const anon = await (await import("@playwright/test")).chromium.launch().then((b) => b.newContext());
  const shopper = await session("shopper");
  const vendor = await session("vendor");
  const admin = await session("admin");

  const GET = async (ctx, path) => {
    try { return (await ctx.request.get(base + path)).status(); } catch { return "ERR"; }
  };
  const POST = async (ctx, path, body) => {
    try { return (await ctx.request.post(base + path, { data: body ?? {} })).status(); } catch { return "ERR"; }
  };

  const sensitive = ["/api/vendor/analytics", "/api/vendor/weekly", "/api/home", "/api/conversations", "/api/notifications", "/api/vendor/photo"];
  console.log("=== AUTH BOUNDARY MATRIX (anon | shopper | vendor) ===");
  for (const p of sensitive) {
    const a = await GET(anon, p);
    const s = await GET(shopper.ctx, p);
    const v = await GET(vendor.ctx, p);
    log("boundary", `${p}: anon=${a} shopper=${s} vendor=${v}`);
  }

  // Vendor endpoints with OTHER vendor id (IDOR probe): shopper requests vendor A data
  console.log("=== IDOR / OWNERSHIP ===");
  const shopToAnalytics = await GET(shopper.ctx, "/api/vendor/analytics");
  log("idor", `shopper->vendor/analytics expect 403: got=${shopToAnalytics}`);
  const vendorToStaff = await GET(vendor.ctx, "/api/staff/analytics");
  log("idor", `vendor->staff/team expect 403: got=${vendorToStaff}`);
  const shopToStaff = await GET(shopper.ctx, "/api/staff/analytics");
  log("idor", `shopper->staff/team expect 403: got=${shopToStaff}`);
  const anonToStaff = await GET(anon, "/api/staff/analytics");
  log("idor", `anon->staff/team expect 401/403: got=${anonToStaff}`);

  // Admin reach
  const admToStaff = await GET(admin.ctx, "/api/staff/analytics");
  log("admin", `admin->staff/team expect 200: got=${admToStaff}`);
  const admToVendorP = await POST(admin.ctx, "/api/vendor/photo", { url: "https://res.cloudinary.com/x/y.jpg" });
  log("admin", `admin->vendor/photo POST (no vendorId) expect 403: got=${admToVendorP}`);

  // ── Secrets in client bundle check (build-level) ───────────────────
  console.log("=== CLIENT BUNDLE SECRETS (source grep; .next may not be built) ===");
  const { readFileSync, readdirSync, existsSync, statSync } = await import("fs");
  const { execSync } = await import("child_process");
  try {
    const out = execSync("cd " + "C:/Users/Legacy/Documents/voeq" + " && grep -rl --include='*.ts' --include='*.tsx' -E 'SIGHTENGINE_API_SECRET|CLOUDINARY_API_SECRET|api_secret|SK-[A-Za-z0-9]{20}' apps/web/lib apps/web/components 2>/dev/null | head -5").toString().trim();
    log("secrets-src", out ? "FOUND REFS: " + out : "no secret refs in client src");
  } catch { log("secrets-src", "grep failed (unlikely)"); }

  // XSS probe: post comment with <script> then read back how UI renders (server-side)
  console.log("=== XSS PROBE ===");
  try {
    // find a real listing id
    const expl = await (await GET(anon, "")) && await anon.request.get(base + "/api/explore").then((r) => r.json());
    const listingId = expl?.data?.[0]?.id;
    if (listingId) {
      const res = await shopper.ctx.request.post(base + `/api/listings/${listingId}/comments`, { data: { listingId, body: "<script>alert('xss')</script>" } });
      const j = await res.json().catch(() => ({}));
      log("xss-post", `comment POST status=${res.status()} id=${j.comment?.id ?? j.id ?? "?"}`);
      const msgs = await shopper.ctx.request.get(base + `/api/listings/${listingId}/comments?listingId=${listingId}`).then((r) => r.json());
      const mine = msgs?.comments?.find((c) => c.body?.includes("<script>"));
      if (mine?.body) {
        // URL-encoded? JSON body comes back raw; the UI escaping is what matters, but log the stored shape
        log("xss-stored", `stored body: ${mine.body.slice(0, 60)}`);
        // cleanup
        await shopper.ctx.request.delete(base + `/api/listings/${listingId}/comments/${mine.id}`);
        log("xss-cleanup", "deleted test comment");
      } else {
        log("xss-readback", "no <script> comment found in readback (escaped or missing)");
      }
    } else {
      log("xss-probe", "no listings to probe");
    }
  } catch (e) { log("xss-probe", "ERR " + e.message); }

  // ── PART 2: BROWSER CRAWL ─────────────────────────────────────────
  console.log("=== BROWSER: SHOPPER JOURNEY ===");
  const errors = [];
  const p = await shopper.ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") errors.push("[console] " + m.text().slice(0, 140)); });
  p.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 140)));
  p.on("response", (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url().slice(-70)}`); });

  // explore
  await p.goto(base + "/explore", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(12000);
  let r = await p.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="explore-card-link"]').length;
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    const search = !!document.querySelector('[data-testid="explore-search"]');
    const filters = !!document.querySelector('[data-testid="explore-filters-toggle"]');
    const text = document.body.innerText.slice(0, 120).replace(/\n/g, "|");
    return { cards, overflow, search, filters, text };
  });
  log("explore-load", JSON.stringify(r));

  // search
  if (r.search) {
    await p.fill('[data-testid="explore-search"]', "Box Braids");
    await p.waitForTimeout(6000);
    r = await p.evaluate(() => document.querySelectorAll('[data-testid="explore-card-link"]').length);
    log("explore-search-title", `cards after 'Box Braids': ${r}`);
    await p.fill('[data-testid="explore-search"]', "Glam");
    await p.waitForTimeout(6000);
    r = await p.evaluate(() => document.querySelectorAll('[data-testid="explore-card-link"]').length);
    log("explore-search-vendor", `cards after 'Glam'(vendor name): ${r}`);
    await p.fill('[data-testid="explore-search"]', "");
    await p.waitForTimeout(4000);
  }

  // listing detail: fetch id from explore API
  const expl = await anon.request.get(base + "/api/explore").then((x) => x.json());
  const lid = expl?.data?.[0]?.id;
  if (lid) {
    await p.goto(base + "/listing/" + lid, { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(12000);
    r = await p.evaluate(() => {
      const title = document.querySelector("h1")?.textContent ?? "";
      const saveBtn = !!document.querySelector("[data-testid='save-button'], button[aria-label*='Save' i]");
      const likeBtn = !!document.querySelector("[data-testid='like-button'], button[aria-label*='Like' i]");
      const commTitle = document.body.innerText.includes("Comments");
      const report = !!document.querySelector("[data-testid='report-button'], button[aria-label*='Report' i]");
      return { title: title.slice(0, 40), saveBtn, likeBtn, commTitle, report };
    });
    log("listing-detail", JSON.stringify(r));
  }

  console.log("=== BROWSER: VENDOR JOURNEY ===");
  const vp2 = await vendor.ctx.newPage();
  const verrors = [];
  vp2.on("console", (m) => { if (m.type() === "error") verrors.push("[vconsole] " + m.text().slice(0, 120)); });
  vp2.on("response", (r) => { if (r.status() >= 400) verrors.push(`[vhttp ${r.status()}] ${r.url().slice(-60)}`); });

  await vp2.goto(base + "/vendor/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
  await vp2.waitForTimeout(10000);
  r = await vp2.evaluate(() => {
    const weeklyLinks = document.querySelectorAll('[data-testid="vendor-weekly"] a[href="/vendor/analytics"]').length;
    const pills = Array.from(document.querySelectorAll("[data-testid^='pill-']")).map((e) => e.textContent);
    const quick = !!document.querySelector('[data-testid="vendor-dashboard-client"]');
    return { weeklyLinks, pills, quick };
  });
  log("vendor-dashboard", JSON.stringify(r));

  await vp2.goto(base + "/vendor/listings", { waitUntil: "domcontentloaded", timeout: 120000 });
  await vp2.waitForTimeout(10000);
  r = await vp2.evaluate(() => ({
    rows: document.querySelectorAll("[data-testid^='listing-row-']").length,
    banner: !!document.querySelector('[data-testid="listings-golive-banner"]'),
    preview: !!document.querySelector('[data-testid="listings-preview-card"]'),
    create: !!document.querySelector('[data-testid="listings-create-cta"]'),
  }));
  log("vendor-listings", JSON.stringify(r));

  await vp2.goto(base + "/vendor/analytics", { waitUntil: "domcontentloaded", timeout: 120000 });
  await vp2.waitForTimeout(10000);
  r = await vp2.evaluate(() => {
    const stats = Array.from(document.querySelectorAll("p")).filter((e) => /^\d+$/.test((e.textContent || "").trim())).map((e) => e.textContent.trim());
    return { numericStats: stats.slice(0, 8), hasMsg: document.body.innerText.includes("Views (7d)") };
  });
  log("vendor-analytics", JSON.stringify(r));

  await vp2.goto(base + "/home", { waitUntil: "domcontentloaded", timeout: 120000 });
  await vp2.waitForTimeout(6000);
  log("vendor-home-redirect", vp2.url());

  await vp2.goto(base + "/settings", { waitUntil: "domcontentloaded", timeout: 120000 });
  await vp2.waitForTimeout(6000);
  r = await vp2.evaluate(() => (document.querySelector(".app-shell-bottom")?.textContent ?? "").replace(/\n/g, "|").slice(0, 70));
  log("vendor-settings-nav", r);

  console.log("=== ERRORS ===");
  log("shopper-errors", errors.length ? errors.slice(0, 8).join(" ;; ") : "none");
  log("vendor-errors", verrors.length ? verrors.slice(0, 8).join(" ;; ") : "none");

  await shopper.b.close();
  await vendor.b.close();
  await admin.b.close();
  await anon.browser().close();
  process.exit(0);
}
main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
