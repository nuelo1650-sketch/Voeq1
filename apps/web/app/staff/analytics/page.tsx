import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { computePlatformAnalytics } from "@voeq/data";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/analytics");

  const a = await computePlatformAnalytics();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "var(--role-font-ui)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>Analytics</h1>
      <p style={{ color: "var(--role-muted)", fontSize: 14 }}>Real counts from platform records. No estimated or fabricated metrics.</p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
        <StatCard label="Users" value={String(a.userCount)} />
        <StatCard label="Vendors" value={String(a.vendorCount)} />
        <StatCard label="Listings" value={String(a.listingCount)} />
        <StatCard label="Reviews" value={String(a.reviewCount)} />
        <StatCard label="Open reports" value={String(a.openReports)} />
        <StatCard label="Messages (24h)" value={String(a.messageVolume24h)} />
        <StatCard label="Signups (24h)" value={String(a.newSignups24h)} />
        <StatCard label="Staff" value={String(a.staffCount)} />
      </section>
    </main>
  );
}
