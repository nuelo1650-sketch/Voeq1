/** F-1 verification — JSON-LD escaping with a hostile listing title.
 *  Reuses the rt-seo-jsonld pattern: fixture w/ </script> in the title,
 *  assert the ld+json body contains NO raw '</script' and NO dialog fires.
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

const stamp = Date.now().toString(36);
const iid = "fx1-i-" + stamp, vid = "fx1-v-" + stamp, lid = "fx1-l-" + stamp;
const HOSTILE = '</script><script>window.__xss=1</script>';

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"fx1-" + stamp + "@t.dev"}, 'FX1 Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'FX1 Kitchen</script><script>window.__v=1</script>', ${"fx1v" + stamp}, ${"fx1-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${lid}, ${vid}, ${HOSTILE}, 'probe', 'food', 350000, 350000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, null)`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  let dialogFired = false;
  page.on("dialog", async () => { dialogFired = true; });

  await page.goto(`${BASE}/listing/${lid}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const ldRaw = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? "").join("\n"),
  );
  check("X1: ld+json body contains NO raw '</script' sequence", !ldRaw.includes("</script>"), `len=${ldRaw.length}`);
  check("X2: hostile payload present but ESCAPED (\\u003c form)", ldRaw.includes("\\u003c/script"));
  check("X3: no dialog fired on the listing page", !dialogFired);
  check("X4: injection marker never set", await page.evaluate(() => (window as { __xss?: boolean }).__xss !== true));

  // JSON still parses as valid JSON after escaping
  const parsed = await page.evaluate(() => {
    const el = document.querySelector('script[type="application/ld+json"]:last-of-type');
    if (!el) return null;
    try { return JSON.parse(el.textContent ?? "") as { name?: string }; } catch { return "PARSE_FAIL"; }
  });
  check("X5: escaped JSON-LD still parses as valid JSON", parsed !== null && parsed !== "PARSE_FAIL");
  check("X6: parsed name round-trips the hostile title", (parsed as { name?: string } | null)?.name === HOSTILE);

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE ${"%<script>%"}`,
    sql`DELETE FROM vendors WHERE name LIKE 'FX1 %'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
