"use client";

/**
 * T6 — Offline message queue + reconnect reconciliation.
 *
 * Messages composed while SSE is disconnected persist in localStorage (capped
 * at 50) and flush on reconnect. After an SSE reconnect, call
 * reconcileOnReconnect() to fetch any messages the server has that the client
 * missed while offline (Doc 03 §7.11).
 */

const QUEUE_KEY = "voeq:message-queue";
const MAX_PENDING = 50;

export interface QueuedMessage {
  tempId: string;
  conversationId: string;
  body: string;
  queuedAt: string;
}

function read(): QueuedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMessage[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_PENDING)));
  } catch {
    /* quota / disabled — drop silently */
  }
}

/** Queue a message composed while offline. Returns the local temp id. */
export function queueMessage(conversationId: string, body: string): string {
  const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: QueuedMessage = { tempId, conversationId, body, queuedAt: new Date().toISOString() };
  const next = [...read(), item].slice(-MAX_PENDING);
  write(next);
  return tempId;
}

/** Pending queued messages (optionally for one conversation). */
export function getQueue(conversationId?: string): QueuedMessage[] {
  const all = read();
  return conversationId ? all.filter((m) => m.conversationId === conversationId) : all;
}

/** Remove a message from the queue once the server confirms it. */
export function clearMessage(tempId: string): void {
  write(read().filter((m) => m.tempId !== tempId));
}

/**
 * After SSE reconnect, fetch messages newer than the last seen id so the client
 * catches up on anything missed while disconnected.
 */
export async function reconcileOnReconnect(
  conversationId: string,
  lastSeenId: string | null,
): Promise<unknown[]> {
  const since = lastSeenId ? await lastSeenCreatedAt(conversationId, lastSeenId) : null;
  const url = since
    ? `/api/conversations/${conversationId}/messages?since=${encodeURIComponent(since)}`
    : `/api/conversations/${conversationId}/messages`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages ?? [];
  } catch {
    return [];
  }
}

/** Map a message id to its createdAt cursor for the `?since=` query. */
async function lastSeenCreatedAt(conversationId: string, lastSeenId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    const found = (data.messages ?? []).find((m: { id: string }) => m.id === lastSeenId);
    return found?.createdAt ?? null;
  } catch {
    return null;
  }
}
