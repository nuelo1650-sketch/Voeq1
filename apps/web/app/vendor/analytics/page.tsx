import { redirect } from "next/navigation";
import { getCurrentIdentity, getStaffIdentity } from "@/lib/session";
import { mockVendorRepo, mockListingsRepo } from "@voeq/data";
import { VendorAnalytics } from "@/components/vendor/VendorAnalytics";
import { AppShell } from "@/components/shell/AppShell";

/**
 * K3b.5 — Vendor analytics page.
 * Counts only (no charts), honest data ("—" for empty), date range selector,
 * overview cards, top listings table, recent activity timeline.
 */
export default async function AnalyticsPage() {
  const identity = await getCurrentIdentity();
  const staff = await getStaffIdentity();
  if (!identity) redirect("/login?next=/vendor/analytics");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  // Fetch all listings and filter by vendor
  const allListings = await mockListingsRepo.list({});
  const listings = allListings.filter(l => l.vendorId === vendor.id);

  return (
    <AppShell role="vendor" userName={vendor.name} staffRole={staff?.staffRole ?? null}>
      <VendorAnalytics
        vendor={vendor}
        listings={listings}
      />
    </AppShell>
  );
}
