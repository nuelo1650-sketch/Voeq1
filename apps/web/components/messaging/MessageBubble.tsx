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

/**
 * MessageBubble — P-A round 56 (modern messaging UX).
 * Premium chat look: own messages = forest pill with a soft tail + amber tick
 * read-state; theirs = cream card with hairline border. Timestamps INSIDE the
 * bubble row (was dangling gray text w/ no visual anchor). Entrance anim.
 */
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
    <div
      data-testid={`msg-${message.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: own ? "flex-end" : "flex-start",
        marginBottom: 10,
        animation: "msgIn 180ms ease",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: own ? "linear-gradient(135deg, var(--color-forest) 0%, var(--color-forest-mid) 100%)" : "var(--role-surface)",
          color: own ? "var(--color-cream)" : "var(--role-text)",
          padding: "10px 14px",
          borderRadius: own ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
          border: own ? "none" : "1px solid var(--role-border)",
          boxShadow: own ? "0 4px 12px rgba(15,42,29,.22)" : "0 2px 6px rgba(15,42,29,.05)",
          fontFamily: "var(--role-font-ui)",
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontSize: 14.5, whiteSpace: "pre-wrap" }}>{message.body}</span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--role-muted)",
          marginTop: 3,
          display: "flex",
          gap: 6,
          alignItems: "center",
          fontFamily: "var(--role-font-ui)",
          padding: "0 2px",
        }}
      >
        <span title={formatAbsoluteTime(message.createdAt)}>{formatRelativeTime(message.createdAt)}</span>
        {own && (
          <span data-testid={`msg-state-${message.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            {/* double-tick: amber when read for a premium touch */}
            <svg width="14" height="10" viewBox="0 0 16 12" style={{ opacity: message.state === "read" ? 1 : 0.65 }}>
              <path d="M1 6.5L4.5 10L11 2" stroke={message.state === "read" ? "#E8A33D" : "currentColor"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 8L13.5 2" stroke={message.state === "read" ? "#E8A33D" : "currentColor"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
            </svg>
            <span>
              {message.state === "read" && message.readAt
                ? `Read ${formatAbsoluteTime(message.readAt)}`
                : STATE_LABEL[message.state] ?? message.state}
            </span>
          </span>
        )}
        {message.state === "failed" && onRetry && (
          <button
            data-testid={`retry-${message.id}`}
            onClick={() => onRetry(message)}
            style={{
              color: "var(--role-danger)",
              background: "none",
              border: "1px solid color-mix(in srgb, var(--role-danger) 35%, transparent)",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
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
    <div
      data-testid="date-separator"
      style={{
        textAlign: "center",
        fontSize: 11.5,
        color: "var(--role-muted)",
        margin: "14px 0",
        fontFamily: "var(--role-font-ui)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ flex: 1, height: 1, background: "var(--role-border)" }} />
      <span>{formatDateSeparator(iso)}</span>
      <span style={{ flex: 1, height: 1, background: "var(--role-border)" }} />
    </div>
  );
}
