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
            {listings.map((l) => {
              // MATRIX FIX (2026-09-06): filter falsy image URLs (empty string
              // in images[] rendered <img src=""> — same guard as ListingCard).
              const imgs = (l.images ?? []).filter((u) => typeof u === "string" && u.trim() !== "");
              return (
              <Link key={l.id} href={`/listing/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="voeq-card">
                  {/* BUG-C (2026-09-06): saved cards show ALL photos via the
                      same swipe track (was first-photo-only). */}
                  {imgs.length > 0 && (
                    <div className="voeq-card-image" style={{ position: "relative" }}>
                      <div
                        data-testid="saved-card-track"
                        className="voeq-card-track"
                        onScroll={(e) => {
                          const el = e.currentTarget;
                          if (el.clientWidth === 0) return;
                          const i = Math.max(0, Math.min(imgs.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
                          const dots = el.parentElement?.querySelectorAll("[data-saved-dot]");
                          dots?.forEach((d, di) => {
                            (d as HTMLElement).style.background = di === i ? "var(--color-cream)" : "rgba(246,241,230,.45)";
                          });
                        }}
                        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", width: "100%", height: "100%", scrollbarWidth: "none" }}
                      >
                        {imgs.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={src} alt={`${l.title} — photo ${i + 1}`} style={{ minWidth: "100%", width: "100%", height: "100%", objectFit: "cover", display: "block", scrollSnapAlign: "start" }} loading="lazy" />
                        ))}
                      </div>
                      {imgs.length > 1 && (
                        <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, pointerEvents: "none" }}>
                          {imgs.map((_, i) => (
                            <span key={i} data-saved-dot style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "var(--color-cream)" : "rgba(246,241,230,.45)", boxShadow: "0 0 2px rgba(15,42,29,.5)" }} />
                          ))}
                        </div>
                      )}
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
              );
            })}
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
