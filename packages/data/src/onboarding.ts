/**
 * VS3.6 — Vendor go-live transition (the WRITE gate for public visibility).
 *
 * This is the ONLY place a vendor's status flips to "live" and an identity's
 * role widens to "vendor". It enforces the Phase A + Phase B preconditions
 * (Reversal 7) in one guarded transition. The read gate (canVendorBePublic,
 * VS3.5) keys off `status === "live"`; we do NOT store a separate isPublic flag.
 *
 * One Identity is preserved: the vendor record is linked to the identity via
 * identityId, and the role property widens on the same identity (Doc 07 §7.9).
 */

import { mockIdentityRepo } from "./auth";
import { mockVendorRepo, mockListingsRepo, listListingsByVendor } from "./mock";

export interface CanGoLiveResult {
  ok: boolean;
  status: "live" | "pending_listings";
  reasons: string[];
}

/** Pure precondition check — does this vendor satisfy Phase A + Phase B? */
export async function canGoLive(vendor: {
  id: string;
  agreementAcceptedAt: string | null;
  profilePhotoUrl: string | null;
  status: "pending_listings" | "live" | "suspended";
}): Promise<CanGoLiveResult> {
  const reasons: string[] = [];
  if (!vendor.agreementAcceptedAt) reasons.push("phase_a_incomplete");
  // Real listings live in Neon (mockListingsRepo switches to realListingsRepo on
  // USE_REAL). listListingsByVendor only checks the in-memory dev dataset, so it
  // returns [] for real vendors and would falsely block go-live. Count real
  // listings by vendorId instead.
  const hasListing =
    (await mockListingsRepo.list({ campus: vendor.campus })).filter((l) => l.vendorId === vendor.id).length > 0;
  if (!vendor.profilePhotoUrl) reasons.push("profile_photo_missing");
  if (!hasListing) reasons.push("no_listing");
  return {
    ok: reasons.length === 0,
    status: reasons.length === 0 ? "live" : "pending_listings",
    reasons,
  };
}

/**
 * Perform the go-live transition for the identity that owns this vendor.
 * Returns the updated vendor, or null if preconditions unmet / vendor missing.
 */
export async function goLive(identityId: string): Promise<CanGoLiveResult | null> {
  const identity = await mockIdentityRepo.getById(identityId);
  if (!identity || !identity.vendorId) return null;

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) return null;

  const assessment = await canGoLive(vendor);
  if (!assessment.ok) return assessment;

  await mockVendorRepo.patch(vendor.id, { status: "live" });
  // Role widens on the SAME identity — no second identity created.
  await mockIdentityRepo.patch(identity.id, { role: "vendor" });
  return assessment;
}
