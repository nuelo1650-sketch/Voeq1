"use client";

/**
 * T5 — Client-side SSE subscriptions.
 *
 * Thin wrappers over the native EventSource (browser auto-reconnects on
 * disconnect — no polling, no manual timer). Both endpoints use
 * `withCredentials` so the session cookie travels. Returns an unsubscribe fn.
 */

export interface SseMessage {
  id: string;
  senderId: string;
  body: string;
  state: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  readAt: string | null;
}

export interface SseStateChange {
  messageId: string;
  state: SseMessage["state"];
  readAt?: string | null;
}

export interface SseNewConversation {
  conversationId: string;
  participantId: string;
  lastMessageAt: string;
}

export interface SseNotification {
  type: string;
  title: string;
  refId: string | null;
}

function open(url: string): EventSource {
  return new EventSource(url, { withCredentials: true });
}

/** Subscribe to a single conversation's message + state-change events. */
export function subscribeToConversation(
  conversationId: string,
  handlers: {
    onMessage: (m: SseMessage) => void;
    onStateChange?: (s: SseStateChange) => void;
    onCatchUp?: (m: { messages: SseMessage[] }) => void;
    onStatus?: (connected: boolean) => void;
  },
): () => void {
  const es = open(`/api/conversations/${conversationId}/stream`);
  es.onopen = () => handlers.onStatus?.(true);
  es.onerror = () => handlers.onStatus?.(false); // browser reconnects automatically
  es.addEventListener("catch-up", (e) => {
    try {
      handlers.onCatchUp?.(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore malformed */
    }
  });
  es.addEventListener("message", (e) => {
    try {
      handlers.onMessage(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore malformed */
    }
  });
  es.addEventListener("state-change", (e) => {
    try {
      handlers.onStateChange?.(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore malformed */
    }
  });
  return () => es.close();
}

/** Subscribe to user-scoped events (new conversations, notifications). */
export function subscribeToUserEvents(handlers: {
  onNewConversation?: (c: SseNewConversation) => void;
  onNotification?: (n: SseNotification) => void;
  onStatus?: (connected: boolean) => void;
}): () => void {
  const es = open(`/api/me/stream`);
  es.onopen = () => handlers.onStatus?.(true);
  es.onerror = () => handlers.onStatus?.(false);
  es.addEventListener("new-conversation", (e) => {
    try {
      handlers.onNewConversation?.(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore */
    }
  });
  es.addEventListener("notification", (e) => {
    try {
      handlers.onNotification?.(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore */
    }
  });
  return () => es.close();
}
