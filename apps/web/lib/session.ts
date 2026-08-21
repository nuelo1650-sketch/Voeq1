import { cookies } from "next/headers";
import { mockAuthRepo, type Identity, type UserRole } from "@voeq/data";

export const SESSION_COOKIE = "sessionId";

/** Server-side: resolve the current identity from the session cookie. */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  return mockAuthRepo.currentIdentity(sessionId);
}

/** Server-side: redirect to login if not authenticated (used in server components). */
export async function requireAuth(next?: string): Promise<Identity> {
  const id = await getCurrentIdentity();
  if (!id) {
    const url = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    throw new Response(null, { status: 302, headers: { Location: url } });
  }
  return id;
}

/** Server-side: role gate. */
export async function requireRole(role: UserRole): Promise<Identity> {
  const id = await requireAuth();
  if (id.role !== role) {
    throw new Response(null, { status: 302, headers: { Location: "/account-state?status=forbidden" } });
  }
  return id;
}

/**
 * Doc 09 §9.16: only same-origin relative paths are valid ?next targets.
 * Rejects protocol-relative (//evil.com), absolute, and traversal paths.
 */
export function sanitizeNext(next?: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return null;
  if (next.includes("..")) return null;
  return next;
}
