import { Explore } from "@/components/explore/Explore";

/**
 * /c/[categorySlug] — PG-PUB-003 (Doc 04). Route variant of Explore: SAME component,
 * category preset from URL + shown in heading. Not a duplicate page (Doc 04 classification).
 */
export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  return <Explore categoryPreset={categorySlug} />;
}
