import { redirect, notFound } from "next/navigation";
import { mockVendorRepo } from "@voeq/data";

export const dynamic = "force-dynamic";

/**
 * VS7.20 — /v/{slug} legacy share links.
 *
 * L1.1 (2026-09-06): this route WAS the share target — a bare stub page (name,
 * description, one link) predating the design system, which made every copy-
 * link / QR / social share land on an "under-made page". The canonical share
 * URL is now the REAL storefront (/vendor/{id}). This route 301s legacy shared
 * links so old QR codes and pasted URLs keep working.
 */
export default async function VendorShareRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = (await mockVendorRepo.listVendors()).find((v) => v.slug === slug);
  if (!vendor) notFound();
  redirect(`/vendor/${vendor.id}`);
}
