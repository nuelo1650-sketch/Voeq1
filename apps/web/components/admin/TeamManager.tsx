"use client";

import { useState } from "react";

interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: string;
  staffRole: string | null;
  accountStatus: string;
  isSelf: boolean;
}

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  super_admin: { bg: "var(--role-accent)", color: "var(--role-surface)", label: "Super Admin" },
  admin: { bg: "color-mix(in srgb, var(--role-accent) 18%, var(--role-surface))", color: "var(--role-accent)", label: "Admin" },
  moderator: { bg: "var(--role-surface-sunken)", color: "var(--role-text-muted)", label: "Moderator" },
};

export function TeamManager({ rows, roleLabel, canGrantSuperAdmin }: {
  rows: TeamRow[];
  roleLabel: Record<string, string>;
  canGrantSuperAdmin: boolean;
}) {
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [kind, setKind] = useState<"ok" | "error">("ok");

  const promote = async (row: TeamRow, newRole: string) => {
    setActing(row.id);
    setMessage(null);
    try {
      const res = await fetch("/api/staff/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIdentityId: row.id, newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setKind("error");
        setMessage(`Failed: ${(data as { error?: string }).error ?? res.status}`);
      } else {
        setKind("ok");
        setMessage(`${row.name} → ${roleLabel[newRole]} ✓`);
      }
    } catch {
      setKind("error");
      setMessage("Network error — action not applied.");
    }
    setActing(null);
  };

  return (
    <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--role-text)" }}>Users</h2>
        <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>Promotions are audited and server-authoritative</span>
      </div>

      {message && (
        <div
          data-testid="team-toast"
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 14,
            fontWeight: 600,
            color: kind === "ok" ? "var(--role-accent)" : "var(--role-danger)",
            background: kind === "ok" ? "color-mix(in srgb, var(--role-accent) 8%, var(--role-surface))" : "color-mix(in srgb, var(--role-danger) 8%, var(--role-surface))",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--role-border)" }}>
              <th style={{ textAlign: "left", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>User</th>
              <th style={{ textAlign: "left", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Role</th>
              <th style={{ textAlign: "right", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const badge = row.staffRole ? ROLE_BADGE[row.staffRole] : null;
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--role-surface-sunken)" }}>
                  <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)" }}>
                    <div style={{ fontWeight: 600 }}>{row.name}{row.isSelf && <span style={{ color: "var(--role-text-muted)", fontWeight: 400 }}> (you)</span>}</div>
                    <div style={{ fontSize: 12, color: "var(--role-text-muted)" }}>{row.email}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    {badge ? (
                      <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--role-text-muted)" }}>Shopper</span>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    {!row.isSelf && (
                      <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button
                          data-testid={`promote-${row.name.slice(0, 12)}-moderator`}
                          disabled={acting === row.id}
                          onClick={() => promote(row, "moderator")}
                          style={btnStyle}
                        >
                          Moderator
                        </button>
                        <button
                          data-testid={`promote-${row.name.slice(0, 12)}-admin`}
                          disabled={acting === row.id}
                          onClick={() => promote(row, "admin")}
                          style={btnStyle}
                        >
                          Admin
                        </button>
                        {canGrantSuperAdmin && (
                          <button
                            data-testid={`promote-${row.name.slice(0, 12)}-superadmin`}
                            disabled={acting === row.id}
                            onClick={() => promote(row, "super_admin")}
                            style={{ ...btnStyle, background: "var(--role-accent)", color: "var(--role-surface)", border: "none" }}
                          >
                            Super Admin
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--role-font-ui)",
  borderRadius: 999,
  background: "var(--role-surface)",
  color: "var(--role-accent)",
  border: "1px solid color-mix(in srgb, var(--role-accent) 40%, transparent)",
  cursor: "pointer",
};
