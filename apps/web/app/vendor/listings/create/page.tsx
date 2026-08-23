import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { ListingCreatePage } from "@/components/vendor/ListingCreatePage";

/**
 * K3b.2 — Listing create form page.
 * Full-featured form with photo upload, validation, and draft persistence.
 */
export default async function CreateListingRoute() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/vendor/listings/create");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  return <ListingCreatePage />;
}
