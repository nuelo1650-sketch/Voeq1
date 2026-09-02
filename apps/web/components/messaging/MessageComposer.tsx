"use client";

import { useEffect, useRef, useState } from "react";

const MAX = 4000;

export function MessageComposer({
  conversationId,
  disabled = false,
  disabledReason,
  onSend,
}: {
  conversationId: string;
  disabled?: boolean;
  disabledReason?: string;
  onSend: (body: string, clientMsgId: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const draftKey = `voeq:msg-draft:${conversationId}`;
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Rehydrate draft (VS6.18)
  useEffect(() => {
    if (disabled) return;
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(draftKey) : null;
    if (saved) setText(saved);
  }, [draftKey, disabled]);

  useEffect(() => {
    if (disabled) return;
    const t = setTimeout(() => {
      if (typeof window !== "undefined") window.localStorage.setItem(draftKey, text);
    }, 500);
    return () => clearTimeout(t);
  }, [text, draftKey, disabled]);

  const overLimit = text.length > MAX;
  const nearLimit = text.length > 3800;

  async function submit() {
    const body = text.trim();
    if (!body || overLimit || sending) return;
    setSending(true);
    const clientMsgId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await onSend(body, clientMsgId);
      setText("");
      if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
    } finally {
      setSending(false);
    }
  }

  if (disabled) {
    return (
      <div data-testid="composer-readonly" style={{ padding: 16, borderTop: "1px solid var(--role-border)", color: "var(--role-muted)", fontFamily: "var(--role-font-ui)", fontSize: 13.5 }}>
        {disabledReason ?? "You can read messages but cannot reply."}
      </div>
    );
  }

  return (
    <div
      data-testid="message-composer"
      style={{
        padding: "12px 14px 14px",
        borderTop: "1px solid var(--role-border)",
        background: "color-mix(in srgb, var(--role-surface) 92%, var(--role-bg))",
        fontFamily: "var(--role-font-ui)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          background: "#fff",
          border: "1.5px solid var(--role-border)",
          borderRadius: 18,
          padding: "10px 8px 10px 14px",
          boxShadow: "0 2px 8px rgba(15,42,29,.05)",
        }}
      >
        <textarea
          ref={taRef}
          data-testid="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            padding: "4px 0",
            fontFamily: "inherit",
            fontSize: 14.5,
            lineHeight: 1.5,
            maxHeight: 110,
            background: "transparent",
          }}
        />
        <button
          data-testid="composer-send"
          onClick={submit}
          disabled={!text.trim() || overLimit || sending}
          aria-label="Send message"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: "none",
            background: "var(--role-accent-strong)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(232,163,61,.35)",
            transition: "transform 120ms ease",
          }}
        >
          {/* modern paper-plane send glyph */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, padding: "0 4px" }}>
        <span data-testid="char-counter" style={{ fontSize: 11.5, color: nearLimit ? "var(--role-danger)" : "var(--role-muted)" }}>
          {overLimit ? `Too long — ${MAX} max` : `${text.length} / ${MAX}`}
        </span>
        <span style={{ fontSize: 11, color: "var(--role-muted)" }}>Enter to send · Shift+Enter for a new line</span>
      </div>
    </div>
  );
}
