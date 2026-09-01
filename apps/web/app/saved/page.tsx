import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockSavedListingRepo, mockListingsRepo, mockVendorRepo } from "@voeq/data";
import { SavedClient } from "@/components/shopper/SavedClient";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/saved");

  const items = await mockSavedListingRepo.list(identity.id);
  const listingIds = items.filter((i) => i.listingId).map((i) => i.listingId!);
  const vendorIds = items.filter((i) => i.vendorId).map((i) => i.vendorId!);

  const allListings = await mockListingsRepo.list();
  const savedListings = allListings.filter((l) => listingIds.includes(l.id));

  const vendors = await mockVendorRepo.listVendors();
  const savedVendors = vendors.filter((v) => vendorIds.includes(v.id));

  return (
    <AppShell role="shopper" userName={identity.name}>
      <SavedClient listings={savedListings} vendors={savedVendors} />
    </AppShell>
  );
}
