import type { MetadataRoute } from "next";

const SITE_URL = "https://voeq.ng";

// Static, publicly-indexable pages. Auth-gated/app-only routes
// (dashboard, messages, settings, staff, vendor admin, onboarding) are
// intentionally excluded — they should not appear in search indexes.
const STATIC_PAGES: { path: string; priority: number; changeFreq: string }[] = [
  { path: "", priority: 1.0, changeFreq: "daily" },
  { path: "/explore", priority: 0.9, changeFreq: "daily" },
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
  { path: "/styleguide", priority: 0.2, changeFreq: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFreq as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: p.priority,
  }));
}
