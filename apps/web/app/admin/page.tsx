import StaffDashboardPage from "@/app/staff/page";

export const dynamic = "force-dynamic";

/**
 * /admin — thin alias to /staff.
 *
 * Same role-gated content as /staff; distinct URL so a future role-split
 * (moderation vs super-admin) can branch without renaming staff.
 *
 * We re-export the staff page component directly. The staff page already
 * guards with getStaffIdentity() and redirects unauthed/non-staff to
 * /login?next=, so we get the same protection for free here.
 */
export default StaffDashboardPage;
