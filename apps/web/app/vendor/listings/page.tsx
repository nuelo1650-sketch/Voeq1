import { redirect } from "next/navigation";
import { getCurrentIdentity, getStaffIdentity } from "@/lib/session";
import { mockVendorRepo, mockListingsRepo, canVendorBePublic } from "@voeq/data";
import { VendorListingsManager } from "@/components/vendor/VendorListingsManager";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

/**
 * P-A round 72 — REAL listings management page (was missing: only /create and
 * /[id]/edit existed, so "Listings" in the nav dropped you into the create
 * form and after publishing you had NO view of your posts).
 *
 * What shoppers see matters: a vendor must see their own posts the way
 * shoppers do (LIVE/DRAFT pill, price, photo), see a storefront preview, and
 * trigger go-live from here — not hunt for the button on the dashboard.
 */
export default async function VendorListingsPage() {
  const identity = await getCurrentIdentity();
  if (!identity || !identity.vendorId) redirect("/login?next=/vendor/listings");
  const staff = await getStaffIdentity();

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/vendor/dashboard");

  const all = await mockListingsRepo.list({});
  const listings = all.filter((l) => l.vendorId === vendor.id);

  return (
    <AppShell role="vendor" userName={vendor.name} staffRole={staff?.staffRole ?? null}>
      <VendorListingsManager
        vendor={{ id: vendor.id, name: vendor.name, status: vendor.status, slug: vendor.slug, verified: vendor.verified, profilePhotoUrl: vendor.profilePhotoUrl, description: vendor.description, campus: vendor.campus }}
        isPublic={canVendorBePublic(vendor)}
        listings={listings.map((l) => ({
          id: l.id,
          title: l.title,
          priceMinMinor: l.priceMinMinor,
          priceMaxMinor: l.priceMaxMinor,
          categoryId: l.categoryId,
          isPublished: l.isPublished,
          status: l.status,
          images: l.images,
          description: l.shortDescription ?? l.description ?? "",
        }))}
      />
    </AppShell>
  );
}
