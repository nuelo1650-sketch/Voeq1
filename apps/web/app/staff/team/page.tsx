import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockIdentityRepo, ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { TeamManager } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

/**
 * K3c.8 — Staff & team management (P-A round 60).
 *
 * The promote API (/api/staff/promote) existed but had NO UI — super admins
 * couldn't promote users from the dashboard. This page lists real users +
 * staff (identity rows only; never emails beyond the staff's own email) and
 * renders the TeamManager client (role actions; server-authoritative).
 */

const ROLE_LABEL: Record<StaffRole, string> = {
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default async function TeamPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/team");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  if (!caps.includes("staff.promote")) redirect("/staff");

  const users = await mockIdentityRepo.list();

  // Privacy: identities expose id/name/role/status — never passwordHash.
  const rows = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      staffRole: u.staffRole ?? null,
      accountStatus: u.accountStatus ?? "pending_verification",
      isSelf: u.id === staff.id,
    }))
    .sort((a, b) => (b.staffRole ? 1 : 0) - (a.staffRole ? 1 : 0) || a.name.localeCompare(b.name));

  const canGrantSuperAdmin = staff.staffRole === "super_admin";

  return (
    <AppShell role="staff" userName={staff.email}>
      <div style={{ minHeight: "100vh", background: "var(--role-surface-sunken)", padding: "var(--space-4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/staff" style={{ fontSize: 14, color: "var(--role-accent)", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--role-text)", fontWeight: 700 }}>
            Team & Roles
          </h1>
          <p style={{ margin: "4px 0 24px", fontSize: 14, color: "var(--role-text-muted)" }}>
            {rows.length} users · {rows.filter((r) => r.staffRole).length} staff · You are {ROLE_LABEL[staff.staffRole as StaffRole]}
            {canGrantSuperAdmin ? " (can grant all roles)" : " (can grant moderator/admin only)"}
          </p>

          <TeamManager
            rows={rows}
            roleLabel={ROLE_LABEL}
            canGrantSuperAdmin={canGrantSuperAdmin}
          />
        </div>
      </div>
    </AppShell>
  );
}
