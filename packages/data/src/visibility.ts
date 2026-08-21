/**
 * VS3.5 — Vendor visibility PRECONDITION (Doc 13 §13.4).
 *
 * Visibility is NOT a stored `isPublic` boolean. The single source of truth is
 * the vendor lifecycle `status` ("pending_listings" | "live"). A vendor is public
 * only when `status === "live"`. The Phase A/B preconditions (agreement accepted,
 * profile photo, ≥1 listing) are enforced at the WRITE transition (`canGoLive`,
 * VS3.6) — they flip status to "live" only once satisfied. We do NOT re-derive
 * them on every read (that would 404 already-live seed vendors and duplicate state).
 *
 * `canVendorBePublic` is the read gate used by /vendor/[id]. `assessVendorVisibility`
 * reports phase completeness for diagnostics/the dashboard without gating reads.
 */

import type { Vendor } from "./interfaces";
import { mockVendorRepo, listListingsByVendor } from "./mock";
import { canGoLive } from "./onboarding";

export interface VisibilityCheck {
  canBePublic: boolean;
  phaseAComplete: boolean;
  phaseBComplete: boolean;
  hasListing: boolean;
  reasons: string[];
}

export function assessVendorVisibility(vendor: Vendor | null): VisibilityCheck {
  const reasons: string[] = [];
  if (!vendor) {
    return {
      canBePublic: false,
      phaseAComplete: false,
      phaseBComplete: false,
      hasListing: false,
      reasons: ["vendor_not_found"],
    };
  }

  const phaseAComplete = !!vendor.agreementAcceptedAt;
  if (!phaseAComplete) reasons.push("phase_a_incomplete");

  const hasListing = listListingsByVendor(vendor.id).length > 0;
  const phaseBComplete = !!vendor.profilePhotoUrl && hasListing;
  if (!vendor.profilePhotoUrl) reasons.push("profile_photo_missing");
  if (!hasListing) reasons.push("no_listing");

  // Public read gate = lifecycle status (single source of truth, not an isPublic flag).
  const canBePublic = vendor.status === "live";

  return {
    canBePublic,
    phaseAComplete,
    phaseBComplete,
    hasListing,
    reasons,
  };
}

/** Sync wrapper for the mock. Public visibility is driven by `status === "live"`. */
export function canVendorBePublic(vendor: Vendor | null): boolean {
  return vendor?.status === "live";
}

/**
 * VS3 audit fix (#4/#5) — visibility drift guard.
 *
 * The write gate (`canGoLive`) flips status to "live" once Phase A+B are met. If a
 * later mutation removes a precondition (last listing deleted, or profile photo
 * cleared), the vendor must revert to "pending_listings" so the read gate
 * (`canVendorBePublic` => 404) stays correct (Doc 13 §13.4). Call this after any
 * mutation that can invalidate Phase A/B. Only reverts; never promotes.
 */
export async function enforceVisibilityAfterMutation(vendorId: string): Promise<void> {
  const vendor = await mockVendorRepo.getById(vendorId);
  if (!vendor || vendor.status !== "live") return; // nothing to revert if not public
  const stillValid = canGoLive(vendor).ok;
  if (!stillValid) {
    await mockVendorRepo.patch(vendorId, { status: "pending_listings" });
  }
}

/** Fetch a vendor only if it is publicly visible (status "live"). Null => 404 upstream. */
export async function getPublicVendor(idOrSlug: string): Promise<Vendor | null> {
  const vendor = await mockVendorRepo.getById(idOrSlug);
  if (!vendor) return null;
  return canVendorBePublic(vendor) ? vendor : null;
}

