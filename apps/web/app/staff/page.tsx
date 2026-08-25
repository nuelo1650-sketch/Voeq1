import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import {
  mockVendorRepo,
  mockListingsRepo,
  mockIdentityRepo,
  computePlatformAnalytics,
  ROLE_CAPABILITIES,
  type StaffRole,
} from "@voeq/data";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

/**
 * K3c.5 — Admin dashboard (operational tier).
 * Dense, professional, action-oriented. Role-gated visibility.
 */
export default async function StaffDashboardPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];

  // Fetch real platform data (no fake numbers).
  const [allVendors, allListings, allIdentities, platform] = await Promise.all([
    mockVendorRepo.listVendors(),
    mockListingsRepo.list({}),
    mockIdentityRepo.list(),
    computePlatformAnalytics(),
  ]);

  const totalUsers = allIdentities.length;
  const totalVendors = allVendors.length;
  const totalListings = allListings.length;
  const pendingVerifications = allVendors.filter((v) => !v.verified).length;
  const suspendedAccounts = allVendors.filter((v) => v.status === "suspended").length;

  return (
    <AdminDashboard
      staff={staff}
      capabilities={caps}
      metrics={{
        totalUsers,
        totalVendors,
        totalListings,
        openReports: platform.openReports,
        messageVolume24h: platform.messageVolume24h,
        newSignups24h: platform.newSignups24h,
        pendingVerifications,
        suspendedAccounts,
      }}
    />
  );
}
