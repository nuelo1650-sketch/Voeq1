"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";

/**
 * NotificationBell — VS4.8. Shows unread badge, dropdown list, mark-read on click.
 * Auth-gated: unauthed shows a "Sign in" CTA (no fake bell).
 */
export function NotificationBell() {
  const pathname = usePathname();
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; read: boolean }>>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setItems(d.notifications);
        setUnread(d.unread);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [open]);

  // Unauthed: honest CTA.
  if (loaded && items.length === 0 && unread === 0) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        data-testid="notification-bell-guest"
        style={{ color: "var(--role-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}
      >
        <Bell size={18} /> Sign in for notifications
      </Link>
    );
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }
  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  return (
    <div data-testid="notification-bell" style={{ position: "relative", display: "inline-flex" }}>
      <button
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((o) => !o)}
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--role-text)", position: "relative", padding: 4 }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span data-testid="notification-badge" style={{ position: "absolute", top: -2, right: -2, background: "var(--role-danger)", color: "#fff", borderRadius: 999, fontSize: 11, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div data-testid="notification-dropdown" style={{ position: "absolute", right: 0, top: 36, width: 280, background: "var(--surface-1)", border: "1px solid var(--role-border)", borderRadius: "var(--radius-card)", padding: "var(--space-2)", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontFamily: "var(--role-font-ui)" }}>Notifications</strong>
            {unread > 0 && <button onClick={markAll} data-testid="notification-mark-all" style={{ background: "none", border: "none", color: "var(--role-accent-strong)", fontSize: 12, cursor: "pointer" }}>Mark all read</button>}
          </div>
          {items.length === 0 ? (
            <p style={{ color: "var(--role-muted)", fontSize: 13 }}>No notifications yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((n) => (
                <li key={n.id} onClick={() => !n.read && markRead(n.id)} data-testid="notification-item" style={{ fontSize: 13, padding: 6, borderRadius: 8, background: n.read ? "transparent" : "var(--role-surface)", cursor: n.read ? "default" : "pointer" }}>
                  <strong>{n.title}</strong>
                  <div style={{ color: "var(--role-muted)" }}>{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
