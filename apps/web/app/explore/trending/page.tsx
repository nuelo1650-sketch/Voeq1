import type { Metadata } from "next";
import { TrendingPageMB } from "@/components/explore/mb/TrendingPageMB";
import { getCurrentIdentity } from "@/lib/session";
import { mockCampusRepo } from "@voeq/data";

/**
 * /explore/trending (Money Bag B2, A14) — the ranked board, canary-family page.
 * Noindex until canary cut-over (D8).
 */
export const metadata: Metadata = {
  title: "Trending — what the market loves",
  description: "Ranked by real attention — saves, messages and views. Not guesses. Not ads.",
  robots: { index: false, follow: false },
};

export default async function TrendingPage() {
  const identity = await getCurrentIdentity();
  const verified = await mockCampusRepo.list(identity?.id);
  const campus = identity?.campus ?? verified[0]?.id ?? "nmu-okerenkoko";
  return <TrendingPageMB campus={campus} />;
}
