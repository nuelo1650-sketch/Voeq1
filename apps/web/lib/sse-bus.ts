/**
 * SSE bus — module-scope registries + broadcast helpers for Server-Sent Events.
 *
 * One controller per open SSE connection. Routes register their stream
 * controller here; message/notification creators broadcast to all connected
 * participants/users. In-memory only (Phase 9 swaps for Redis pub/sub).
 *
 * Per locked spec (Doc 03 §7.10–7.12, Doc 04 §513): real-time delivery via
 * SSE (no polling, no WebSocket, no third-party transport).
 */
import type { Message, Notification } from "@voeq/data";

type SseController = ReadableStreamDefaultController<Uint8Array>;

const enc = new TextEncoder();

/** conversationId -> set of connected stream controllers (all participants). */
const conversationStreams = new Map<string, Set<SseController>>();
/** userId -> set of connected user-event stream controllers. */
const userStreams = new Map<string, Set<SseController>>();

function write(controller: SseController, event: string, data: unknown): void {
  try {
    controller.enqueue(enc.encode(`event: ${event}\n`));
    controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
  } catch {
    // Controller already closed; registry cleanup happens on abort.
  }
}

export function registerConversationStream(convId: string, controller: SseController): () => void {
  let set = conversationStreams.get(convId);
  if (!set) {
    set = new Set();
    conversationStreams.set(convId, set);
  }
  set.add(controller);
  return () => {
    set?.delete(controller);
    if (set && set.size === 0) conversationStreams.delete(convId);
  };
}

export function registerUserStream(userId: string, controller: SseController): () => void {
  let set = userStreams.get(userId);
  if (!set) {
    set = new Set();
    userStreams.set(userId, set);
  }
  set.add(controller);
  return () => {
    set?.delete(controller);
    if (set && set.size === 0) userStreams.delete(userId);
  };
}

/** T3 — broadcast a new/edited message to everyone connected to the conversation. */
export function broadcastMessage(convId: string, message: Message): void {
  const set = conversationStreams.get(convId);
  if (!set) return;
  const payload = {
    id: message.id,
    senderId: message.senderId,
    body: message.body,
    state: message.state,
    createdAt: message.createdAt,
    readAt: message.readAt ?? null,
  };
  for (const c of set) write(c, "message", payload);
}

/** T3 — broadcast a state transition (delivered/read) for a single message. */
export function broadcastStateChange(
  convId: string,
  messageId: string,
  state: Message["state"],
  readAt?: string | null,
): void {
  const set = conversationStreams.get(convId);
  if (!set) return;
  for (const c of set) write(c, "state-change", { messageId, state, readAt: readAt ?? null });
}

/** T4 — broadcast a user-scoped event (notification / new conversation). */
export function broadcastUserEvent(
  userId: string,
  event: "new-conversation" | "notification",
  data: unknown,
): void {
  const set = userStreams.get(userId);
  if (!set) return;
  for (const c of set) write(c, event, data);
}

/** T4 helper: push a created notification to its recipient's user stream. */
export function pushNotification(notification: Notification): void {
  broadcastUserEvent(notification.recipientId, "notification", {
    type: notification.type,
    title: notification.title,
    refId: notification.refId,
  });
}
