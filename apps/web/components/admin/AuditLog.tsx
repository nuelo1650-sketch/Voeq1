"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";

/**
 * K3c.7 — Audit log component.
 * Searchable, filterable staff action history.
 * Token-driven (no raw hex).
 */

interface AuditEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: Date;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function AuditLog({ staff }: { staff: { email: string } }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/staff/audit")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.ok) return;
        setEntries(
          (d.entries as Array<{
            id: string;
            type: string;
            identityId: string | null;
            metadata: Record<string, unknown>;
            adminAction?: boolean;
            at: string;
          }>).map((e) => ({
            id: e.id,
            actor: e.identityId ?? "system",
            actorRole: e.adminAction ? "staff" : "user",
            action: e.type,
            targetType: (e.metadata?.targetType as string) ?? e.type,
            targetId: (e.metadata?.targetId as string) ?? e.id,
            timestamp: new Date(e.at),
            reason: (e.metadata?.reason as string) ?? undefined,
            metadata: e.metadata,
          })),
        );
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = entries.filter((entry) => {
    if (filterType !== "all" && entry.targetType !== filterType) return false;
    if (
      searchQuery &&
      !entry.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entry.actor.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const detailEntry = detailId ? entries.find((e) => e.id === detailId) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--role-surface-sunken, #FAF6EC)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/staff" style={{ fontSize: 14, color: "var(--role-accent-strong, #0F2A1D)", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--color-forest, #0F2A1D)", fontWeight: 700 }}>
          Audit Log
        </h1>
        <p style={{ margin: "4px 0 24px", fontSize: 14, color: "var(--role-text-muted, #5b6b60)" }}>
          All staff actions are logged here
        </p>

        {/* Search and Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--role-text-muted, #5b6b60)" }} />
            <input
              type="search"
              placeholder="Search by action or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                fontSize: 14,
                border: "1px solid var(--role-border, rgba(15,42,29,0.12))",
                borderRadius: 6,
                background: "var(--role-surface, #fff)",
                fontFamily: "var(--role-font-ui)",
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "10px 32px 10px 12px",
              fontSize: 14,
              border: "1px solid var(--role-border, rgba(15,42,29,0.12))",
              borderRadius: 6,
              background: "var(--role-surface, #fff)",
              cursor: "pointer",
              fontFamily: "var(--role-font-ui)",
            }}
          >
            <option value="all">All types</option>
            <option value="vendor">Vendors</option>
            <option value="report">Reports</option>
            <option value="category">Categories</option>
            <option value="user">Users</option>
          </select>
        </div>

        {/* Results count */}
        <p style={{ fontSize: 14, color: "var(--role-text-muted, #5b6b60)", marginBottom: 16 }}>
          {loading ? "Loading…" : `Showing ${filteredEntries.length} ${filteredEntries.length === 1 ? "entry" : "entries"}`}
        </p>

        {/* Entries table */}
        <div style={{ background: "var(--role-surface, #fff)", border: "1px solid var(--role-border, rgba(15,42,29,0.12))", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: "var(--role-surface-sunken, #FAF6EC)", borderBottom: "1px solid var(--role-border, rgba(15,42,29,0.12))" }}>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid var(--role-surface-sunken, #FAF6EC)" }}>
                  <td style={tdStyle}>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--color-forest, #0F2A1D)", fontWeight: 500 }}>{entry.actor}</div>
                      <div style={{ fontSize: 12, color: "var(--role-text-muted, #5b6b60)", textTransform: "capitalize" }}>{entry.actorRole.replace("_", " ")}</div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ ...badgeStyle, background: "var(--role-accent-subtle, #E8F0EA)", color: "var(--role-accent-strong, #0F2A1D)" }}>
                      {entry.action}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {entry.targetType} #{entry.targetId}
                  </td>
                  <td style={tdStyle}>{formatTimestamp(entry.timestamp)}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => setDetailId(entry.id)}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--role-border, rgba(15,42,29,0.12))",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 13,
                        cursor: "pointer",
                        color: "var(--role-accent-strong, #0F2A1D)",
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", padding: 32, color: "var(--role-text-muted, #5b6b60)" }}>
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail modal */}
        {detailEntry && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15,42,29,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setDetailId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--role-surface, #fff)",
                borderRadius: 8,
                padding: 24,
                maxWidth: 600,
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px", color: "var(--color-forest, #0F2A1D)" }}>
                Audit Entry Details
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <DetailRow label="Entry ID" value={detailEntry.id} />
                <DetailRow label="Actor" value={`${detailEntry.actor} (${detailEntry.actorRole})`} />
                <DetailRow label="Action" value={detailEntry.action} />
                <DetailRow label="Target" value={`${detailEntry.targetType} #${detailEntry.targetId}`} />
                <DetailRow label="Timestamp" value={detailEntry.timestamp.toLocaleString()} />
                {detailEntry.reason && <DetailRow label="Reason" value={detailEntry.reason} />}
                {detailEntry.metadata && (
                  <DetailRow label="Metadata" value={<pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(detailEntry.metadata, null, 2)}</pre>} />
                )}
              </div>
              <button
                onClick={() => setDetailId(null)}
                style={{
                  marginTop: 24,
                  padding: "10px 20px",
                  background: "var(--role-accent-strong, #0F2A1D)",
                  color: "var(--role-on-accent, #F5F1E8)",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid var(--role-surface-sunken, #FAF6EC)", paddingBottom: 8 }}>
      <div style={{ fontSize: 12, color: "var(--role-text-muted, #5b6b60)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--color-forest, #0F2A1D)" }}>{value}</div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const thStyle: React.CSSProperties = {
  padding: 12,
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--role-text-muted, #5b6b60)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
  color: "var(--color-forest, #0F2A1D)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
};
