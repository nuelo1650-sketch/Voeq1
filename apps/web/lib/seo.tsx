/**
 * SEO JSON-LD structured data (2026-09-10) — the missing rich-results layer.
 *
 * Why: the site had ZERO ld+json blocks. For a marketplace the highest-value
 * schema are:
 *  - Organization + WebSite (with SearchAction → sitelinks searchbox eligibility)
 *  - Product + Offer on listing pages (price, availability, seller)
 *  - BreadcrumbList on category/area pages
 *
 * Google's guidance: schema must describe REAL page content. All values here
 * come from real DB rows — the honesty rule applies to structured data too.
 */

export const SITE_URL = "https://voeq.ng";

export function orgJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Voeq",
    url: SITE_URL,
    logo: `${SITE_URL}/Logo.png`,
    description:
      "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
    sameAs: [
      "https://www.instagram.com/voeq.ng",
      "https://www.tiktok.com/@voeq.ng",
      "https://www.whatsapp.com/channel/0029Vb8u4Md6mYPON8gMpi3i",
    ],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Voeq",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Product schema for a listing page (real row values only). */
export function productJsonLd(listing: {
  id: string;
  title: string;
  description?: string | null;
  images?: string[];
  priceMinor: number;
  priceMaxMinor?: number | null;
  vendorName: string;
  vendorId: string;
  vendorSlug?: string;
}): Record<string, unknown> {
  const images = (listing.images ?? []).filter(Boolean).slice(0, 5);
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    price: (listing.priceMinor / 100).toFixed(2),
    priceCurrency: "NGN",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/listing/${listing.id}`,
  };
  if (typeof listing.priceMaxMinor === "number" && listing.priceMaxMinor > listing.priceMinor) {
    // AggregateOffer would be more precise, but a simple price range keeps it honest.
    offers.priceSpecification = {
      "@type": "PriceSpecification",
      minPrice: (listing.priceMinor / 100).toFixed(2),
      maxPrice: (listing.priceMaxMinor / 100).toFixed(2),
      priceCurrency: "NGN",
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description ?? `${listing.title} — listed on Voeq by ${listing.vendorName}.`,
    ...(images.length > 0 ? { image: images } : {}),
    offers,
    seller: {
      "@type": "Organization",
      name: listing.vendorName,
      url: listing.vendorSlug
        ? `${SITE_URL}/vendor/${listing.vendorSlug}`
        : `${SITE_URL}/vendor/${listing.vendorId}`,
    },
  };
}

/** Render a <script type="application/ld+json"> payload. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
