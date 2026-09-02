"use client";

import { formatRelativeTime } from "@/lib/format";

export interface ConversationRow {
  id: string;
  name: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unread: number;
  /** P-A round 49: avatar photo (identity profile photo), if any. */
  photo?: string | null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * ConversationList — premium inbox (P-A round 49 redesign).
 * Avatars (photo or warm initials), one-line preview, time, unread pill.
 * Matches the storefront/thread design language: cream card, forest, amber.
 */
export function ConversationList({ rows }: { rows: ConversationRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="conversations-empty"
        style={{
          textAlign: "center",
          padding: "56px 24px",
          fontFamily: "var(--role-font-ui)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
        <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 18, fontWeight: 600, color: "var(--role-text)" }}>
          No conversations yet
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--role-text-muted)" }}>
          Message a vendor from their storefront or a listing and it'll show here.
        </p>
      </div>
    );
  }
  return (
    <ul data-testid="conversation-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {rows.map((r) => (
        <li key={r.id} data-testid={`conversation-${r.id}`}>
          <a
            href={`/messages/${r.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 12px",
              borderBottom: "1px solid var(--role-border)",
              textDecoration: "none",
              color: "inherit",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--role-surface-sunken)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {/* Avatar: photo when present, warm initials otherwise */}
            <div
              aria-hidden
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                flexShrink: 0,
                background: "linear-gradient(135deg, var(--color-forest) 0%, var(--color-forest-mid) 100%)",
                color: "var(--color-cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--role-font-display)",
                fontWeight: 700,
                fontSize: 18,
                overflow: "hidden",
              }}
            >
              {r.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials(r.name)
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontFamily: "var(--role-font-ui)", fontWeight: 650, fontSize: 15, color: "var(--role-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 11.5, color: r.unread > 0 ? "var(--role-accent-strong)" : "var(--role-text-muted)", fontFamily: "var(--role-font-ui)", fontWeight: r.unread > 0 ? 700 : 400, flexShrink: 0 }}>
                  {formatRelativeTime(r.lastMessageAt)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 13.5,
                    color: "var(--role-text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "var(--role-font-ui)",
                  }}
                >
                  {r.lastMessagePreview || "No messages yet — say hello"}
                </span>
                {r.unread > 0 && (
                  <span
                    data-testid={`unread-${r.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 20,
                      height: 20,
                      background: "var(--role-accent-strong)",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "0 6px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: "var(--role-font-ui)",
                    }}
                  >
                    {r.unread}
                  </span>
                )}
              </div>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
