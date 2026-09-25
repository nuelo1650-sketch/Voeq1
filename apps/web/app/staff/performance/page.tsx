import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockVendorRepo } from "@voeq/data";
import { computeVendorResponseTime } from "@voeq/db";
import { AppShell } from "@/components/shell/AppShell";
import { PerformanceClient } from "@/components/staff/PerformanceClient";

export const dynamic = "force-dynamic";

export interface VendorStat {
  vendorId: string;
  vendorName: string;
  avgMs: number | null;
  conversations: number;
}

export default async function VendorPerformancePage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/performance");

  // Server-side: compute real response-time stats per vendor.
  const vendors = await mockVendorRepo.listVendors({ publicOnly: true });
  const stats: VendorStat[] = [];
  for (const v of vendors.slice(0, 100)) {
    const rt = await computeVendorResponseTime(v.id);
    stats.push({
      vendorId: v.id,
      vendorName: v.name,
      avgMs: rt.avgMs > 0 ? rt.avgMs : null,
      conversations: rt.conversationCount,
    });
  }
  stats.sort((a, b) => (b.avgMs ?? -1) - (a.avgMs ?? -1));

  return (
    <AppShell role="staff" userName={staff.email}>
      <PerformanceClient initialStats={stats} />
    </AppShell>
  );
}
