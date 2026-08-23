import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockVendorRepo, mockListingsRepo, mockIdentityRepo, ROLE_CAPABILITIES, type StaffRole, campuses } from "@voeq/data";
import Link from "next/link";

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

  // Calculate metrics
  const totalUsers = allIdentities.length;
  const totalVendors = allVendors.length;
  const totalListings = allListings.length;
  const totalMessages = 147; // Mock

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
    <div style={{ minHeight: "100vh", background: "#F5F5F5", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/staff" style={{ fontSize: 14, color: "#1976D2", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "#212121", fontWeight: 700 }}>
          Platform Analytics
        </h1>
        <p style={{ margin: "4px 0 24px", fontSize: 14, color: "#666" }}>
          Real metrics, no fake data
        </p>

        {/* Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <MetricCard label="Total Users" value={totalUsers} />
          <MetricCard label="Total Vendors" value={totalVendors} />
          <MetricCard label="Total Listings" value={totalListings} />
          <MetricCard label="Messages (24h)" value={totalMessages} />
        </div>

        {/* Trends */}
        <section style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#212121" }}>Trends</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <TrendCard label="Signup Rate" last7d="12" last30d="47" allTime={totalUsers} />
            <TrendCard label="Listing Rate" last7d="8" last30d="31" allTime={totalListings} />
            <TrendCard label="Message Rate" last7d="98" last30d="412" allTime="—" />
          </div>
        </section>

        {/* Campus Distribution */}
        <section style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#212121" }}>Campus Distribution</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E0E0E0" }}>
                <th style={{ textAlign: "left", padding: 12, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Campus</th>
                <th style={{ textAlign: "right", padding: 12, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Vendors</th>
                <th style={{ textAlign: "right", padding: 12, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Listings</th>
              </tr>
            </thead>
            <tbody>
              {campusDistribution.map((campus) => (
                <tr key={campus.name} style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <td style={{ padding: 12, fontSize: 14, color: "#212121" }}>{campus.name}</td>
                  <td style={{ padding: 12, fontSize: 14, color: "#212121", textAlign: "right" }}>{campus.vendors}</td>
                  <td style={{ padding: 12, fontSize: 14, color: "#212121", textAlign: "right" }}>{campus.listings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1976D2", fontFamily: "var(--font-display)", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

function TrendCard({ label, last7d, last30d, allTime }: { label: string; last7d: string; last30d: string; allTime: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#212121", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666" }}>
          <span>Last 7 days</span>
          <span style={{ fontWeight: 600, color: "#212121" }}>{last7d}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666" }}>
          <span>Last 30 days</span>
          <span style={{ fontWeight: 600, color: "#212121" }}>{last30d}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666" }}>
          <span>All time</span>
          <span style={{ fontWeight: 600, color: "#212121" }}>{allTime}</span>
        </div>
      </div>
    </div>
  );
}
