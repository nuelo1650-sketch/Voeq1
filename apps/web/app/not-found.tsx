import Link from "next/link";
import { cookies } from "next/headers";
import { mockAuthRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Branded 404 for any unmatched route. Uses the design tokens so it matches the
 * rest of the app (forest/cream palette, Playfair display heading).
 *
 * BUG-B FIX (2026-09-06): "Back to dashboard" was a hardcoded /home link — a
 * live vendor hitting a 404 was sent to the SHOPPER dashboard. Now the page
 * resolves the viewer (vendorId → vendor shell) the same way /home does, and
 * anonymous visitors get Explore instead of a login-gated dead end.
 */
export default async function NotFound() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);

  const isVendor = !!identity?.vendorId;
  const dashHref = identity ? (isVendor ? "/vendor/dashboard" : "/home") : "/explore";
  const dashLabel = identity ? (isVendor ? "Vendor dashboard" : "My dashboard") : "Browse listings";

  return (
    <main
      data-testid="not-found"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        background: "var(--color-glass-white)",
        padding: "var(--space-4)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 72,
          color: "var(--color-forest)",
          margin: 0,
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p
        style={{
          fontFamily: "var(--role-font-ui)",
          fontSize: 16,
          color: "var(--role-text-muted, var(--color-ink-muted))",
          margin: 0,
          maxWidth: 420,
        }}
      >
        We couldn&apos;t find this page — it may have been removed, or the link
        was off by one.
      </p>
      <Link
        href={dashHref}
        data-testid="not-found-back"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          borderRadius: 999,
          background: "var(--color-forest)",
          color: "var(--color-cream)",
          fontFamily: "var(--role-font-ui)",
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        {dashLabel}
      </Link>
      <Link
        href="/"
        style={{
          fontFamily: "var(--role-font-ui)",
          fontSize: 14,
          color: "var(--color-forest)",
          textDecoration: "underline",
        }}
      >
        Back to voeq.ng
      </Link>
    </main>
  );
}
