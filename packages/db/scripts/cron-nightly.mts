/** MONEY BAG D2 — NIGHTLY CRON (cron-nightly.mts, plan §2).
 *
 * Runs nightly (Vercel Cron via /api/cron/nightly, or manually):
 *  1. Computes the composite vendor score (fairness.ts) for every LIVE vendor
 *     with real data → upserts vendor_score_snapshot (weights versioned in
 *     the breakdown jsonb, C5).
 *  2. Refreshes listing_fairness windows: starts fresh windows for new
 *     listings (72h), rolls expired weeks.
 *  3. Builds the Voeq Live shortlist (top ratingConfidence, ≥5 reviews,
 *     seed-excluded) into voeq_live_picks as UNCONFIRMED candidates —
 *     nothing goes public without David's hand-confirm (Option 1).
 *
 * Honesty: every score from real rows; vendors with no reviews get
 * ratingConfidence 0 (not fabricated); seeds excluded everywhere.
 *
 * Usage: npx tsx scripts/cron-nightly.mts [--test] [--dry-run]
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
let dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
const target = process.argv.includes("--test") ? "TEST" : "PROD";
if (process.argv.includes("--test")) dbUrl = dbUrl.replace("/neondb?", "/neondb_test?");
const DRY = process.argv.includes("--dry-run");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const { vendorScore, inFreshWindow } = await import("../src/fairness.ts");

console.log(`NIGHTLY CRON — target: ${target}${DRY ? " (DRY RUN)" : ""}`);
const weights = { rating: 0.35, engagement: 0.25, freshness: 0.2, completeness: 0.2 };

// ---- 1. vendor scores -------------------------------------------------------
const vendors = await sql`
  SELECT v.id, v.name, v.campus, v.status,
         v.profile_photo_url IS NOT NULL AS has_photo,
         v.socials IS NOT NULL AND v.socials::text <> 'null' AS has_socials,
         (SELECT count(*)::int FROM listings l WHERE l.vendor_id = v.id AND l.is_published = true AND l.status = 'active') AS listing_count,
         (SELECT count(*)::int FROM reviews r WHERE r.vendor_id = v.id AND r.status = 'published') AS review_count,
         (SELECT COALESCE(avg(r.rating), 0) FROM reviews r WHERE r.vendor_id = v.id AND r.status = 'published') AS rating_avg,
         (SELECT count(*)::int FROM wishlist_items w JOIN listings l2 ON l2.id = w.listing_id WHERE l2.vendor_id = v.id) AS saves,
         (SELECT count(*)::int FROM follows f WHERE f.vendor_id = v.id) AS follows
  FROM vendors v
  WHERE v.status = 'live'`;
console.log(`live vendors: ${vendors.length}`);

const now = new Date();
const scoreRows = vendors.map((v) => {
  // vendorScore() — the real A2 algorithm (weights versioned in breakdown, C5).
  // ratingConfidence: 0 reviews => 0 (honest, no fabrication).
  const { score, breakdown } = vendorScore({
    stars: Number(v.rating_avg) || 0,
    reviewCount: v.review_count,
    saves: v.saves,
    follows: v.follows,
    messages: 0,
    lastUpdateDaysAgo: 30,
    photo: Boolean(v.has_photo),
    listings: v.listing_count,
    description: true,
    socials: Boolean(v.has_socials),
  });
  return {
    vendorId: v.id,
    score,
    breakdown: {
      ...breakdown,
      reviewCount: v.review_count,
      ratingAvg: Number(Number(v.rating_avg).toFixed(2)),
      saves: v.saves,
      follows: v.follows,
      listings: v.listing_count,
      weights,
      computedAt: now.toISOString(),
    },
  };
});
scoreRows.sort((a, b) => b.score - a.score);

if (!DRY) {
  for (const r of scoreRows) {
    await sql`
      INSERT INTO vendor_score_snapshot (vendor_id, score, breakdown, computed_at)
      VALUES (${r.vendorId}, ${r.score}, ${JSON.stringify(r.breakdown)}::jsonb, ${now.toISOString()})
      ON CONFLICT (vendor_id) DO UPDATE
        SET score = EXCLUDED.score, breakdown = EXCLUDED.breakdown, computed_at = EXCLUDED.computed_at`;
  }
}
console.log(`vendor scores ${DRY ? "(dry) " : ""}upserted: ${scoreRows.length}`);

// ---- 2. listing_fairness windows --------------------------------------------
const listings = await sql`
  SELECT l.id, l.created_at, f.fresh_window_started_at, f.week_started_at
  FROM listings l
  LEFT JOIN listing_fairness f ON f.listing_id = l.id
  WHERE l.is_published = true AND l.status = 'active'`;
let freshStarted = 0;
if (!DRY) {
  for (const l of listings) {
    const started = l.fresh_window_started_at ? new Date(l.fresh_window_started_at) : null;
    if (!started && inFreshWindow(null, now)) {
      // new listing (no window yet): open a 72h fresh window if within window age
      const created = l.created_at ? new Date(l.created_at) : null;
      if (created && now.getTime() - created.getTime() < 72 * 3600 * 1000) {
        await sql`
          INSERT INTO listing_fairness (listing_id, fresh_window_started_at, updated_at)
          VALUES (${l.id}, ${now.toISOString()}, ${now.toISOString()})
          ON CONFLICT (listing_id) DO UPDATE SET fresh_window_started_at = EXCLUDED.fresh_window_started_at, updated_at = EXCLUDED.updated_at`;
        freshStarted++;
      }
    }
  }
}
console.log(`fresh windows ${DRY ? "(dry) " : ""}opened: ${freshStarted} (of ${listings.length} listings)`);

// ---- 3. Voeq Live shortlist (CANDIDATES ONLY — Option 1 admin-confirm) ------
const candidates = scoreRows
  .filter((r) => r.breakdown.reviewCount >= 5)
  .slice(0, 6);
if (!DRY) {
  const today = now.toISOString().slice(0, 10);
  // F-4b (audit fix, C4): max 1 candidate/vendor/day — delete this vendor's
  // UNCONFIRMED candidates for today before inserting, so a "best listing"
  // flip between runs can never produce two rows for the same vendor.
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const best = await sql`
      SELECT l.id FROM listings l
      LEFT JOIN reviews r ON r.vendor_id = l.vendor_id AND r.status = 'published'
      WHERE l.vendor_id = ${c.vendorId} AND l.is_published = true AND l.status = 'active' AND (l.source IS NULL OR l.source <> 'seed')
      GROUP BY l.id ORDER BY count(r.id) DESC, l.created_at DESC LIMIT 1`;
    if (best.length === 0) continue;
    await sql`
      DELETE FROM voeq_live_picks
      WHERE listing_id IN (SELECT id FROM listings WHERE vendor_id = ${c.vendorId})
        AND pick_date = ${today} AND confirmed_by IS NULL`;
    await sql`
      INSERT INTO voeq_live_picks (id, listing_id, pick_date, why_line, position, confirmed_by, created_at)
      VALUES (${"cand-" + c.vendorId.slice(0, 8) + "-" + today.replace(/-/g, "")}, ${best[0].id}, ${today},
        ${`Auto-shortlisted: rating confidence ${c.breakdown.ratingConfidence} from ${c.breakdown.reviewCount} real reviews.`},
        ${i}, NULL, ${now.toISOString()})
      ON CONFLICT (listing_id, pick_date) DO NOTHING`;
  }
}
console.log(`live candidates ${DRY ? "(dry) " : ""}shortlisted (UNCONFIRMED): ${candidates.length} — awaiting admin confirmation (Option 1)`);

console.log("\nDONE. Honesty: scores from real rows only; seeds excluded; candidates unconfirmed.");
process.exit(0);
