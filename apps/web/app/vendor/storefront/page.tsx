import { redirect } from "next/navigation";
import { getCurrentIdentity, getStaffIdentity } from "@/lib/session";
import { mockVendorRepo } from "@voeq/data";
import { StorefrontManagement } from "@/components/vendor/StorefrontManagement";
import { AppShell } from "@/components/shell/AppShell";

/**
 * K3b.4 — Storefront management page.
 * Business identity, profile photo, hours, socials, verification status.
 */
export default async function StorefrontPage() {
  const identity = await getCurrentIdentity();
  const staff = await getStaffIdentity();
  if (!identity) redirect("/login?next=/vendor/storefront");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  return (
    <AppShell role="vendor" userName={vendor.name} staffRole={staff?.staffRole ?? null}>
      <StorefrontManagement vendor={vendor} disabled={vendor.status === "suspended"} />
    </AppShell>
  );
}
