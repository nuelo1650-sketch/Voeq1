import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = "cd" + Date.now().toString(36);
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const iid = "cd-i-" + stamp, vid = "cd-v-" + stamp;
try {
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${`cd-${stamp}@t.dev`}, 'CD Shopper', 'shopper', 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  const sess = "cd-s-" + stamp;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "sessionId", value: sess, url: "http://localhost:3031" }]);
  const page = await ctx.newPage();
  await page.goto("http://localhost:3031/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
  // direct API shape probe
  const shape = await page.evaluate(async () => {
    const r = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: "nonexistent-vendor-xyz" }) });
    const t = await r.text();
    return { status: r.status, body: t.slice(0, 200) };
  });
  console.log("API shape (nonexistent vendor):", JSON.stringify(shape));
  // now UI: seed vendor + click
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${'cd-vi-' + stamp}, ${`cdv-${stamp}@t.dev`}, 'CD Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${'cd-vi-' + stamp}, 'CD Vendor', ${'cdv' + stamp}, ${'cds' + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', now())`;
  await page.goto(`http://localhost:3031/vendor/${vid}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="storefront-contact-cta"]', { timeout: 30000 });
  await page.waitForTimeout(4000);
  const posts: string[] = [];
  page.on("response", (r) => { if (r.url().includes("/api/conversations")) posts.push(r.request().method() + " " + r.status()); });
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("NAV:", f.url().replace("http://localhost:3031", "") || "(blank)"); });
  console.log("clicking...");
  await page.click('[data-testid="storefront-contact-cta"]');
  await page.waitForTimeout(8000);
  console.log("responses:", posts.join(" | "), "| final URL:", page.url().replace("http://localhost:3031", ""));
  await browser.close();
} finally {
  await sql`DELETE FROM conversations WHERE vendor_id = ${vid}`.catch(() => {});
  await sql`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE vendor_id = ${vid})`.catch(() => {});
  await sql`DELETE FROM listings WHERE vendor_id = ${vid}`.catch(() => {});
  await sql`DELETE FROM sessions WHERE identity_id IN (${iid}, ${"cd-vi-" + stamp})`.catch(() => {});
  await sql`DELETE FROM vendors WHERE id = ${vid}`.catch(() => {});
  await sql`DELETE FROM identities WHERE id IN (${iid}, ${"cd-vi-" + stamp})`.catch(() => {});
}
