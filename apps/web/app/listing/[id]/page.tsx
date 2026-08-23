import type { Metadata } from "next";
import { loadListing } from "@voeq/data";
import { ListingDetail } from "@/components/listing/ListingDetail";

/**
 * /listing/[id] — PG-PUB-005 (Doc 04). Editorial listing detail. Cream environment (default).
 * Next 15.5: route params is a Promise<> and must be awaited.
 * K2.10: Added Open Graph and Twitter Card meta tags for rich social previews.
 */

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await loadListing(id);
  
  if (!listing) {
    return {
      title: "Listing not found — Voeq",
      description: "This listing could not be found.",
    };
  }

  const title = `${listing.title} — Voeq`;
  const description = (listing.description || listing.title).slice(0, 160);
  const image = listing.images?.[0] || '/og-default.png';
  const url = `https://voeq.africa/listing/${listing.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: listing.title }],
      url,
      type: 'website',
      siteName: 'Voeq',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  return <ListingDetail id={id} />;
}
