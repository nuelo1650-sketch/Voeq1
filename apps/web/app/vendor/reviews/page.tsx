import { redirect } from "next/navigation";
import { getCurrentIdentity, getStaffIdentity } from "@/lib/session";
import { mockVendorRepo, mockReviewRepo } from "@voeq/data";
import { VendorReviewsManagement, type ReviewForVendor } from "@/components/vendor/VendorReviewsManagement";
import { AppShell } from "@/components/shell/AppShell";

/**
 * K3b.6 — Vendor reviews management page.
 * List reviews, respond (500 chars max, 24h edit window), response locked badge after 24h, delete response with confirm.
 * P-A round 7 (A5): REAL reviews loaded server-side (no fabricated fixtures).
 */
export default async function ReviewsPage() {
  const identity = await getCurrentIdentity();
  const staff = await getStaffIdentity();
  if (!identity) redirect("/login?next=/vendor/reviews");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  const raw = await mockReviewRepo.listByVendor(identity.vendorId);
  // P-A round 7 (A5): REAL reviews (no fabricated fixtures). The Review type
  // carries authorId (identity id) — resolving display names would require an
  // extra identity lookup per review; show an honest generic label over leaking
  // raw ids. Vendor's own identityId is masked as "You".
  const reviews: ReviewForVendor[] = raw.map((r) => ({
    id: r.id,
    shopperName: r.authorId === identity.id ? "You" : "Shopper",
    rating: r.rating,
    body: r.body,
    createdAt: new Date(r.createdAt),
    response: r.response
      ? { body: r.response.body, createdAt: new Date(r.response.createdAt) }
      : undefined,
  }));

  return (
    <AppShell role="vendor" userName={vendor.name} staffRole={staff?.staffRole ?? null}>
      <VendorReviewsManagement vendor={vendor} disabled={vendor.status === "suspended"} initialReviews={reviews} />
    </AppShell>
  );
}
