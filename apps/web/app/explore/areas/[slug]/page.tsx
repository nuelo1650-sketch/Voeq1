import type { Metadata } from "next";
import { AreaPageMB } from "@/components/explore/mb/AreaPageMB";

/**
 * /explore/areas/[slug] (Money Bag B3, F1 surface) — the local flyer,
 * canary-family page. Noindex until cut-over (D8).
 */
export const metadata: Metadata = {
  title: "Area — Voeq market",
  robots: { index: true, follow: true }, // cut-over: public surface
};

export default async function AreaPage() {
  return <AreaPageMB />;
}
