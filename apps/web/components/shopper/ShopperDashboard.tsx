"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HomeData {
  savedListings: (string | null)[];
  savedVendors: (string | null)[];
  following: string[];
  reviewCount: number;
  notifications: Array<{ id: string; title: string; body: string; read: boolean; createdAt: string }>;
  unreadNotifications: number;
  recommended: Array<{ id: string; title: string; vendorName: string; priceMinor: number }>;
}

function Section({ title, testid, href, children }: { title: string; testid: string; href?: string; children: React.ReactNode }) {
  return (
    <section data-testid={testid} style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius-card)", padding: "var(--space-3)", background: "var(--surface-1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", margin: 0 }}>{title}</h2>
        {href && <Link href={href} style={{ color: "var(--role-accent-strong)", fontSize: 13, textDecoration: "none" }}>See all</Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: "var(--role-muted)", fontSize: 14 }}>{text}</p>;
}

/**
 * ShopperDashboard — VS4.7. Five honest sections: Saved, Following, Recommended,
 * Activity, Notifications preview. No fake counts.
 */
export function ShopperDashboard({ name }: { name: string }) {
  const [data, setData] = useState<HomeData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/home")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setErr("Could not load your dashboard."));
    return () => { cancelled = true; };
  }, []);

  if (err) return <p style={{ color: "var(--role-danger)" }}>{err}</p>;
  if (!data) return <p style={{ color: "var(--role-muted)" }}>Loading…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Section title="Saved" testid="home-saved" href="/explore">
        {data.savedListings.length + data.savedVendors.length === 0 ? (
          <Empty text="Nothing saved yet. Tap the heart on any listing or vendor." />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--role-fg)" }}>
            {data.savedListings.map((id) => id && <li key={`l-${id}`}><Link href={`/listing/${id}`} style={{ color: "var(--role-fg)" }}>{id}</Link></li>)}
            {data.savedVendors.map((id) => id && <li key={`v-${id}`}><Link href={`/vendor/${id}`} style={{ color: "var(--role-fg)" }}>{id}</Link></li>)}
          </ul>
        )}
      </Section>

      <Section title="Following" testid="home-following" href="/explore">
        {data.following.length === 0 ? (
          <Empty text="Not following anyone yet." />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--role-fg)" }}>
            {data.following.map((id) => <li key={id}><Link href={`/vendor/${id}`} style={{ color: "var(--role-fg)" }}>{id}</Link></li>)}
          </ul>
        )}
      </Section>

      <Section title="Recommended" testid="home-recommended" href="/explore">
        {data.recommended.length === 0 ? (
          <Empty text="Nothing trending on your campus yet." />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--role-fg)" }}>
            {data.recommended.slice(0, 6).map((r) => <li key={r.id}><Link href={`/listing/${r.id}`} style={{ color: "var(--role-fg)" }}>{r.title} — {r.vendorName}</Link></li>)}
          </ul>
        )}
      </Section>

      <Section title="Activity" testid="home-activity">
        <p style={{ color: "var(--role-muted)", fontSize: 14, margin: "0 0 6px" }}>
          Reviews written: <strong style={{ color: "var(--role-fg)" }}>{data.reviewCount}</strong>
        </p>
        <p style={{ color: "var(--role-muted)", fontSize: 14, margin: 0 }}>
          Unread notifications: <strong style={{ color: "var(--role-fg)" }}>{data.unreadNotifications}</strong>
        </p>
      </Section>

      <Section title="Notifications" testid="home-notifications" href="/notifications">
        {data.notifications.length === 0 ? (
          <Empty text="No notifications yet." />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {data.notifications.map((n) => (
              <li key={n.id} style={{ fontSize: 14, color: n.read ? "var(--role-muted)" : "var(--role-fg)" }}>
                <strong>{n.title}</strong> — {n.body}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
