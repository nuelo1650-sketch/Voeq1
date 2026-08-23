import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockVendorRepo, mockListingsRepo } from "@voeq/data";
import { VendorAnalytics } from "@/components/vendor/VendorAnalytics";

/**
 * K3b.5 — Vendor analytics page.
 * Counts only (no charts), honest data ("—" for empty), date range selector,
 * overview cards, top listings table, recent activity timeline.
 */
export default async function AnalyticsPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/vendor/analytics");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  // Fetch all listings and filter by vendor
  const allListings = await mockListingsRepo.list({});
  const listings = allListings.filter(l => l.vendorId === vendor.id);

  return (
    <VendorAnalytics 
      vendor={vendor} 
      listings={listings}
    />
  );
}
