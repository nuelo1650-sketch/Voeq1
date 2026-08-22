"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble, DateSeparator } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { formatLastSeen } from "@/lib/format";

interface Msg {
  id: string;
  senderId: string;
  body: string;
  state: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  readAt?: string | null;
  clientMsgId?: string;
}

const sameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

export function ConversationView({
  conversationId,
  currentIdentityId,
  otherName,
  otherLastSeen,
  readOnly,
  readOnlyReason,
}: {
  conversationId: string;
  currentIdentityId: string;
  otherName: string;
  otherLastSeen?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [optimistic, setOptimistic] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setMessages(data.messages ?? []);
      setError(null);
    } catch {
      setError("Couldn't load messages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000); // mock polling (VS6.12)
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, optimistic]);

  function retry(m: Msg) {
    // Re-send same body + clientMsgId (server dedupes)
    void sendBody(m.body, m.clientMsgId ?? `c-${Date.now()}`);
  }

  async function sendBody(body: string, clientMsgId: string) {
    const temp: Msg = {
      id: `tmp-${clientMsgId}`,
      senderId: currentIdentityId,
      body,
      state: "pending",
      createdAt: new Date().toISOString(),
      clientMsgId,
    };
    setOptimistic((o) => [...o, temp]);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, clientMsgId }),
      });
      // refresh authoritative list
      await load();
      setOptimistic([]);
      if (!res.ok) throw new Error("send_failed");
    } catch {
      setOptimistic((o) => o.filter((x) => x.id !== temp.id));
      setError("Message failed to send");
    }
  }

  if (loading) {
    return <div data-testid="thread-loading" style={{ padding: 16 }}>Loading conversation…</div>;
  }
  if (error) {
    return (
      <div data-testid="thread-error" style={{ padding: 16, color: "var(--role-danger)" }}>
        {error}
        <button onClick={load} style={{ marginLeft: 8 }}>Retry</button>
      </div>
    );
  }

  const all = [...messages, ...optimistic];
  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--role-border)" }}>
        <strong>{otherName}</strong>
        {otherLastSeen && (
          <div data-testid="last-seen" style={{ fontSize: 12, color: "var(--role-muted)" }}>
            {formatLastSeen(otherLastSeen)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {all.map((m) => {
          const sep = !sameDay(lastDay, m.createdAt);
          lastDay = m.createdAt;
          return (
            <div key={m.id}>
              {sep && <DateSeparator iso={m.createdAt} />}
              <MessageBubble message={m} own={m.senderId === currentIdentityId} onRetry={m.state === "failed" ? retry : undefined} />
            </div>
          );
        })}
        {typing && <TypingIndicator name={otherName} />}
        <div ref={endRef} />
      </div>
      <MessageComposer conversationId={conversationId} disabled={readOnly} disabledReason={readOnlyReason} onSend={sendBody} />
    </div>
  );
}
