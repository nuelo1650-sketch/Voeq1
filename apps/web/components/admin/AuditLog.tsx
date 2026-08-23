"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";

/**
 * K3c.7 — Audit log component.
 * Searchable, filterable staff action history.
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

  // Mock audit data
  const mockEntries: AuditEntry[] = [
    {
      id: "a1",
      actor: "admin@voeq.ng",
      actorRole: "super_admin",
      action: "vendor.verify",
      targetType: "vendor",
      targetId: "v123",
      timestamp: new Date(Date.now() - 2 * 3600000),
      reason: "Verified business registration documents",
    },
    {
      id: "a2",
      actor: "moderator@voeq.ng",
      actorRole: "moderator",
      action: "case.resolve",
      targetType: "report",
      targetId: "r456",
      timestamp: new Date(Date.now() - 5 * 3600000),
      reason: "Resolved as false report after investigation",
    },
    {
      id: "a3",
      actor: "admin@voeq.ng",
      actorRole: "super_admin",
      action: "config.update",
      targetType: "category",
      targetId: "cat-food",
      timestamp: new Date(Date.now() - 24 * 3600000),
      reason: "Updated category display name",
    },
  ];

  const filteredEntries = mockEntries.filter(entry => {
    if (filterType !== "all" && entry.targetType !== filterType) return false;
    if (searchQuery && !entry.action.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !entry.actor.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const detailEntry = detailId ? mockEntries.find(e => e.id === detailId) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/staff" style={{ fontSize: 14, color: "#1976D2", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "#212121", fontWeight: 700 }}>
          Audit Log
        </h1>
        <p style={{ margin: "4px 0 24px", fontSize: 14, color: "#666" }}>
          All staff actions are logged here
        </p>

        {/* Search and Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
            <input
              type="search"
              placeholder="Search by action or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                fontSize: 14,
                border: "1px solid #E0E0E0",
                borderRadius: 6,
                background: "#fff",
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "10px 32px 10px 12px",
              fontSize: 14,
              border: "1px solid #E0E0E0",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
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
        <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
          Showing {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
        </p>

        {/* Entries table */}
        <div style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F5F5F5", borderBottom: "1px solid #E0E0E0" }}>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <td style={tdStyle}>
                    <div>
                      <div style={{ fontSize: 14, color: "#212121", fontWeight: 500 }}>{entry.actor}</div>
                      <div style={{ fontSize: 12, color: "#999", textTransform: "capitalize" }}>{entry.actorRole.replace("_", " ")}</div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ ...badgeStyle, background: "#E3F2FD", color: "#1976D2" }}>
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
                        border: "1px solid #E0E0E0",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 13,
                        cursor: "pointer",
                        color: "#1976D2",
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
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
              background: "rgba(0,0,0,0.5)",
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
                background: "#fff",
                borderRadius: 8,
                padding: 24,
                maxWidth: 600,
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px", color: "#212121" }}>
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
                  background: "#1976D2",
                  color: "#fff",
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
    <div style={{ borderBottom: "1px solid #F5F5F5", paddingBottom: 8 }}>
      <div style={{ fontSize: 12, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#212121" }}>{value}</div>
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
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
  color: "#212121",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
};
