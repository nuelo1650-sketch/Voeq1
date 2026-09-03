import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentIdentity, getStaffIdentity, SESSION_COOKIE } from "@/lib/session";
import { mockVendorRepo, mockUserPrefRepo, mockSessionRepo, mockCampusRepo } from "@voeq/data";
import { SettingsForms } from "@/components/shopper/SettingsForms";
import { AppShell } from "@/components/shell/AppShell";

/**
 * VS3.6 (Reversal 8) + VS4.11 + K3a.2 enhanced. Settings with 4 sections:
 * Profile (avatar, name, bio), Notifications (toggles, quiet hours), Campus
 * (selector, sub-area), Account (sessions, danger zone). Sidebar/tab navigation,
 * inline save, confirmation modals.
 */
export default async function SettingsPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/settings");

  const isVendor = !!identity.vendorId;
  const vendorLabel = isVendor ? (await mockVendorRepo.getById(identity.vendorId!))?.name : null;
  // P-A round 66: staff (super_admin/admin/moderator) get a clear path to the
  // admin console. Previously there was NO admin link from shopper/vendor UI.
  const staff = await getStaffIdentity();
  const isStaff = !!staff;
  const prefs = await mockUserPrefRepo.get(identity.id);
  const notifPrefs = (prefs?.notificationPrefs ?? {}) as Record<string, "email" | "in_app" | "both" | "off">;

  // Real sessions from the session repo (no more hardcoded samples).
  const store = await cookies();
  const currentSessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const realSessions = await mockSessionRepo.listForIdentity(identity.id);
  const sessions = realSessions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    current: s.id === currentSessionId,
  }));
  const campusList = await mockCampusRepo.list(identity.id);

  return (
    <AppShell role="shopper" userName={identity.name}>
      <main
        data-testid="settings-page"
        style={{
          minHeight: "100vh",
          background: "var(--color-glass-white)",
          padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)",
        }}
      >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          marginBottom: "var(--space-4)",
          color: "var(--color-forest)",
        }}
      >
        Settings
      </h1>

      <SettingsForms
        identity={{
          id: identity.id,
          name: identity.name,
          email: identity.email,
          role: identity.role,
          campus: identity.campus,
        }}
        initialPrefs={notifPrefs}
        campuses={campusList.map((c) => ({ id: c.id, name: c.name }))}
        sessions={sessions}
      />

      {!isVendor && (
        <section
          style={{
            marginTop: "var(--space-4)",
            border: "1px solid var(--color-amber)",
            borderRadius: 8,
            padding: "var(--space-3)",
            background: "var(--color-cream)",
            maxWidth: 600,
          }}
          data-testid="settings-become-vendor"
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              margin: 0,
              marginBottom: 8,
              color: "var(--color-forest)",
            }}
          >
            Selling
          </h2>
          <p style={{ color: "var(--color-ink-muted)", marginTop: 0, marginBottom: "var(--space-2)", fontSize: 14 }}>
            Turn your skills or products into a campus business — free to list.
          </p>
          <Link
            href="/become-vendor"
            data-testid="settings-become-vendor-cta"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "var(--color-forest)",
              color: "var(--color-cream)",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Become a vendor
          </Link>
        </section>
      )}

      {isVendor && (
        <section
          style={{
            marginTop: "var(--space-4)",
            border: "1px solid var(--color-forest-light)",
            borderRadius: 8,
            padding: "var(--space-3)",
            background: "var(--color-cream)",
            maxWidth: 600,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              margin: 0,
              marginBottom: 8,
              color: "var(--color-forest)",
            }}
          >
            Your business
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-ink-muted)", marginBottom: 12 }}>
            You&apos;re a vendor{vendorLabel ? `: ${vendorLabel}` : ""}.
          </p>
          <Link
            href="/vendor/dashboard"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "var(--color-forest)",
              color: "var(--color-cream)",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Go to dashboard
          </Link>
        </section>
      )}

      {/* P-A round 66: ADMIN CONSOLE path — staff roles had NO link from the
          shopper/vendor UI. super_admin/admin/moderator now see it here. */}
      {isStaff && (
        <section
          style={{
            marginTop: "var(--space-4)",
            border: "1px solid var(--color-forest)",
            borderRadius: 8,
            padding: "var(--space-3)",
            background: "var(--color-cream)",
            maxWidth: 600,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              margin: "0 0 8px",
              color: "var(--color-forest)",
            }}
          >
            Admin console
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-ink-muted)", marginBottom: 12 }}>
            Staff role: <strong>{staff!.staffRole}</strong>.
          </p>
          <Link
            href="/admin"
            data-testid="settings-admin-console"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "var(--color-forest)",
              color: "var(--color-cream)",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Open admin console
          </Link>
        </section>
      )}
    </main>
    </AppShell>
  );
}
