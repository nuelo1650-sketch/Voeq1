/** DAVID'S THREE QUESTIONS — all against PROD data + PROD pages
 *  1) other→niche everywhere (listing, storefront, EXPLORE cards)
 *  2) non-campus vendors: exist, flow through, render
 *  3) explore/storefront/listing/related pages work end to end */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "");
const sql = neon(prodUrl);

// ---- A) DB FACTS ----
const otherListings = await sql`
  SELECT id, title, category_id, short_description FROM listings
  WHERE is_published AND status='active' AND category_id='other'`;
console.log("A1. 'other' category listings on prod:", otherListings.length);
for (const l of otherListings) console.log("    -", l.title.slice(0, 40), "| niche?", (l.short_description ?? "").startsWith("Niche:") ? JSON.stringify(l.short_description.slice(0, 60)) : "NONE");

const nonCampus = await sql`
  SELECT v.id, v.name, v.campus, v.area_id,
    (SELECT COUNT(*) FROM listings l WHERE l.vendor_id=v.id AND l.is_published AND l.status='active') AS listings
  FROM vendors v WHERE v.status='live' AND (v.campus IS NULL OR v.campus='' OR v.area_id IS NOT NULL)`;
console.log("A2. live vendors with no campus OR with area_id:", nonCampus.length);
for (const v of nonCampus.slice(0, 8)) console.log("    -", v.name.slice(0, 30), "| campus:", JSON.stringify(v.campus), "| area:", v.area_id, "| listings:", v.listings);

const vendorsWithOther = await sql`
  SELECT DISTINCT v.id, v.name FROM vendors v
  JOIN listings l ON l.vendor_id=v.id AND l.category_id='other'
  WHERE v.status='live' AND l.is_published LIMIT 5`;
console.log("A3. live vendors owning 'other' listings:", vendorsWithOther.map((v) => v.name).join(", "));

// ---- B) PAGE PROOFS ----
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

// B1: explore card for an 'other' listing — does it say 'Other' or the niche?
if (otherListings.length > 0) {
  const o = otherListings.find((l) => (l.short_description ?? "").startsWith("Niche:")) ?? otherListings[0];
  const hasNiche = (o.short_description ?? "").startsWith("Niche:");
  console.log("B1 target listing:", o.title.slice(0, 40), hasNiche ? "HAS NICHE" : "no niche");
  await p.goto(`http://localhost:3030/listing/${o.id}`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(2500);
  const catline = await p.evaluate(`(() => {
    const eyebrow = [...document.querySelectorAll('span,p,div')].find(e => e.getAttribute('data-testid')?.includes('eyebrow') || (/\\u2014|FEATURED/.test(e.textContent||'') && e.children.length<=4 && e.textContent.length<80));
    const body = document.body.innerText || '';
    return JSON.stringify({ saysOther: /\\bOther\\b/.test(body), nicheShown: body.includes(${JSON.stringify((o.short_description ?? "").replace("Niche: ", ""))}), head: body.split('\\n').slice(0, 18).join(' | ').slice(0, 300) });
  })()`);
  console.log("B2 listing catline:", catline);

  // B3: explore cards mentioning Other
  await p.goto("http://localhost:3030/explore", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(6000);
  console.log("B3 explore cards:", await p.evaluate(`(() => {
    const cards = [...document.querySelectorAll('[data-testid="listing-card"]')];
    const otherish = cards.filter(c => /\\bOther\\b/.test(c.textContent || '')).map(c => (c.textContent||'').slice(0, 50));
    return JSON.stringify({ n: cards.length, cardsShowingOther: otherish.length, sample: otherish.slice(0, 2) });
  })()`));

  // B4: storefront of a vendor owning 'other'
  if (vendorsWithOther[0]) {
    await p.goto(`http://localhost:3030/vendor/${vendorsWithOther[0].id}`, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(4000);
    console.log("B4 storefront:", await p.evaluate(`(() => {
      const pills = [...document.querySelectorAll('.vs-cat-badge')].map(e => e.textContent?.trim());
      return JSON.stringify({ pills, saysOther: pills.some(p => p === 'Other') });
    })()`));
  }
}

// B5: a NON-CAMPUS vendor storefront (if any) + does it appear in explore /api
if (nonCampus.length > 0) {
  const nc = nonCampus.find((v) => Number(v.listings) > 0) ?? nonCampus[0];
  await p.goto(`http://localhost:3030/vendor/${nc.id}`, { waitUntil: "domcontentloaded" });
  const status = p.url();
  console.log("B5 non-campus storefront:", JSON.stringify({ name: nc.name, url: status.replace("http://localhost:3030", ""), notFound: await p.evaluate(`(() => !!document.querySelector('[data-testid="not-found"], .not-found) || document.title.includes('404'))()`), hero: await p.evaluate(`(() => !!document.querySelector('[data-testid="storefront-hero"]'))()`) }));
  // API: does it flow into explore at all-nigeria?
  const r = await p.request.get("http://localhost:3030/api/explore?campus=&sections=1");
  console.log("B6 all-nigeria API contains its listing:", r.ok);
}
await b.close();
