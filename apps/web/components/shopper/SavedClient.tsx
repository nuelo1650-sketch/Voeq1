"use client";

import Link from "next/link";
import type { Listing, Vendor } from "@voeq/data";
// BUNDLE FIX (2026-09-05): slug map from the pure-data submodule (root
// import ships drizzle + neon to the browser — see explore/Filters.tsx).
import { CATEGORY_ID_TO_SLUG } from "@voeq/data/explore-view";

/**
 * SavedClient — P-A round 12 (S1): renders the shopper's saved listings and
 * vendors. Real data from the server page; honest empty state (no fabrications).
 */
export function SavedClient({
  listings,
  vendors,
}: {
  listings: Listing[];
  vendors: Vendor[];
}) {
  const catName = (id?: string | null) => id ? (CATEGORY_ID_TO_SLUG[id] ?? id) : null;
  if (listings.length === 0 && vendors.length === 0) {
    return (
      <div className="wrap" style={{ padding: "32px 20px", textAlign: "center" }} data-testid="saved-empty">
        <h1 style={{ fontFamily: "var(--role-font-display)", fontSize: 30, color: "var(--color-forest)" }}>
          Nothing saved yet
        </h1>
        <p style={{ color: "var(--role-text-muted)", marginTop: 8 }}>
          Tap the ♡ on any listing or vendor you like and it shows up here — a wishlist that follows you.
        </p>
        <Link href="/explore" style={{ display: "inline-flex", marginTop: 18, background: "var(--color-forest)", color: "#f6f1e6", padding: "12px 22px", borderRadius: 999, textDecoration: "none", fontWeight: 650 }}>
          Browse Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "24px 20px 48px" }} data-testid="saved-content">
      <h1 style={{ fontFamily: "var(--role-font-display)", fontSize: 30, color: "var(--color-forest)" }}>
        Saved
      </h1>
      <p style={{ color: "var(--role-text-muted)", marginTop: 4 }}>
        {listings.length} listing{listings.length === 1 ? "" : "s"} · {vendors.length} vendor{vendors.length === 1 ? "" : "s"}
      </p>

      {listings.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--color-forest)" }}>Listings</h2>
          <div className="voeq-grid" data-testid="saved-grid">
            {listings.map((l) => (
              <Link key={l.id} href={`/listing/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="voeq-card">
                  {l.images?.[0] && (
                    <div className="voeq-card-image">
                      <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    </div>
                  )}
                  <div className="voeq-card-body">
                    <h3 className="voeq-card-title">{l.title}</h3>
                    <div className="voeq-card-price">₦{Math.round((l.priceMinor ?? l.priceMinMinor ?? 0) / 100).toLocaleString("en-NG")}</div>
                    <div className="voeq-comment-author" style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
                      {catName(l.categoryId) ?? "—"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {vendors.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--color-forest)" }}>Vendors</h2>
          <div className="voeq-grid" data-testid="saved-vendors">
            {vendors.map((v) => (
              <Link key={v.id} href={`/vendor/${v.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="voeq-card">
                  <div className="voeq-card-body">
                    <h3 className="voeq-card-title">{v.name}</h3>
                    <div className="voeq-comment-author" style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>Follow this vendor on their storefront</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
