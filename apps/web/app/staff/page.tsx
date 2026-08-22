import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

const TAB_CAP: { key: string; label: string; cap?: import("@voeq/data").Capability }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "moderation", label: "Moderation", cap: "case.review" },
  { key: "verification", label: "Verification", cap: "vendor.verify" },
  { key: "analytics", label: "Analytics", cap: "analytics.read" },
  { key: "config", label: "Configuration", cap: "config.write" },
  { key: "audit", label: "Audit Log", cap: "audit.read" },
  { key: "impersonation", label: "Impersonation", cap: "staff.impersonate" },
];

export default async function StaffDashboardPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  const visibleTabs = TAB_CAP.filter((t) => !t.cap || caps.includes(t.cap));

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "var(--role-font-ui)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--role-border)", paddingBottom: 12, marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)", margin: 0 }}>Admin</h1>
        <span data-testid="staff-role-badge" style={{ background: "var(--role-accent-strong)", color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: 13, textTransform: "capitalize" }}>
          {staff.staffRole.replace("_", " ")}
        </span>
      </header>

      <AdminTabs tabs={visibleTabs.map((t) => ({ key: t.key, label: t.label }))} active="dashboard" />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
        <StatCard label="Your role" value={staff.staffRole.replace("_", " ")} />
        <StatCard label="Capabilities" value={String(caps.length)} />
        <StatCard label="Tabs visible" value={String(visibleTabs.length)} />
        <StatCard label="Moderation access" value={caps.includes("case.review") ? "yes" : "no"} />
      </section>

      <p style={{ color: "var(--role-muted)", marginTop: 24, fontSize: 14 }}>
        Role-gated admin surface. Each section loads its own data behind a server-side capability check.
      </p>
    </main>
  );
}
