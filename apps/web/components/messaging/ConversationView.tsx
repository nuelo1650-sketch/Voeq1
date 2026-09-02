"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageBubble, DateSeparator } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { formatLastSeen } from "@/lib/format";
import { subscribeToConversation, type SseMessage } from "@/lib/sse-client";
import { queueMessage, getQueue, clearMessage } from "@/lib/message-queue";

/**
 * ConversationView — K2.6 enhanced with SSE real-time messaging.
 * Features:
 * - Real-time message delivery via SSE (no polling)
 * - Optimistic UI with offline queue
 * - Connection status indicator
 * - Message state tracking (pending → sent → delivered → read)
 * - Automatic reconnection with catch-up
 */

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
  listingContext,
}: {
  conversationId: string;
  currentIdentityId: string;
  otherName: string;
  otherLastSeen?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  /** P-A round 45: the listing this conversation is about (if any). */
  listingContext?: { id: string; title: string; priceMinor: number; image: string | null } | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_typing, _setTyping] = useState(false);
  const [optimistic, setOptimistic] = useState<Msg[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const endRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  // Load initial messages
  async function load() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      const msgs = data.messages ?? [];
      setMessages(msgs);
      if (msgs.length > 0) {
        lastSeenIdRef.current = msgs[msgs.length - 1].id;
      }
      setError(null);
    } catch {
      setError("Couldn't load messages");
    } finally {
      setLoading(false);
    }
  }

  // SSE real-time subscription (K2.6 #3)
  useEffect(() => {
    load();
    
    const unsubscribe = subscribeToConversation(conversationId, {
      onMessage: (sseMsg: SseMessage) => {
        // Add new message from SSE
        setMessages((prev) => {
          // Dedupe by id
          if (prev.some((m) => m.id === sseMsg.id)) return prev;
          return [...prev, sseMsg];
        });
        lastSeenIdRef.current = sseMsg.id;
        
        // Clear the optimistic (temp) bubble that showed while sending.
        // P-A round 43 (fix DUPLICATE bubbles): this matched the optimistic
        // message against the OFFLINE queue only — online sends live in the
        // `optimistic` state, so the temp bubble survived and rendered twice.
        // Match by clientMsgId (server echoes it back) OR by sent body.
        setOptimistic((prev) => {
          const match = prev.find(
            (m) =>
              (m.id !== undefined && m.id === sseMsg.id) ||
              (m.body && sseMsg.body === m.body),
          );
          if (!match) return prev;
          return prev.filter((m) => m !== match);
        });
        const queued = getQueue(conversationId);
        const qmatch = queued.find((q) => q.body === sseMsg.body);
        if (qmatch) {
          clearMessage(qmatch.tempId);
        }
      },
      
      onStateChange: (change) => {
        // Update message state in real-time
        setMessages((prev) =>
          prev.map((m) =>
            m.id === change.messageId
              ? { ...m, state: change.state, readAt: change.readAt ?? m.readAt }
              : m
          )
        );
      },
      
      onCatchUp: (data) => {
        // Server sent missed messages on reconnect
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const newMsgs = data.messages.filter((m: SseMessage) => !existing.has(m.id));
            return [...prev, ...newMsgs];
          });
          lastSeenIdRef.current = data.messages[data.messages.length - 1].id;
        }
      },
      
      onStatus: (connected) => {
        setConnectionStatus(connected ? "connected" : "connecting");
        
        // Flush queued messages on reconnect
        if (connected) {
          const queued = getQueue(conversationId);
          queued.forEach((q) => {
            void sendBody(q.body, q.tempId);
          });
        }
      },
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, optimistic]);

  function retry(m: Msg) {
    // Re-send same body + clientMsgId (server dedupes)
    void sendBody(m.body, m.clientMsgId ?? `c-${Date.now()}`);
  }

  // Optimistic message sending (K2.6 #4)
  async function sendBody(body: string, clientMsgId: string) {
    const temp: Msg = {
      id: `tmp-${clientMsgId}`,
      senderId: currentIdentityId,
      body,
      state: "pending",
      createdAt: new Date().toISOString(),
      clientMsgId,
    };
    
    // Add to optimistic UI immediately
    setOptimistic((o) => [...o, temp]);
    
    // If offline, queue for later
    if (connectionStatus === "disconnected") {
      queueMessage(conversationId, body);
      return;
    }
    
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, clientMsgId }),
      });
      
      if (!res.ok) throw new Error("send_failed");
      
      // Server will send the confirmed message via SSE
      // Keep optimistic message until SSE confirms
    } catch {
      // Mark as failed, allow retry
      setOptimistic((o) =>
        o.map((m) => (m.id === temp.id ? { ...m, state: "failed" as const } : m))
      );
      setError("Message failed to send");
    }
  }

  // P-A round 42 (polish): the header includes BACK + name + connection status
  // and must render in EVERY state (loading/error/loaded) — previously it only
  // rendered after messages resolved, so the thread opened as a bare page.
  const header = (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--role-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--role-surface)" }}>
      <Link
        href="/messages"
        data-testid="thread-back"
        aria-label="Back to messages"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--role-accent-strong)", textDecoration: "none", fontSize: 14, fontFamily: "var(--role-font-ui)", fontWeight: 600, flexShrink: 0 }}
      >
        ←
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontFamily: "var(--role-font-display)", fontSize: "17px", color: "var(--role-text)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{otherName}</strong>
        {otherLastSeen && (
          <div data-testid="last-seen" style={{ fontSize: 12, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
            {formatLastSeen(otherLastSeen)}
          </div>
        )}
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)", flexShrink: 0 }}>
        <span data-testid="connection-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: connectionStatus === "connected" ? "var(--color-forest)" : connectionStatus === "connecting" ? "#f59e0b" : "#ef4444" }} />
        {connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting…" : "Offline"}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {header}
        <div
          data-testid="thread-loading"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
            background: "var(--role-bg)",
            fontFamily: "var(--role-font-ui)",
            color: "var(--role-text-muted)",
            fontSize: 14,
          }}
        >
          <div aria-hidden style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid var(--role-border)", borderTopColor: "var(--role-accent-strong)", animation: "voeq-spin 0.8s linear infinite", display: "inline-block" }} />
          Loading conversation…
        </div>
        <style>{`@keyframes voeq-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (error && messages.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {header}
        <div data-testid="thread-error" style={{ padding: 16, color: "var(--role-danger)", fontFamily: "var(--role-font-ui)" }}>
          {error}
          <button onClick={load} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      </div>
    );
  }

  const all = [...messages, ...optimistic];
  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Shared header (back + name + connection) — defined above */}
      {header}

      {/* P-A round 45: listing context chip — WHAT this chat is about.
          Shown when the conversation was opened from a listing. */}
      {listingContext && (
        <Link
          href={`/listing/${listingContext.id}`}
          data-testid="thread-listing-context"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "var(--role-surface)",
            borderBottom: "1px solid var(--role-border)",
            textDecoration: "none",
          }}
        >
          {listingContext.image && (
            <img
              src={listingContext.image}
              alt=""
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                objectFit: "cover",
                background: "var(--role-surface-sunken)",
                flexShrink: 0,
              }}
              // eslint-disable-next-line @next/next/no-img-element
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: "var(--role-accent-strong)", fontFamily: "var(--role-font-ui)" }}>
              About this listing
            </div>
            <div style={{ fontFamily: "var(--role-font-ui)", fontSize: 14, fontWeight: 600, color: "var(--role-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {listingContext.title}
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--role-text)", flexShrink: 0 }}>
            ₦ {(listingContext.priceMinor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </div>
        </Link>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--role-surface-sunken)" }}>
        {all.length === 0 && !_typing && (
          <div data-testid="thread-empty" style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>💬</div>
            <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: "17px", color: "var(--role-text)", fontWeight: 600 }}>
              No messages yet
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
              Say hello — this is the start of your conversation with {otherName}.
            </p>
          </div>
        )}
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
        {_typing && <TypingIndicator name={otherName} />}
        <div ref={endRef} />
      </div>
      
      {/* Composer */}
      <MessageComposer conversationId={conversationId} disabled={readOnly} disabledReason={readOnlyReason} onSend={sendBody} />
      
      {/* Error banner */}
      {error && messages.length > 0 && (
        <div style={{
          padding: "8px 16px",
          background: "rgba(239, 68, 68, 0.1)",
          borderTop: "1px solid #ef4444",
          fontSize: "13px",
          color: "#ef4444",
          fontFamily: "var(--role-font-ui)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "var(--role-font-ui)",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
