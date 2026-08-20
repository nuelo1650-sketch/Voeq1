import Link from "next/link";
import type { VendorStorefrontView } from "@voeq/data";

/**
 * StorefrontHero — the editorial arrival band for a vendor's world (PG-PUB-004).
 * Vendor name in display type, a circular avatar (initials fallback), the locked
 * "Student Vouched" trust language, and a derived rating (hidden when 0 — never
 * show a fake 0.0). Deep environment tokens apply via the page's `data-env="deep"`.
 */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function StorefrontHero({ vendor }: { vendor: VendorStorefrontView }) {
  const hasRating = typeof vendor.ratingAvg === "number" && vendor.ratingAvg > 0;
  return (
    <header
      data-testid="storefront-hero"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) 0",
        borderBottom: "1px solid var(--role-border)",
        marginBottom: "var(--space-4)",
      }}
    >
      {/* Avatar: 64px circle, --role-surface bg, initials fallback (no broken-image) */}
      <div
        data-testid="storefront-avatar"
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--role-surface)",
          color: "var(--role-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          fontWeight: 700,
          fontFamily: "var(--role-font-display)",
          flexShrink: 0,
          border: "1px solid var(--role-border)",
        }}
      >
        {initials(vendor.name)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1
          data-testid="storefront-name"
          style={{
            margin: 0,
            fontFamily: "var(--role-font-display)",
            fontSize: "2.5rem",
            lineHeight: 1.05,
            color: "var(--role-text)",
          }}
        >
          {vendor.name}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", fontSize: "13px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
          {/* Locked trust language — "Student Vouched", never "Verified". */}
          <span data-testid="storefront-vouched" style={{ color: "var(--role-accent-strong)" }}>
            ✓ Student Vouched
          </span>
          {hasRating && (
            <span data-testid="storefront-rating">★ {vendor.ratingAvg!.toFixed(1)}</span>
          )}
          <span>{vendor.campus}</span>
          <Link href="/explore" data-testid="storefront-back" style={{ color: "var(--role-text-muted)", textDecoration: "none" }}>
            ← Explore
          </Link>
        </div>
      </div>
    </header>
  );
}
