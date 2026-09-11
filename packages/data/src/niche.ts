/**
 * MONEY BAG Q4 (founder, 2026-09-10): "Other" is not a category name —
 * the VENDOR's own words are. The niche field (76046aa) rides shortDescription
 * as "Niche: <text>" for 'other'-category listings. This helper extracts it
 * so listing + storefront can display the vendor's real category name.
 *
 * Returns null when the listing is not an 'other' or carries no niche —
 * callers fall back to the normal category name (honest, never fabricated).
 */
export function nicheFromListing(listing: {
  categorySlug?: string;
  categoryId?: string;
  shortDescription?: string | null;
}): string | null {
  const isOther = listing.categorySlug === "other" || listing.categoryId === "other";
  if (!isOther) return null;
  const sd = listing.shortDescription ?? "";
  if (sd.startsWith("Niche:")) {
    const niche = sd.slice("Niche:".length).trim();
    return niche.length > 0 ? niche : null;
  }
  return null;
}
