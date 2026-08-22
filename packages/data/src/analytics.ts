import type { Vendor, VendorAnalytics, PlatformAnalytics, Identity, Message, StaffCase } from "./interfaces";
import { mockVendorRepo, mockListingsRepo, mockStaffRepo } from "./mock";
import { mockReviewRepo, mockFollowRepo, countSavesByVendor } from "./shopper";
import { mockIdentityRepo } from "./auth";
import { mockMessageRepo } from "./messaging";

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
  const openReports = cases.filter((c: StaffCase) => c.status === "open" || c.status === "triaged").length;

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

