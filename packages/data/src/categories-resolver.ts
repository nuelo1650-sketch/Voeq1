/**
 * Category resolution (chips seam, 2026-09-05): merges the static seed
 * taxonomy with the DB `categories` table (config console source of truth).
 *
 * Rules:
 * - DB rows WIN for name/isActive (console rename/deactivate are real).
 * - Seed provides presentation-only color/icon for known slugs; DB-created
 *   categories get neutral defaults (no invented brand colors).
 * - Deactivated (isActive:false) categories are EXCLUDED from the public
 *   taxonomy — Explore chips, search suggestions, vendor pickers.
 * - Falls back to the pure seed when the DB is unreachable (public pages
 *   must never 500 over taxonomy).
 *
 * No in-process cache by design: serverless instances are short-lived, a
 * cached taxonomy would need invalidation wiring across instances (a stale
 * console write is a worse failure class than one 19-row SELECT per view).
 *
 * Import safety: reads @voeq/db via DYNAMIC import. config.ts already
 * statically imports @voeq/db and is re-exported from the same index, so
 * this adds no new client-graph surface — but dynamic keeps it lazy anyway.
 */
import { categories as SEED_CATEGORIES, type Category } from "./explore-view";

export interface ResolvedCategory extends Category {
  /** true for every row surfaced by resolvePublicCategories (the interface
   *  stays assignable to raw Category rows). */
  isActive: boolean;
  /** Where the row came from — seeded display meta vs console-created. */
  source: "seed" | "db";
}

/** Seed-shaped fallback: every seeded category, all active, no DB state. */
function seedFallback(): ResolvedCategory[] {
  return SEED_CATEGORIES.map((c) => ({ ...c, isActive: true, source: "seed" }));
}

/**
 * The public taxonomy: seed ∪ DB, DB rows winning name/isActive, deactivated
 * rows excluded. Never throws — any failure returns the pure seed.
 */
export async function resolvePublicCategories(): Promise<ResolvedCategory[]> {
  try {
    const { realCategoryRepo } = await import("@voeq/db");
    const rows = await realCategoryRepo.list();
    const bySlug = new Map(rows.map((r: any) => [r.slug, r]));
    const merged: ResolvedCategory[] = [];
    // 1) Seeded categories: DB row (if any) wins for name + active state.
    for (const seed of SEED_CATEGORIES) {
      const row = bySlug.get(seed.slug);
      if (row && row.isActive === false) continue; // deactivated on console
      merged.push({
        ...seed,
        name: row?.name ?? seed.name, // console rename wins
        isActive: true,
        source: "seed",
      });
      bySlug.delete(seed.slug);
    }
    // 2) Console-created categories (not in seed): neutral display meta.
    for (const [slug, row] of bySlug) {
      if ((row as any).isActive === false) continue;
      merged.push({
        id: row.id,
        slug,
        name: row.name,
        color: "#888888",
        icon: "tag",
        vendorCount: 0,
        isActive: true,
        source: "db",
      });
    }
    return merged;
  } catch {
    return seedFallback();
  }
}

/**
 * Rebuild the runtime slug→id / id→slug maps from the RESOLVED taxonomy.
 * explore.ts's loadExplore uses these instead of the static
 * CATEGORY_SLUG_TO_ID / CATEGORY_ID_TO_SLUG maps, so console-created
 * categories filter correctly and deactivations stop resolving.
 */
export async function resolveCategoryMaps(): Promise<{
  slugToId: Record<string, string>;
  idToSlug: Record<string, string>;
}> {
  const cats = await resolvePublicCategories();
  const slugToId: Record<string, string> = {};
  const idToSlug: Record<string, string> = {};
  for (const c of cats) {
    slugToId[c.slug] = c.id;
    idToSlug[c.id] = c.slug;
  }
  return { slugToId, idToSlug };
}
