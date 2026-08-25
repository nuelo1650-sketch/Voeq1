import { redirect, notFound } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockListingsRepo } from "@voeq/data";
import { ListingEditPage } from "@/components/vendor/ListingEditPage";
import { AppShell } from "@/components/shell/AppShell";

/**
 * K3b.3 — Listing edit page.
 * Same form as create, pre-filled with existing listing data.
 */
export default async function EditListingRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/vendor/listings/" + id + "/edit");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const listing = await mockListingsRepo.getById(id);
  if (!listing) notFound();
  
  // Verify ownership
  if (listing.vendorId !== identity.vendorId) {
    redirect("/vendor/dashboard");
  }

  return (
    <AppShell role="vendor" userName={identity.name}>
      <ListingEditPage listing={listing} />
    </AppShell>
  );
}
