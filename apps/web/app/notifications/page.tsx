"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type: string;
}

/**
 * /notifications — full notification list (VS4.8). Auth-gated client view.
 * Mark-read on click; mark-all button. Honest empty state.
 */
export default function NotificationsPage() {
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const r = await fetch("/api/notifications");
    if (r.ok) {
      const d = await r.json();
      setItems(d.notifications);
      setUnread(d.unread);
    }
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }
  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((p) => p.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  return (
    <main data-testid="notifications-page" style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)", margin: 0 }}>Notifications</h1>
        {unread > 0 && (
          <button onClick={markAll} data-testid="notifications-mark-all" style={{ background: "none", border: "1px solid var(--role-accent-strong)", color: "var(--role-accent-strong)", borderRadius: "var(--radius)", padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
            Mark all read
          </button>
        )}
      </header>

      {!loaded ? (
        <p style={{ color: "var(--role-muted)" }}>Loading…</p>
      ) : items.length === 0 ? (
        <p data-testid="notifications-empty" style={{ color: "var(--role-muted)" }}>No notifications yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              data-testid="notification-row"
              style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius-card)", padding: "var(--space-3)", background: n.read ? "var(--surface-1)" : "var(--role-surface)", cursor: n.read ? "default" : "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontFamily: "var(--role-font-ui)" }}>{n.title}</strong>
                {!n.read && <span data-testid="notification-unread-dot" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--role-danger)", flexShrink: 0 }} />}
              </div>
              <p style={{ color: "var(--role-muted)", fontSize: 14, margin: "6px 0 0" }}>{n.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "var(--space-4)" }}>
        <Link href="/home" style={{ color: "var(--role-accent-strong)", textDecoration: "none", fontSize: 14 }}>← Back to dashboard</Link>
      </div>
    </main>
  );
}
