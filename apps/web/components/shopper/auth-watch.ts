"use client";

/**
 * AUTH WATCH (401-noise fix, 2026-09-05): the shopper state buttons (Save/
 * Follow/Like) each GET their state on mount — for anonymous visitors that's
 * three guaranteed 401s per page, pure console noise (the login wall handles
 * clicks correctly, but the browser console fills with unauthorized errors —
 * David flagged it; Lighthouse "Browser errors were logged to the console"
 * fired on the real-device run).
 *
 * This module dedupes the auth check across every button on the page: one
 * /api/auth/status request per page load (module-level promise cache),
 * buttons skip their state fetch when signed out. Signed-in users keep the
 * exact previous behavior. The cache lives per browser-page lifetime — a
 * login in another tab simply leaves the buttons stateless until reload,
 * same as before this fix.
 */

let cached: Promise<boolean> | null = null;

function fetchAuthed(): Promise<boolean> {
  return fetch("/api/auth/status", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { authenticated?: boolean } | null) => !!d?.authenticated)
    .catch(() => false);
}

/**
 * Returns true when the viewer is signed in (deduped page-wide).
 * Until the check resolves the buttons keep rendering their initial state —
 * no flicker, no extra requests.
 */
export function getViewerSignedIn(): Promise<boolean> {
  if (!cached) cached = fetchAuthed();
  return cached;
}
