import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockVendorRepo } from "@voeq/data";
import { VendorReviewsManagement } from "@/components/vendor/VendorReviewsManagement";
import { AppShell } from "@/components/shell/AppShell";

/**
 * K3b.6 — Vendor reviews management page.
 * List reviews, respond (500 chars max, 24h edit window), response locked badge after 24h, delete response with confirm.
 */
export default async function ReviewsPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/vendor/reviews");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  return (
    <AppShell role="vendor" userName={vendor.name}>
      <VendorReviewsManagement vendor={vendor} disabled={vendor.status === "suspended"} />
    </AppShell>
  );
}
