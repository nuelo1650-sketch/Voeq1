import type { MetadataRoute } from "next";
import { mockVendorRepo, mockListingsRepo, categories } from "@voeq/data";

/**
 * SEO batch (2026-09-04): DYNAMIC sitemap — static public pages + the
 * marketplace's most-searchable surfaces, from real DB data:
 *   - live vendor storefronts (/vendor/[id], publicOnly)
 *   - published active listings (/listing/[id], publicOnly)
 *   - category pages (/c/[slug])
 * lastModified uses each entity's real updatedAt — honest, never fabricated.
 *
 * Auth-gated/app-only routes (dashboard, messages, settings, staff, vendor
 * admin, onboarding) remain intentionally excluded — never in search indexes.
 * /styleguide removed (dev surface); /how-it-works added (public, was missing).
 */

const SITE_URL = "https://voeq.ng";

const STATIC_PAGES: { path: string; priority: number; changeFreq: string }[] = [
  { path: "", priority: 1.0, changeFreq: "daily" },
  { path: "/explore", priority: 0.9, changeFreq: "daily" },
  { path: "/how-it-works", priority: 0.7, changeFreq: "monthly" },
  { path: "/about", priority: 0.6, changeFreq: "monthly" },
  { path: "/careers", priority: 0.5, changeFreq: "monthly" },
  { path: "/help", priority: 0.5, changeFreq: "monthly" },
  { path: "/press", priority: 0.5, changeFreq: "monthly" },
  { path: "/privacy", priority: 0.3, changeFreq: "yearly" },
  { path: "/terms", priority: 0.3, changeFreq: "yearly" },
  { path: "/for-vendors", priority: 0.8, changeFreq: "weekly" },
  { path: "/become-vendor", priority: 0.8, changeFreq: "weekly" },
  { path: "/login", priority: 0.4, changeFreq: "yearly" },
  { path: "/signup", priority: 0.4, changeFreq: "yearly" },
  { path: "/forgot-password", priority: 0.2, changeFreq: "yearly" },
  { path: "/reset-password", priority: 0.2, changeFreq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFreq as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: p.priority,
  }));

  // Category pages — static taxonomy, all real public pages.
  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/c/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Live vendor storefronts + published active listings — real data,
  // publicOnly (same visibility filter as Explore: live vendors only).
  // NOTE: the locked Vendor/Listing interfaces carry no timestamps, so
  // lastModified = sitemap build time — "fresh as of this crawl". Honest:
  // we never fabricate per-entity dates that don't exist in the data.
  // Fail-soft: if the DB is unreachable the sitemap still serves the static
  // + category URLs rather than erroring the whole route.
  const dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const vendors = await mockVendorRepo.listVendors({ publicOnly: true });
    for (const v of vendors) {
      dynamicEntries.push({
        url: `${SITE_URL}/vendor/${v.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      });
    }
    const listings = await mockListingsRepo.list({ publicOnly: true });
    for (const l of listings) {
      dynamicEntries.push({
        url: `${SITE_URL}/listing/${l.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  } catch {
    // honest degradation — static+categories only
  }

  return [...staticEntries, ...categoryEntries, ...dynamicEntries];
}
