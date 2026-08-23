import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const dynamic = "force-dynamic";

/**
 * K3c.6 — Admin moderation queue.
 * Reports, verifications, content, users - all with bulk actions.
 */
export default async function ModerationPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/moderation");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  
  // Check moderation capability
  if (!caps.includes("case.review")) {
    redirect("/staff");
  }

  return <ModerationQueue staff={staff} capabilities={caps} />;
}
