import { ListingDetail } from "@/components/listing/ListingDetail";

/**
 * /listing/[id] — PG-PUB-005 (Doc 04). Editorial listing detail. Cream environment (default).
 * Next 15.5: route params is a Promise<> and must be awaited.
 */
export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail id={id} />;
}
