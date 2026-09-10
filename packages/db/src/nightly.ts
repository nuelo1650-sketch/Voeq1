/**
 * MONEY BAG D2 — the nightly cron core, importable by BOTH the CLI script
 * (packages/db/scripts/cron-nightly.mts) and the Vercel Cron endpoint
 * (apps/web/app/api/cron/nightly/route.ts). One logic source (C5 discipline).
 */
import { neon } from "@neondatabase/serverless";
import { vendorScore, inFreshWindow } from "./fairness";

export interface NightlyCronResult {
  vendors: number;
  scores: number;
  freshWindows: number;
  liveCandidates: number;
  dryRun: boolean;
}

export async function runNightlyCron(opts: { dbUrl?: string; dryRun?: boolean } = {}): Promise<NightlyCronResult> {
  const dbUrl = opts.dbUrl ?? process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const DRY = opts.dryRun ?? false;
  const sql = neon(dbUrl);

  const weights = { rating: 0.35, engagement: 0.25, freshness: 0.2, completeness: 0.2 };

  const vendors = (await sql`
    SELECT v.id, v.name, v.campus, v.status,
           v.profile_photo_url IS NOT NULL AS has_photo,
           v.socials IS NOT NULL AND v.socials::text <> 'null' AS has_socials,
           (SELECT count(*)::int FROM listings l WHERE l.vendor_id = v.id AND l.is_published = true AND l.status = 'active') AS listing_count,
           (SELECT count(*)::int FROM reviews r WHERE r.vendor_id = v.id AND r.status = 'published') AS review_count,
           (SELECT COALESCE(avg(r.rating), 0) FROM reviews r WHERE r.vendor_id = v.id AND r.status = 'published') AS rating_avg,
           (SELECT count(*)::int FROM wishlist_items w JOIN listings l2 ON l2.id = w.listing_id WHERE l2.vendor_id = v.id) AS saves,
           (SELECT count(*)::int FROM follows f WHERE f.vendor_id = v.id) AS follows
    FROM vendors v
    WHERE v.status = 'live'`) as Array<{
    id: string; name: string; campus: string; status: string;
    has_photo: boolean; has_socials: boolean;
    listing_count: number; review_count: number; rating_avg: string | number;
    saves: number; follows: number;
  }>;

  const now = new Date();
  const scoreRows = vendors.map((v) => {
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
      } as {
        [k: string]: unknown;
        reviewCount: number;
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

  const listings = (await sql`
    SELECT l.id, l.created_at, f.fresh_window_started_at
    FROM listings l
    LEFT JOIN listing_fairness f ON f.listing_id = l.id
    WHERE l.is_published = true AND l.status = 'active'`) as Array<{ id: string; created_at: string | null; fresh_window_started_at: string | null }>;

  let freshStarted = 0;
  if (!DRY) {
    for (const l of listings) {
      const started = l.fresh_window_started_at ? new Date(l.fresh_window_started_at) : null;
      if (!started && inFreshWindow(null, now)) {
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

  const candidates = scoreRows.filter((r) => r.breakdown.reviewCount >= 5).slice(0, 6);
  if (!DRY) {
    const today = now.toISOString().slice(0, 10);
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const best = (await sql`
        SELECT l.id FROM listings l
        LEFT JOIN reviews r ON r.vendor_id = l.vendor_id AND r.status = 'published'
        WHERE l.vendor_id = ${c.vendorId} AND l.is_published = true AND l.status = 'active' AND (l.source IS NULL OR l.source <> 'seed')
        GROUP BY l.id ORDER BY count(r.id) DESC, l.created_at DESC LIMIT 1`) as Array<{ id: string }>;
      if (best.length === 0) continue;
      // F-4b: max 1 candidate/vendor/day — purge unconfirmed candidates for
      // this vendor first, then insert (a best-listing flip can't duplicate).
      await sql`
        DELETE FROM voeq_live_picks
        WHERE listing_id IN (SELECT id FROM listings WHERE vendor_id = ${c.vendorId})
          AND pick_date = ${today} AND confirmed_by IS NULL`;
      await sql`
        INSERT INTO voeq_live_picks (id, listing_id, pick_date, why_line, position, confirmed_by, created_at)
        VALUES (${"cand-" + c.vendorId.slice(0, 8) + "-" + today.replace(/-/g, "")}, ${best[0].id}, ${today},
          ${`Auto-shortlisted: rating confidence ${c.breakdown.ratingConfidence as number | undefined} from ${c.breakdown.reviewCount} real reviews.`},
          ${i}, NULL, ${now.toISOString()})
        ON CONFLICT (listing_id, pick_date) DO NOTHING`;
    }
  }

  return {
    vendors: vendors.length,
    scores: DRY ? 0 : scoreRows.length,
    freshWindows: freshStarted,
    liveCandidates: candidates.length,
    dryRun: DRY,
  };
}
