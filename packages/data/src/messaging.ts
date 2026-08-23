/**
 * VS6.4 — Messaging data layer (mock). Conversation + Message repos.
 *
 * One conversation per (shopper, vendor) pair (idempotent find-or-create, Doc 08 §8.12).
 * Message state lifecycle is SERVER-AUTHORITATIVE: create() sets 'sent', markDelivered
 * / markRead transition per recipient. Client supplies clientMsgId for idempotent retries
 * (Doc 09 §9.8 Tier B) — a resend with the same clientMsgId returns the existing message.
 *
 * Phase 9 swaps these Maps for the real transport behind the same signatures.
 */

import type {
  Conversation,
  Message,
  MessageState,
} from "./interfaces";
import { realConversationRepo, realMessageRepo } from "@voeq/db";

const id = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const conversations = new Map<string, Conversation>();
const messages = new Map<string, Message>();

/** Stable key for a participant pair (order-independent). */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

/** In-memory store of pairKey -> conversationId for idempotent reuse. */
const pairIndex = new Map<string, string>();

const mockConversationRepoImpl = {
  /** Find-or-create a conversation for the (shopper, vendor) pair. Idempotent. */
  async create(input: {
    participantIds: string[];
    listingId?: string | null;
  }): Promise<Conversation> {
    const [a, b] = input.participantIds;
    const key = pairKey(a, b);
    const existingId = pairIndex.get(key);
    if (existingId) {
      const found = conversations.get(existingId);
      if (found) return found;
    }
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: id("conv"),
      participantIds: input.participantIds,
      lastMessageAt: now,
      createdAt: now,
      lastSeen: {},
    };
    conversations.set(conv.id, conv);
    pairIndex.set(key, conv.id);
    return conv;
  },

  async getById(convId: string): Promise<Conversation | null> {
    return conversations.get(convId) ?? null;
  },

  /** Conversations for an identity, newest first, with last-message preview. */
  async listForIdentity(identityId: string): Promise<Conversation[]> {
    return Array.from(conversations.values())
      .filter((c) => c.participantIds.includes(identityId))
      .sort((x, y) => y.lastMessageAt.localeCompare(x.lastMessageAt));
  },

  async updateLastMessageAt(convId: string, ts: string): Promise<void> {
    const c = conversations.get(convId);
    if (c) c.lastMessageAt = ts;
  },

  /** VS6.16: record honest last-seen for a participant. */
  async touchLastSeen(convId: string, identityId: string): Promise<void> {
    const c = conversations.get(convId);
    if (c) c.lastSeen = { ...c.lastSeen, [identityId]: new Date().toISOString() };
  },
};

const mockMessageRepoImpl = {
  /**
   * Create a message. If clientMsgId is provided and a message with that key
   * already exists in the conversation, return the existing one (idempotent retry).
   */
  async create(input: {
    conversationId: string;
    senderId: string;
    body: string;
    clientMsgId?: string;
  }): Promise<Message> {
    if (input.clientMsgId) {
      for (const m of messages.values()) {
        if (m.conversationId === input.conversationId && m.clientMsgId === input.clientMsgId) {
          return m;
        }
      }
    }
    const msg: Message = {
      id: id("msg"),
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
      state: "sent",
      createdAt: new Date().toISOString(),
      readAt: null,
      clientMsgId: input.clientMsgId,
    };
    messages.set(msg.id, msg);
    return msg;
  },

  /** Messages for a conversation, oldest first (cursor = createdAt of last seen). */
  async listByConversation(
    conversationId: string,
    cursor?: string | null,
    limit = 50,
  ): Promise<Message[]> {
    const all = Array.from(messages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((x, y) => x.createdAt.localeCompare(y.createdAt));
    const sliced = cursor
      ? all.filter((m) => m.createdAt > cursor)
      : all;
    return sliced.slice(0, limit);
  },

  async getById(msgId: string): Promise<Message | null> {
    return messages.get(msgId) ?? null;
  },

  async updateState(msgId: string, state: MessageState): Promise<Message | null> {
    const m = messages.get(msgId);
    if (!m) return null;
    m.state = state;
    return m;
  },

  /** VS6.7/6.9: bulk mark delivered for the recipient (not the sender). */
  async markDelivered(conversationId: string, recipientId: string): Promise<void> {
    for (const m of messages.values()) {
      if (m.conversationId === conversationId && m.senderId !== recipientId) {
        if (m.state === "sent") m.state = "delivered";
      }
    }
  },

  /** VS6.9: bulk mark read for the recipient (not the sender). */
  async markRead(conversationId: string, recipientId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const m of messages.values()) {
      if (m.conversationId === conversationId && m.senderId !== recipientId) {
        if (m.state === "delivered" || m.state === "sent") m.state = "read";
        m.readAt = now;
      }
    }
  },
  async listAll() {
    return Array.from(messages.values());
  },
};

/** Dev/test-only: wipe messaging stores. */
export function resetMessagingState(): void {
  conversations.clear();
  messages.clear();
  pairIndex.clear();
}

// D.2/D.3 — Factory (EOF): real Neon-backed repos when DATABASE_URL is set.
const USE_REAL = !!process.env.DATABASE_URL;
export const mockConversationRepo = USE_REAL ? (realConversationRepo as unknown as typeof mockConversationRepoImpl) : mockConversationRepoImpl;
export const mockMessageRepo = USE_REAL ? (realMessageRepo as unknown as typeof mockMessageRepoImpl) : mockMessageRepoImpl;
