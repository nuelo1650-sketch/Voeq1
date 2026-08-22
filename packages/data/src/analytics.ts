import type { Vendor, VendorAnalytics } from "./interfaces";
import { mockVendorRepo, mockListingsRepo } from "./mock";
import { mockReviewRepo, mockFollowRepo, countSavesByVendor } from "./shopper";

/**
 * VS5.11 — Derived vendor analytics. Counts come from real relationship records;
 * NO impression log in VS5 (per founder 2026-08-22). openNow is derived from the
 * vendor's hours + the current server time; null when hours are unset (honest —
 * we never claim "always open").
 *
 * Hours use 24h "HH:MM" strings. Day-of-week matching uses the server's local
 * time (mock has no real timezone plumbing). Midnight-wrap (e.g. 22:00–02:00) is
 * NOT supported in Phase 1 and treated as closed across the boundary.
 */
export function isOpenNow(hours: Vendor["hours"]): boolean | null {
  if (!hours || !hours.days || hours.days.length === 0) return null;
  const now = new Date();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const today = dayNames[now.getDay()];
  if (!hours.days.includes(today)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = hours.open.split(":").map(Number);
  const [ch, cm] = hours.close.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (closeMin <= openMin) return false; // midnight-wrap unsupported → closed
  return cur >= openMin && cur < closeMin;
}

export async function computeVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
  const [listings, reviews, follows] = await Promise.all([
    mockListingsRepo.list(),
    mockReviewRepo.listByVendor(vendorId),
    mockFollowRepo.listByVendor(vendorId),
  ]);
  const vendorListings = listings.filter((l) => l.vendorId === vendorId);
  const saveCount = await countSavesByVendor(vendorId);
  const vendor = await mockVendorRepo.getById(vendorId);
  const openNow = vendor ? isOpenNow(vendor.hours ?? null) : null;

  return {
    vendorId,
    listingCount: vendorListings.length,
    reviewCount: reviews.length,
    followerCount: follows.length,
    saveCount,
    openNow,
  };
}
