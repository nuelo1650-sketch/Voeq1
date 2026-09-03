/**
 * Staff batch 1 / P6a — Auth forensics events.
 *
 * Append-only trail of authentication events (success AND failure) with raw IP
 * + user-agent, so the platform can carry out real investigations: disputes,
 * account takeover claims, abuse, and legal process. This is deliberately
 * SEPARATE from page_events (which stores only a salted IP hash for analytics).
 *
 * PRIVACY: raw IP is personal data. Reads are capability-gated to admin+ staff
 * (see /api/staff/users/[id]/events), and batch 2 adds the 12-month retention
 * purge. Writes are fire-and-forget: forensics must never break a login.
 */
import { realAuthEventStore } from "@voeq/db";

export type AuthEventKind =
  | "login"
  | "login_failed"
  | "signup"
  | "otp_verified"
  | "google_callback"
  | "account_action";

export interface AuthEventInput {
  identityId?: string | null;
  event: AuthEventKind;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuthEventRecord {
  id: string;
  identityId: string | null;
  event: string;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  at: string;
}

export interface AuthEventStore {
  log(event: AuthEventInput): Promise<void>;
  queryBy(filter: { identityId?: string; email?: string; limit?: number }): Promise<AuthEventRecord[]>;
}

const USE_REAL = !!process.env.DATABASE_URL;

const memory: AuthEventRecord[] = [];

const memoryStore: AuthEventStore = {
  async log(event) {
    memory.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      identityId: event.identityId ?? null,
      event: event.event,
      email: event.email ?? null,
      ip: event.ip ?? null,
      userAgent: event.userAgent ? event.userAgent.slice(0, 300) : null,
      at: new Date().toISOString(),
    });
  },
  async queryBy(filter) {
    let out = memory;
    if (filter.identityId) out = out.filter((e) => e.identityId === filter.identityId);
    if (filter.email) out = out.filter((e) => e.email === filter.email);
    out = [...out].sort((a, b) => (a.at < b.at ? 1 : -1));
    return filter.limit ? out.slice(0, filter.limit) : out;
  },
};

export const mockAuthEventStore: AuthEventStore = USE_REAL
  ? (realAuthEventStore as unknown as AuthEventStore)
  : memoryStore;

/**
 * Fire-and-forget forensic write. Never throws — an audit-logging failure must
 * not take down authentication. Errors surface in server logs only.
 */
export async function recordAuthEvent(event: AuthEventInput): Promise<void> {
  try {
    await mockAuthEventStore.log(event);
  } catch (e) {
    console.error(`[auth-events] log failed: ${e instanceof Error ? e.message : e}`);
  }
}

/** Extract the client IP from a request's proxy headers (first XFF hop). */
export function clientIpFrom(forwarded: string | null): string | null {
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip !== "unknown" ? ip : null;
}
