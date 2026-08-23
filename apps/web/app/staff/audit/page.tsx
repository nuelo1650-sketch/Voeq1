import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
import { AuditLog } from "@/components/admin/AuditLog";

export const dynamic = "force-dynamic";

/**
 * K3c.7 — Audit log page.
 * Searchable, filterable list of all staff actions.
 */
export default async function AuditPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/audit");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  if (!caps.includes("audit.read")) redirect("/staff");

  return <AuditLog staff={staff} />;
}
