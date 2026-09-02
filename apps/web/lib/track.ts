"use client";

/**
 * P-A round 60 — fire-and-forget activity tracking (privacy-respecting).
 *
 * Call sites: listing detail, storefront, search, message clicks, saves.
 * NEVER passes email/name/body — only type + refId + path. Failures are
 * silently dropped (tracking must never block or confuse the user).
 */

let lastSent: Record<string, number> = {};

export function trackEvent(type: string, opts?: { refId?: string; path?: string }) {
  try {
    // Dedupe the same event type+ref within 1s (double-mount, React Strict).
    const key = `${type}:${opts?.refId ?? ""}`;
    const now = Date.now();
    if (lastSent[key] && now - lastSent[key] < 1000) return;
    lastSent[key] = now;

    const payload: Record<string, unknown> = {
      type,
      ...(opts?.refId ? { refId: opts.refId } : {}),
      ...(opts?.path ? { path: opts.path } : {}),
    };
    void fetch("/api/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // always safe
  }
}
