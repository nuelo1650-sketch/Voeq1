import type { Metadata } from "next";
import { LivePageMB } from "@/components/explore/mb/LivePageMB";
import { getCurrentIdentity } from "@/lib/session";
import { mockCampusRepo } from "@voeq/data";

/**
 * /explore/live (Money Bag B2, A13) — the curated shelf, canary-family page.
 * Reached from the MB floor's LiveShelf link. No footer (SmartFooter already
 * excludes non-allowlisted paths). noindex until canary cut-over.
 */
export const metadata: Metadata = {
  title: "Voeq Live — today's shelf, hand-picked",
  description: "The best of the Voeq market, chosen from real ratings and saves. Earned, never paid.",
  robots: { index: false, follow: false },
};

export default async function LivePage() {
  const identity = await getCurrentIdentity();
  const verified = await mockCampusRepo.list(identity?.id);
  const campus = identity?.campus ?? verified[0]?.id ?? "nmu-okerenkoko";
  return <LivePageMB campus={campus} />;
}
