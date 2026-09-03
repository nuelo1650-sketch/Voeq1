"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, LogOut, X, ShieldCheck } from "lucide-react";
import { AppRole, PRIMARY_NAV, CENTER_NAV, STAFF_SIDE_NAV, SIDE_NAV, NavItem } from "./navItems";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { NotificationBell } from "@/components/shopper/NotificationBell";

const SHELL_CSS = {
  root: {
    minHeight: "100vh",
    display: "flex" as const,
    flexDirection: "column" as const,
  },
  topbar: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    height: 56,
    padding: "0 var(--nav-inline-pad, 16px)",
    background: "var(--color-glass-white, #fff)",
    borderBottom: "1px solid var(--role-border, #e6e1d6)",
  },
  logo: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 600,
    color: "var(--color-forest, #0F2A1D)",
    textDecoration: "none",
  },
  centerLinks: {
    display: "flex" as const,
    gap: 4,
    alignItems: "center" as const,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: "var(--radius, 8px)",
    color: "var(--role-muted, #5b6b60)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },
  navLinkActive: {
    background: "var(--color-cream, #F5F3EF)",
    color: "var(--color-forest, #0F2A1D)",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: "var(--radius, 8px)",
    border: "1px solid var(--role-border, #e6e1d6)",
    background: "transparent",
    color: "var(--color-forest, #0F2A1D)",
    cursor: "pointer",
  },
  drawer: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 100,
    background: "rgba(15,42,29,0.4)",
  },
  drawerPanel: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    background: "var(--color-glass-white, #fff)",
    padding: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    boxShadow: "2px 0 16px rgba(0,0,0,0.12)",
  },
  bottomTab: {
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: "flex" as const,
    borderTop: "1px solid var(--role-border, #e6e1d6)",
    background: "var(--color-glass-white, #fff)",
    paddingBottom: "env(safe-area-inset-bottom, 0)",
  },
  bottomItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 2,
    padding: "8px 0",
    color: "var(--role-muted, #5b6b60)",
    textDecoration: "none",
    fontSize: 11,
  },
  sideNav: {
    width: 240,
    flexShrink: 0,
    borderRight: "1px solid var(--role-border, #e6e1d6)",
    background: "var(--color-glass-white, #fff)",
    padding: "var(--space-3, 16px)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    minHeight: "calc(100vh - 56px)",
  },
} as const;

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      style={{ ...SHELL_CSS.navLink, ...(active ? SHELL_CSS.navLinkActive : {}) }}
    >
      <Icon size={18} />
      <span>{item.label}</span>
      {item.badge && (
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: "var(--role-success-bg)", color: "var(--role-success-text)" }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function BottomItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      style={{ ...SHELL_CSS.bottomItem, ...(active ? { color: "var(--color-forest, #0F2A1D)" } : {}) }}
    >
      <Icon size={20} />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({
  role,
  userName,
  children,
  staffRole,
}: {
  role: AppRole;
  userName: string;
  children: React.ReactNode;
  /** P-A round 69: identity.staffRole (super_admin/admin/moderator) — when
      present, the shell surfaces an ADMIN entry in nav (sidebar + drawer).
      Previously admin lived buried in /settings; it belongs in the shell. */
  staffRole?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const primary = PRIMARY_NAV[role];
  const center = CENTER_NAV[role];
  const isStaff = role === "staff";
  // P-A round 69: staffRole holders get an Admin entry even when their app role
  // is shopper/vendor (the "shopper with super_admin" case — David's identity).
  const adminItem = staffRole
    ? [{ href: "/admin", label: "Admin", icon: ShieldCheck, badge: staffRole }]
    : [];
  const primaryWithAdmin = [...primary, ...adminItem];
  const centerWithAdmin = [...center, ...adminItem];
  const sideWithAdmin = isStaff ? STAFF_SIDE_NAV : [...SIDE_NAV[role as Exclude<AppRole, "staff">], ...adminItem];
  // Desktop sidebar items: staff uses STAFF_SIDE_NAV, shopper/vendor use SIDE_NAV
  const sideItems = sideWithAdmin;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={SHELL_CSS.root}>
      <style>{`
        .app-shell-sidebar { display: none !important; }
        .app-shell-bottom { display: flex !important; }
        .app-shell-hamburger { display: flex !important; }
        .app-shell-center { display: none !important; }
        @media (min-width: 1024px) {
          .app-shell-sidebar { display: flex !important; }
          .app-shell-bottom { display: none !important; }
          .app-shell-hamburger { display: none !important; }
          .app-shell-center { display: flex !important; }
        }
      `}</style>

      {/* Top bar (all roles, all sizes) */}
      <header style={SHELL_CSS.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            aria-label="Open menu"
            className="app-shell-hamburger"
            style={SHELL_CSS.iconBtn}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <BrandLogo width={94} />
          </Link>
        </div>

        {/* Center nav (desktop ≥1024px only; sidebar handles <1024px) */}
        {centerWithAdmin.length > 0 && (
          <nav className="app-shell-center" style={SHELL_CSS.centerLinks}>
            {centerWithAdmin.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* P-A round 66: REAL bell (unread badge + dropdown). The AppShell
              previously rendered a bare <Bell> Link with NO badge — a user
              with an unread notification saw nothing. Round 79: pass the
              viewer role so new_message/new_review deep-links route correctly. */}
          <NotificationBell viewerRole={staffRole ? "staff" : role === "vendor" ? "vendor" : "shopper"} />
          <button aria-label="Sign out" style={SHELL_CSS.iconBtn} onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Body: sidebar (desktop) + content */}
      <div style={{ display: "flex", flex: 1, minHeight: "calc(100vh - 56px)" }}>
        {/* Left sidebar — desktop ≥1024px (all roles) */}
        <nav className="app-shell-sidebar" style={SHELL_CSS.sideNav}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--role-muted)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 12px 8px", marginTop: 4 }}>
            {isStaff ? "Admin" : role === "vendor" ? "Vendor" : "Shopper"}
          </span>
          {sideItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
          <button
            onClick={logout}
            style={{ ...SHELL_CSS.navLink, marginTop: "auto", color: "var(--role-danger, #b3261e)" }}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: "var(--space-3, 16px) var(--nav-inline-pad, 16px)", minWidth: 0, paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
          {children}
        </main>
      </div>

      {/* Bottom tab — mobile <1024px only */}
      {primaryWithAdmin.length > 0 && (
        <nav className="app-shell-bottom" style={SHELL_CSS.bottomTab}>
          {primaryWithAdmin.map((item) => (
            <BottomItem key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>
      )}

      {/* Mobile drawer — hamburger menu (<1024px) */}
      {drawerOpen && (
        <div style={SHELL_CSS.drawer} onClick={() => setDrawerOpen(false)}>
          <div style={SHELL_CSS.drawerPanel} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--color-forest, #0F2A1D)" }}>
                {userName || "voeq"}
              </span>
              <button aria-label="Close menu" style={SHELL_CSS.iconBtn} onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {sideItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setDrawerOpen(false)} />
            ))}
            <button
              onClick={logout}
              style={{ ...SHELL_CSS.navLink, marginTop: "auto", color: "var(--role-danger, #b3261e)" }}
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
