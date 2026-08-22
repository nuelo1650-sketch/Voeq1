"use client";

import { formatRelativeTime, formatAbsoluteTime, formatDateSeparator } from "@/lib/format";

interface MessageView {
  id: string;
  senderId: string;
  body: string;
  state: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  readAt?: string | null;
  clientMsgId?: string;
}

const STATE_LABEL: Record<string, string> = {
  pending: "Sending…",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed to send",
};

export function MessageBubble({
  message,
  own,
  onRetry,
}: {
  message: MessageView;
  own: boolean;
  onRetry?: (m: MessageView) => void;
}) {
  return (
    <div data-testid={`msg-${message.id}`} style={{ display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div
        style={{
          maxWidth: "75%",
          background: own ? "var(--role-accent-strong)" : "var(--role-surface)",
          color: own ? "#fff" : "var(--role-text)",
          padding: "8px 12px",
          borderRadius: 12,
          border: own ? "none" : "1px solid var(--role-border)",
        }}
      >
        <span style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{message.body}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--role-muted)", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
        <span title={formatAbsoluteTime(message.createdAt)}>{formatRelativeTime(message.createdAt)}</span>
        {own && (
          <span data-testid={`msg-state-${message.id}`}>
            {message.state === "read" && message.readAt
              ? `Read ${formatAbsoluteTime(message.readAt)}`
              : STATE_LABEL[message.state] ?? message.state}
          </span>
        )}
        {message.state === "failed" && onRetry && (
          <button data-testid={`retry-${message.id}`} onClick={() => onRetry(message)} style={{ color: "var(--role-danger)" }}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/** VS6.14 — Render a date separator when the day changes. */
export function DateSeparator({ iso }: { iso: string }) {
  return (
    <div data-testid="date-separator" style={{ textAlign: "center", fontSize: 12, color: "var(--role-muted)", margin: "12px 0" }}>
      {formatDateSeparator(iso)}
    </div>
  );
}
