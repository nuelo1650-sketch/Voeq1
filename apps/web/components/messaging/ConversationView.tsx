"use client";

import { useEffect, useRef, useState } from "react";
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
        
        // Clear from optimistic queue if it was a pending message
        const queued = getQueue(conversationId);
        const match = queued.find((q) => q.body === sseMsg.body);
        if (match) {
          clearMessage(match.tempId);
          setOptimistic((prev) => prev.filter((m) => m.clientMsgId !== match.tempId));
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

  if (loading) {
    return <div data-testid="thread-loading" style={{ padding: 16, fontFamily: "var(--role-font-ui)" }}>Loading conversation…</div>;
  }
  if (error && messages.length === 0) {
    return (
      <div data-testid="thread-error" style={{ padding: 16, color: "var(--role-danger)", fontFamily: "var(--role-font-ui)" }}>
        {error}
        <button onClick={load} style={{ marginLeft: 8 }}>Retry</button>
      </div>
    );
  }

  const all = [...messages, ...optimistic];
  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header with connection status (K2.6 #5) */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--role-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <strong style={{ fontFamily: "var(--role-font-ui)", fontSize: "16px" }}>{otherName}</strong>
          {otherLastSeen && (
            <div data-testid="last-seen" style={{ fontSize: 12, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
              {formatLastSeen(otherLastSeen)}
            </div>
          )}
        </div>
        <div 
          data-testid="connection-status"
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            fontSize: "12px",
            color: connectionStatus === "connected" ? "var(--color-forest)" : "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: connectionStatus === "connected" ? "var(--color-forest)" : connectionStatus === "connecting" ? "#f59e0b" : "#ef4444",
          }} />
          {connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting…" : "Offline"}
        </div>
      </div>
      
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
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
