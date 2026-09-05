import type { MetadataRoute } from "next";

const SITE_URL = "https://voeq.ng";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Exclude app-only / private surfaces from indexing (SEO batch
      // 2026-09-04): audited against the REAL route inventory — /dashboard
      // never existed (real routes: /home, /vendor/dashboard), /home /saved
      // /appeal /styleguide were uncovered.
      disallow: [
        "/api/",
        "/home",
        "/messages",
        "/settings",
        "/notifications",
        "/saved",
        "/onboarding",
        "/select-campus",
        "/consent",
        "/appeal",
        "/verify-otp",
        "/account-state",
        "/admin",
        "/staff",
        "/styleguide",
        "/vendor/dashboard",
        "/vendor/listings",
        "/vendor/storefront",
        "/vendor/analytics",
        "/vendor/reviews",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    // No `Host:` directive: it is non-standard (Google ignores it, only
    // legacy Yandex honored it) and Search Console's robots tester warns on
    // it. The absolute sitemap URL + canonical domain already disambiguate.
  };
}
