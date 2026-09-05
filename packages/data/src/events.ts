/**
 * P-A round 60 — Activity events (privacy-respecting admin ledger).
 *
 * Same factory rule as every other repo: DATABASE_URL present → DB-backed
 * (Neon append-only page_events table); else in-memory (dev/test).
 *
 * PRIVACY CONTRACT: identity_id + event type + refId + path + platform +
 * salted IP hash ONLY. Never email/name/message body/search text.
 */
import { realPageEventStore } from "@voeq/db";

export interface PageEvent {
  id: string;
  identityId: string | null;
  type: string;
  refId: string | null;
  path: string | null;
  platform: string | null;
  ipHash: string | null;
  at: string;
}

export interface PageEventInput {
  identityId?: string | null;
  type: string;
  refId?: string | null;
  path?: string | null;
  platform?: string | null;
  ipHash?: string | null;
}

export interface PageEventStore {
  log(event: PageEventInput): Promise<void>;
  query(filter?: { type?: string; identityId?: string; refId?: string; since?: number; limit?: number }): Promise<PageEvent[]>;
  countByType(filter?: { since?: number; type?: string }): Promise<Array<{ type: string; count: number }>>;
}

const USE_REAL = !!process.env.DATABASE_URL;

const memory: PageEvent[] = [];

const memoryStore: PageEventStore = {
  async log(event) {
    memory.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      identityId: event.identityId ?? null,
      type: event.type,
      refId: event.refId ?? null,
      path: event.path ?? null,
      platform: event.platform ?? null,
      ipHash: event.ipHash ?? null,
      at: new Date().toISOString(),
    });
  },
  async query(filter) {
    let out = memory;
    if (filter?.type) out = out.filter((e) => e.type === filter.type);
    if (filter?.identityId) out = out.filter((e) => e.identityId === filter.identityId);
    if (filter?.refId) out = out.filter((e) => e.refId === filter.refId);
    if (filter?.since) out = out.filter((e) => new Date(e.at).getTime() >= (filter.since ?? 0));
    out = [...out].sort((a, b) => (a.at < b.at ? 1 : -1));
    return filter?.limit ? out.slice(0, filter.limit) : out;
  },
  async countByType(filter) {
    const since = filter?.since ?? 0;
    const counts = new Map<string, number>();
    for (const e of memory) {
      if (filter?.type && e.type !== filter.type) continue;
      if (since && new Date(e.at).getTime() < since) continue;
      counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    }
    return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  },
};

export const mockPageEventStore: PageEventStore = USE_REAL ? realPageEventStore : memoryStore;
