import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockCategoryRepo, mockCampusRepo, ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * K3c.7 — Config management page (simplified).
 * Categories and campuses CRUD.
 */
export default async function ConfigPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/config");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  if (!caps.includes("config.write")) redirect("/staff");

  const [categories, campuses] = await Promise.all([
    mockCategoryRepo.list(),
    mockCampusRepo.list(),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/staff" style={{ fontSize: 14, color: "#1976D2", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "#212121", fontWeight: 700 }}>
          Configuration
        </h1>
        <p style={{ margin: "4px 0 24px", fontSize: 14, color: "#666" }}>
          Manage platform configuration
        </p>

        {/* Categories */}
        <section style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#212121" }}>Categories ({categories.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, border: "1px solid #F5F5F5", borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#212121" }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{cat.id}</div>
                </div>
                <button style={{ padding: "6px 12px", fontSize: 13, border: "1px solid #E0E0E0", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Campuses */}
        <section style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#212121" }}>Campuses ({campuses.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {campuses.map((campus) => (
              <div key={campus.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, border: "1px solid #F5F5F5", borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#212121" }}>{campus.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{campus.id}</div>
                </div>
                <button style={{ padding: "6px 12px", fontSize: 13, border: "1px solid #E0E0E0", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
