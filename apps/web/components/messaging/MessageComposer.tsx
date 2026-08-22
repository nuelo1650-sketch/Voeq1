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
      <div data-testid="composer-readonly" style={{ padding: 12, borderTop: "1px solid var(--role-border)", color: "var(--role-muted)" }}>
        {disabledReason ?? "You can read messages but cannot reply."}
      </div>
    );
  }

  return (
    <div data-testid="message-composer" style={{ padding: 12, borderTop: "1px solid var(--role-border)" }}>
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
        rows={2}
        placeholder="Write a message…"
        style={{ width: "100%", resize: "none", borderRadius: 8, border: "1px solid var(--role-border)", padding: 8, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span data-testid="char-counter" style={{ fontSize: 12, color: nearLimit ? "var(--role-danger)" : "var(--role-muted)" }}>
          {text.length} / {MAX}
        </span>
        <button
          data-testid="composer-send"
          onClick={submit}
          disabled={!text.trim() || overLimit || sending}
          style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "var(--role-accent-strong)", color: "#fff", cursor: "pointer" }}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
