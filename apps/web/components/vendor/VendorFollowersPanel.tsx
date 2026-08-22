"use client";

import { useEffect, useState } from "react";

interface Follower {
  id: string;
  name: string;
  followedAt: string;
}

/**
 * VS5.12 — Followers view (owner-only). Lists who follows this vendor.
 * Names only — no PII (Doc 09 §9.16).
 */
export function VendorFollowersPanel() {
  const [followers, setFollowers] = useState<Follower[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/followers")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setFollowers(d.followers ?? []))
      .catch(() => setError("load_failed"));
  }, []);

  if (error) return <p data-testid="followers-error" style={{ color: "var(--role-danger)" }}>{error}</p>;
  if (followers === null) return <p data-testid="followers-loading">Loading followers…</p>;

  return (
    <section data-testid="followers-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>
        Followers ({followers.length})
      </h2>
      {followers.length === 0 ? (
        <p style={{ color: "var(--role-muted)" }}>No followers yet.</p>
      ) : (
        <ul data-testid="follower-list" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {followers.map((f) => (
            <li key={f.id} data-testid="follower-item" style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius)", padding: 8 }}>
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
