import type { MetadataRoute } from "next";

const SITE_URL = "https://voeq.ng";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Exclude app-only / private surfaces from indexing.
      disallow: [
        "/api/",
        "/dashboard",
        "/messages",
        "/settings",
        "/notifications",
        "/onboarding",
        "/select-campus",
        "/consent",
        "/vendor/dashboard",
        "/vendor/listings",
        "/vendor/analytics",
        "/vendor/reviews",
        "/staff",
        "/account-state",
        "/verify-otp",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
