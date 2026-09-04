/**
 * Listing integrity — similarity engine (2026-09-05, David-approved design).
 *
 * Answers ONE question: "is this edit still the same thing?"
 * Score 0-100: title word-diff 40% + category 25% + price band 20% +
 * description overlap 15%.
 *
 * Bands (LOCKED with David):
 *   >= 70  same thing        -> applies clean (Tier B still audited)
 *   40-69  different-ish     -> applies + savers notified + staff flag
 *   <  40  different product -> BLOCKED, vendor is told to create new listing
 *
 * Category is Tier C: after a listing has ANY engagement it cannot change
 * category at all (the bait-and-switch vector). Zero-engagement listings may
 * change category once (miscategorization escape hatch).
 * Price is free market: increases are Tier A (audited, never gated).
 */

export interface EngagementSnapshot {
  likes: number; comments: number; saves: number; conversations: number; views: number;
}

export interface SimilarityInput {
  before: { title: string; categoryId: string; priceMinMinor: number; description: string | null };
  after: { title: string; categoryId: string; priceMinMinor: number; description: string | null };
}

export function engagementScore(e: EngagementSnapshot): number {
  return e.likes + e.comments * 2 + e.saves * 3 + e.conversations * 2 + Math.floor(e.views / 50);
}

/** Word-level overlap (Jaccard on lowercase word sets, punctuation-stripped). */
function titleSimilarity(a: string, b: string): number {
  const words = (s: string) => new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean));
  const wa = words(a), wb = words(b);
  if (wa.size === 0 && wb.size === 0) return 1;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = wa.size + wb.size - inter;
  return union === 0 ? 1 : inter / union;
}

function descriptionSimilarity(a: string | null, b: string | null): number {
  const ta = (a ?? "").trim(), tb = (b ?? "").trim();
  if (!ta && !tb) return 1;
  if (!ta || !tb) return 0;
  return titleSimilarity(ta, tb); // same word-overlap, different fields
}

function priceBand(before: number, after: number): number {
  if (before <= 0) return 1;
  const delta = Math.abs(after - before) / before;
  // <=25% swing = same product pricing; >150% = basically a different item
  return delta <= 0.25 ? 1 : delta >= 1.5 ? 0 : 1 - (delta - 0.25) / 1.25;
}

export function similarityScore(input: SimilarityInput): number {
  // Weights calibrated 2026-09-05: same-category/price flips floor at 45 with
  // the old 40/25/20/15 split — a total title+description wipe scored "flagged"
  // instead of "blocked". 50/25/15/10 puts a full in-category identity wipe at
  // 25 (blocked) while a 50% title reword still scores ~75 (applied).
  const title = titleSimilarity(input.before.title, input.after.title);       // 0..1
  const category = input.before.categoryId === input.after.categoryId ? 1 : 0; // 0..1
  const price = priceBand(input.before.priceMinMinor, input.after.priceMinMinor); // 0..1
  const desc = descriptionSimilarity(input.before.description, input.after.description); // 0..1
  return Math.round((title * 0.5 + category * 0.15 + price * 0.1 + desc * 0.25) * 100);
}

export const SIMILARITY = {
  SAME: 70,      // >= 70 applies clean
  DIFFERENT: 40, // < 40 blocked as a different product
} as const;

export type EditAction = "applied" | "flagged" | "blocked";

export function classify(similarity: number): EditAction {
  if (similarity >= SIMILARITY.SAME) return "applied";
  if (similarity >= SIMILARITY.DIFFERENT) return "flagged";
  return "blocked";
}

/**
 * Real engagement counts for a listing — lives here (not the route) so the
 * drizzle types line up inside packages/db. Same sources as the dashboard.
 */
export async function getEngagement(listingId: string): Promise<EngagementSnapshot> {
  const { getDb } = await import("./client");
  const s = await import("./schema");
  const { eq, and } = await import("drizzle-orm");
  const db = getDb();
  const [likeRows, commentRows, saveRows, convRows, viewRows] = await Promise.all([
    db.select().from(s.likes).where(and(eq(s.likes.targetType, "listing"), eq(s.likes.targetId, listingId))),
    db.select().from(s.comments).where(eq(s.comments.listingId, listingId)),
    db.select().from(s.wishlistItems).where(eq(s.wishlistItems.listingId, listingId)),
    db.select().from(s.conversations).where(eq(s.conversations.listingId, listingId)),
    db.select().from(s.pageEvents).where(and(eq(s.pageEvents.type, "listing_view"), eq(s.pageEvents.refId, listingId))),
  ]);
  return {
    likes: likeRows.length,
    comments: commentRows.length,
    saves: saveRows.length,
    conversations: convRows.length,
    views: viewRows.length,
  };
}

/** Savers to notify when a flagged edit lands. */
export async function getSavers(listingId: string): Promise<Array<{ shopperId: string }>> {
  const { getDb } = await import("./client");
  const s = await import("./schema");
  const { eq } = await import("drizzle-orm");
  const rows = await getDb().select({ shopperId: s.wishlistItems.shopperId }).from(s.wishlistItems).where(eq(s.wishlistItems.listingId, listingId));
  return rows;
}
