"use client";

import { formatRelativeTime } from "@/lib/format";

export interface ConversationRow {
  id: string;
  name: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unread: number;
}

export function ConversationList({ rows }: { rows: ConversationRow[] }) {
  if (rows.length === 0) {
    return <p data-testid="conversations-empty" style={{ color: "var(--role-muted)", padding: 16 }}>No conversations yet.</p>;
  }
  return (
    <ul data-testid="conversation-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {rows.map((r) => (
        <li key={r.id} data-testid={`conversation-${r.id}`}>
          <a
            href={`/messages/${r.id}`}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottom: "1px solid var(--role-border)", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: "var(--role-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
                {r.lastMessagePreview || "No messages yet"}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--role-muted)", textAlign: "right" }}>
              <div>{formatRelativeTime(r.lastMessageAt)}</div>
              {r.unread > 0 && (
                <span data-testid={`unread-${r.id}`} style={{ display: "inline-block", minWidth: 18, background: "var(--role-accent-strong)", color: "#fff", borderRadius: 9, padding: "0 5px", marginTop: 2 }}>
                  {r.unread}
                </span>
              )}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
