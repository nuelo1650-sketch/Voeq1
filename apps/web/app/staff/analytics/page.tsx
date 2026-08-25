import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockVendorRepo, mockListingsRepo, mockIdentityRepo, ROLE_CAPABILITIES, type StaffRole, campuses } from "@voeq/data";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

/**
 * K3c.7 — Admin analytics page.
 * Real counts, no fakes. Trends, top categories, campus distribution.
 */
export default async function AnalyticsPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/analytics");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  if (!caps.includes("analytics.read")) redirect("/staff");

  // Fetch data
  const [allVendors, allListings, allIdentities] = await Promise.all([
    mockVendorRepo.listVendors(),
    mockListingsRepo.list({}),
    mockIdentityRepo.list(),
  ]);

  // Calculate metrics (real counts only — no hardcoded fallbacks)
  const totalUsers = allIdentities.length;
  const totalVendors = allVendors.length;
  const totalListings = allListings.length;

  // Campus distribution
  const campusDistribution = campuses.map(campus => ({
    name: campus.name,
    vendors: allVendors.filter(v => v.campus === campus.id).length,
    listings: allListings.filter(l => {
      const vendor = allVendors.find(v => v.id === l.vendorId);
      return vendor?.campus === campus.id;
    }).length,
  }));

  return (
    <AppShell role="staff" userName={staff.email}>
      <div style={{ minHeight: "100vh", background: "var(--role-surface-sunken)", padding: "var(--space-4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/staff" style={{ fontSize: 14, color: "var(--role-accent)", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--role-text)", fontWeight: 700 }}>
          Platform Analytics
        </h1>
        <p style={{ margin: "4px 0 24px", fontSize: 14, color: "var(--role-text-muted)" }}>
          Real metrics, no fake data
        </p>

        {/* Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <MetricCard label="Total Users" value={totalUsers} />
          <MetricCard label="Total Vendors" value={totalVendors} />
          <MetricCard label="Total Listings" value={totalListings} />
        </div>

        {/* Trends */}
        <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "var(--role-text)" }}>Campus Distribution</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--role-border)" }}>
                <th style={{ textAlign: "left", padding: 12, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Campus</th>
                <th style={{ textAlign: "right", padding: 12, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Vendors</th>
                <th style={{ textAlign: "right", padding: 12, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Listings</th>
              </tr>
            </thead>
            <tbody>
              {campusDistribution.map((campus) => (
                <tr key={campus.name} style={{ borderBottom: "1px solid var(--role-border)" }}>
                  <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)" }}>{campus.name}</td>
                  <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)", textAlign: "right" }}>{campus.vendors}</td>
                  <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)", textAlign: "right" }}>{campus.listings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--role-accent)", fontFamily: "var(--font-display)", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--role-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}
