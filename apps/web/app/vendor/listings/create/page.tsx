import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { resolvePublicCategories } from "@voeq/data";
import { ListingCreatePage } from "@/components/vendor/ListingCreatePage";
import { AppShell } from "@/components/shell/AppShell";

/**
 * K3b.2 — Listing create form page.
 * Full-featured form with photo upload, validation, and draft persistence.
 */
export default async function CreateListingRoute() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/vendor/listings/create");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  // CHIPS SEAM: console-managed taxonomy (renames reflected, deactivated
  // excluded) for the category picker.
  const cats = await resolvePublicCategories();

  return (
    <AppShell role="vendor" userName={identity.name}>
      <ListingCreatePage categories={cats} />
    </AppShell>
  );
}
