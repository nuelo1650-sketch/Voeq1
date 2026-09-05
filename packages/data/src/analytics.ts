import type { Vendor, VendorAnalytics, PlatformAnalytics, Identity, Message, StaffCase } from "./interfaces";
import { mockVendorRepo, mockListingsRepo, mockStaffRepo } from "./mock";
import { mockReviewRepo, mockFollowRepo, countSavesByVendor } from "./shopper";
import { mockIdentityRepo } from "./auth";
import { mockMessageRepo } from "./messaging";
// BUNDLE FIX (2026-09-05): isOpenNow is pure hours math — it moved to
// ./client.ts (the client-safe barrel) so client imports of it don't drag
// this file's server imports into the browser. Single source; re-export only.
import { isOpenNow } from "./client";

export { isOpenNow };

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
  const ratingAvg = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10) / 10
    : 0;

  return {
    vendorId,
    listingCount: vendorListings.length,
    reviewCount: reviews.length,
    followerCount: follows.length,
    saveCount,
    ratingAvg,
    openNow,
  };
}

/**
 * VS7.12 — Platform-wide analytics. Every figure is derived from real records.
 * NO fabricated metrics. 24h windows are computed against the current server time.
 */
export async function computePlatformAnalytics(): Promise<PlatformAnalytics> {
  const [identities, vendors, listings, reviews, messages, cases] = await Promise.all([
    mockIdentityRepo.list(),
    mockVendorRepo.listVendors(),
    mockListingsRepo.list(),
    mockReviewRepo.listAll(),
    mockMessageRepo.listAll(),
    mockStaffRepo.listCases(""),
  ]);

  const since24h = Date.now() - 24 * 3600 * 1000;
  const newSignups24h = identities.filter((i: Identity) => new Date(i.createdAt).getTime() >= since24h).length;
  const messageVolume24h = messages.filter((m: Message) => new Date(m.createdAt).getTime() >= since24h).length;
  const staffCount = identities.filter((i: Identity) => i.staffRole).length;
  // P-A round 57 (C2): openReports = open/triaged cases in the REPORTS queue
  // only (listCases("") now means ALL — counting everything would inflate the
  // reports metric with verifications/content-moderation cases).
  const openReports = cases.filter(
    (c: StaffCase) => c.queue === "reports" && (c.status === "open" || c.status === "triaged"),
  ).length;

  return {
    userCount: identities.length,
    vendorCount: vendors.length,
    listingCount: listings.length,
    reviewCount: reviews.length,
    openReports,
    messageVolume24h,
    newSignups24h,
    staffCount,
  };
}

