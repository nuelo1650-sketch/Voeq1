/**
 * Post-auth intent queue (Phase 1, 2026-08-29).
 *
 * The auth gate's PURPOSE is to force anonymous visitors to create an account
 * before they interact with a vendor — it must NOT block them forever or lose
 * what they were trying to do. This module encodes a "pending intent" (message
 * vendor X, follow vendor Y, save listing Z, become a vendor) into the
 * /login?next= and /consent?next= URLs so that once the user authenticates and
 * consents, the app can RESUME the action instead of dumping them on a page.
 *
 * The gate stays: anonymous users still hit login. The intent survives the
 * gate: after login+consent, the action re-triggers automatically.
 */

/** A pending action a user was trying to perform before the auth gate. */
export type PendingIntent =
  | { kind: "message"; vendorId: string }
  | { kind: "follow"; vendorId: string }
  | { kind: "save"; targetType: "listing" | "vendor"; targetId: string }
  | { kind: "becomeVendor" };

/** Serialize an intent into the compact `intent=` query value. */
export function intentToQuery(i: PendingIntent): string {
  switch (i.kind) {
    case "message":
      return `message:${i.vendorId}`;
    case "follow":
      return `follow:${i.vendorId}`;
    case "save":
      return `save:${i.targetType}:${i.targetId}`;
    case "becomeVendor":
      return "become-vendor";
  }
}

/** Parse a raw `intent=` query value back into a typed intent, or null. */
export function parseIntent(raw: string | null | undefined): PendingIntent | null {
  if (!raw) return null;
  const parts = raw.split(":");
  const kind = parts[0];
  switch (kind) {
    case "message":
      return parts[1] ? { kind: "message", vendorId: parts[1] } : null;
    case "follow":
      return parts[1] ? { kind: "follow", vendorId: parts[1] } : null;
    case "save": {
      const targetType = parts[1];
      const targetId = parts[2];
      if ((targetType === "listing" || targetType === "vendor") && targetId) {
        return { kind: "save", targetType, targetId };
      }
      return null;
    }
    case "become-vendor":
      return { kind: "becomeVendor" };
    default:
      return null;
  }
}

/**
 * Append an intent to a same-origin path so a redirect carries it through.
 * E.g. withIntent("/listing/abc", message for v1) -> "/listing/abc?intent=message:v1"
 */
export function withIntent(path: string, intent: PendingIntent): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}intent=${intentToQuery(intent)}`;
}

/** Doc 09 §9.16: only same-origin relative paths are allowed as ?next targets. */
export function sanitizeNext(next?: string, fallback = "/consent"): string {
  if (!next) return fallback;
  // Reject protocol-relative, absolute, and non-/-starting paths.
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  // Block path traversal.
  if (next.includes("..")) return fallback;
  return next;
}
