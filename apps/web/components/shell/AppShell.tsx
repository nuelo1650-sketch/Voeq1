"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, LogOut, X } from "lucide-react";
import { AppRole, PRIMARY_NAV, CENTER_NAV, STAFF_SIDE_NAV, NavItem } from "./navItems";

const SHELL_CSS = {
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
    display: "flex",
    gap: 4,
    alignItems: "center",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: "var(--radius, 8px)",
    color: "var(--role-muted, #5b6b60)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
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
    display: "flex",
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
    width: 220,
    flexShrink: 0,
    borderRight: "1px solid var(--role-border, #e6e1d6)",
    background: "var(--color-glass-white, #fff)",
    padding: 16,
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
}: {
  role: AppRole;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const center = CENTER_NAV[role];
  const primary = PRIMARY_NAV[role];
  const isStaff = role === "staff";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: isStaff ? "flex" : "block" }}>
      <style>{`
        .app-shell-center { display: none !important; }
        @media (min-width: 768px) {
          .app-shell-center { display: flex !important; }
        }
      `}</style>
      {/* Top bar */}
      <header style={SHELL_CSS.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isStaff && (
            <button
              aria-label="Open menu"
              style={SHELL_CSS.iconBtn}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} />
            </button>
          )}
          <Link href="/" style={SHELL_CSS.logo}>
            voeq
          </Link>
        </div>

        {center.length > 0 && (
          <nav className="app-shell-center" style={SHELL_CSS.centerLinks}>
            {center.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/notifications" aria-label="Notifications" style={SHELL_CSS.iconBtn}>
            <Bell size={18} />
          </Link>
          <button aria-label="Sign out" style={SHELL_CSS.iconBtn} onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Staff: sidebar layout */}
      {isStaff && (
        <div style={{ display: "flex", flex: 1 }}>
          <nav style={SHELL_CSS.sideNav}>
            {STAFF_SIDE_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
          <main style={{ flex: 1, padding: "var(--space-3, 16px) var(--nav-inline-pad, 16px)", minWidth: 0 }}>
            {children}
          </main>
        </div>
      )}

      {/* Non-staff: top-bar + content + bottom-tab */}
      {!isStaff && (
        <>
          <main
            style={{
              padding: "var(--space-3, 16px) var(--nav-inline-pad, 16px)",
              paddingBottom: primary.length > 0 ? 72 : 24,
              minHeight: "calc(100vh - 56px)",
            }}
          >
            {children}
          </main>

          {primary.length > 0 && (
            <nav style={SHELL_CSS.bottomTab}>
              {primary.map((item) => (
                <BottomItem key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </nav>
          )}

          {/* Mobile drawer */}
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
                {CENTER_NAV[role].map((item) => (
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
        </>
      )}
    </div>
  );
}
