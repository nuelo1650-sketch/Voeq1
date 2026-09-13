import type { Metadata } from "next";
import { CategoryPageMB } from "@/components/explore/mb/CategoryPageMB";
import { getCurrentIdentity } from "@/lib/session";
import { mockCampusRepo } from "@voeq/data";

/**
 * /explore/c/[slug] (Money Bag B3) — the calm catalog, canary-family page.
 * Noindex until cut-over (D8).
 */
export const metadata: Metadata = {
  title: "Category — Voeq market",
  robots: { index: false, follow: false },
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const identity = await getCurrentIdentity();
  const verified = await mockCampusRepo.list(identity?.id);
  const campus = identity?.campus ?? verified[0]?.id ?? "nmu-okerenkoko";
  return <CategoryPageMB campus={campus} key={slug} />;
}
