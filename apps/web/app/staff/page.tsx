import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockVendorRepo, mockListingsRepo, mockIdentityRepo, ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
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

  // Fetch platform data
  const [allVendors, allListings, allIdentities] = await Promise.all([
    mockVendorRepo.listVendors(),
    mockListingsRepo.list({}),
    mockIdentityRepo.list(),
  ]);

  // Calculate metrics
  const totalUsers = allIdentities.length;
  const totalVendors = allVendors.length;
  const totalListings = allListings.length;
  const pendingVerifications = allVendors.filter(v => !v.verified).length;
  const suspendedAccounts = allVendors.filter(v => v.status === "suspended").length;

  // Mock data for other metrics (would come from real repos in production)
  const openReports = 3;
  const messagesLast24h = 147;
  const systemErrors = 0;

  return (
    <AdminDashboard 
      staff={staff}
      capabilities={caps}
      metrics={{
        totalUsers,
        totalVendors,
        totalListings,
        messagesLast24h,
        openReports,
        pendingVerifications,
        suspendedAccounts,
        systemErrors,
      }}
    />
  );
}
