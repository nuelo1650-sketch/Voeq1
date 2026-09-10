"use client";

/**
 * ExploreDoor (Money Bag A10, upgraded per founder: "do them well and better")
 * — the gateway from the landing advertisement into the real market.
 *
 * NOT the mock's single dashed pill. Upgraded into a full door section:
 * a warm sand panel that sells the jump — real market counts (live listings,
 * categories, areas), three quick-entry cards (Full market / Voeq Live /
 * Fresh drops), then the dashed pill itself as the final CTA. All counts
 * from the real payload (B7); the section collapses if the market is empty.
 */

import Link from "next/link";
import type { ExploreListing } from "@voeq/data";

function ExploreDoorInner({
  listings,
  categories,
  areas,
}: {
  listings: ExploreListing[];
  categories: number;
  areas: number;
}) {
  if (listings.length === 0) return null; // B7 collapse

  const freshCount = listings.filter((l) => {
    if (!l.createdAt) return false;
    return Date.now() - new Date(l.createdAt).getTime() < 72 * 3600 * 1000;
  }).length;

  const quick = [
    {
      href: "/explore?next=mb",
      title: "The full market",
      sub: `${listings.length} listing${listings.length === 1 ? "" : "s"} live right now`,
      testid: "mb-door-market",
    },
    {
      href: "/explore/live?next=mb",
      title: "✦ Voeq Live",
      sub: "Today's hand-picked shelf",
      testid: "mb-door-live",
    },
    {
      href: "/explore?next=mb&sort=newest",
      title: "Fresh drops",
      sub: freshCount > 0 ? `${freshCount} listed in the last 72h` : "New arrivals, as they land",
      testid: "mb-door-fresh",
    },
  ];

  return (
    <section
      data-testid="mb-explore-door"
      className="mb-door"
      style={{
        maxWidth: 1200,
        margin: "34px auto 0",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          background: "var(--sand, #EFE7D3)",
          borderRadius: 24,
          padding: "28px 22px 24px",
          border: "1px solid rgba(15,42,29,0.08)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--role-font-display)",
            fontSize: "clamp(22px, 5vw, 30px)",
            fontWeight: 900,
            color: "var(--forest-deep, #0F2A1D)",
            lineHeight: 1.1,
          }}
        >
          Open the full market
          <span
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--role-muted, #6f6a5e)",
              marginTop: 6,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Filters, categories, every area — everything the landing shows, searchable.
          </span>
        </h2>

        {/* Quick-entry cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
            marginTop: 18,
          }}
        >
          {quick.map((q) => (
            <Link
              key={q.testid}
              href={q.href}
              data-testid={q.testid}
              className="mb-door-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "var(--role-surface, #fffef9)",
                border: "1px solid rgba(15,42,29,0.1)",
                borderRadius: 16,
                padding: "14px 16px",
                textDecoration: "none",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--forest-deep, #0F2A1D)" }}>
                  {q.title}
                </b>
                <small style={{ display: "block", fontSize: 12.5, color: "var(--role-muted, #6f6a5e)", marginTop: 2 }}>
                  {q.sub}
                </small>
              </span>
              <span
                aria-hidden
                style={{
                  flex: "0 0 30px",
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: "var(--forest-deep, #0F2A1D)",
                  color: "var(--color-amber, #E8A33D)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                →
              </span>
            </Link>
          ))}
        </div>

        {/* Meta chips: real counts only */}
        {(categories > 0 || areas > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {categories > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--forest-deep, #0F2A1D)",
                  background: "rgba(255,255,255,0.65)",
                  borderRadius: 999,
                  padding: "5px 12px",
                }}
              >
                {categories} categories
              </span>
            )}
            {areas > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--forest-deep, #0F2A1D)",
                  background: "rgba(255,255,255,0.65)",
                  borderRadius: 999,
                  padding: "5px 12px",
                }}
              >
                {areas} states &amp; FCT
              </span>
            )}
          </div>
        )}

        {/* The dashed pill — kept, as the final invitation */}
        <Link
          href="/explore?next=mb"
          data-testid="mb-door-pill"
          className="mb-door-pill"
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 14,
            borderRadius: 999,
            border: "1.5px dashed rgba(15,42,29,0.28)",
            color: "var(--forest-deep, #0F2A1D)",
            fontWeight: 700,
            fontSize: 14,
            background: "rgba(255,255,255,0.5)",
            textDecoration: "none",
          }}
        >
          Enter the market <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

export function ExploreDoor({
  listings,
  categories,
  areas,
}: {
  listings: ExploreListing[];
  categories: number;
  areas: number;
}) {
  return <ExploreDoorInner listings={listings} categories={categories} areas={areas} />;
}
