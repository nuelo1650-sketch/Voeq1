"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Eye, ExternalLink, Rocket } from "lucide-react";

interface Row {
  id: string;
  title: string;
  priceMinMinor: number;
  priceMaxMinor: number | null;
  categoryId: string;
  isPublished: boolean;
  status: string;
  images: string[];
  description: string;
}

interface PerListingStat { id: string; views: number; saves: number; }

interface Props {
  vendor: {
    id: string;
    name: string;
    status: string;
    slug: string | null;
    verified: boolean;
    profilePhotoUrl: string | null;
    description: string | null;
    campus: string | null;
  };
  isPublic: boolean;
  listings: Row[];
}

const fmtN = (minor: number) => `₦${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/**
 * VENDOR LISTINGS PAGE — redesigned 2026-09-04 (mock v1 GO), mobile-first.
 *
 * Card grid with REAL per-listing health (views+saves from /api/vendor/weekly
 * perListing — vendor-scoped), filter segments (All/Live/Drafts), footer
 * action rows (View/Edit), LIVE pulse pill / Draft pill, Top badge.
 * Keeps every existing testid + the go-live banner + storefront preview card.
 *
 * Honest-data: zero views shows 0; drafts show "finish setting up".
 */
export function VendorListingsManager({ vendor, isPublic, listings }: Props) {
  const [stats, setStats] = useState<Map<string, PerListingStat>>(new Map());
  const [filter, setFilter] = useState<"all" | "live" | "draft">("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendor/weekly")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { perListing?: PerListingStat[] }) => {
        if (!cancelled && d.perListing) setStats(new Map(d.perListing.map((p) => [p.id, p])));
      })
      .catch(() => { /* honest fallback: cards show "gathering data" */ });
    return () => { cancelled = true; };
  }, []);

  const isLive = (l: Row) => l.isPublished && l.status === "active";
  const liveCount = listings.filter(isLive).length;
  const draftCount = listings.length - liveCount;
  const visible = listings.filter((l) => (filter === "all" ? true : filter === "live" ? isLive(l) : !isLive(l)));
  const topId = (() => {
    let best: { id: string; score: number } | null = null;
    for (const [id, s] of stats) {
      const score = s.views + s.saves * 3;
      if (!best || score > best.score) best = { id, score };
    }
    return best && best.score > 0 ? best.id : null;
  })();

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "var(--space-3) 16px 96px" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 30px)", margin: 0, color: "var(--color-forest)", fontWeight: 600 }}>
              My listings
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--role-text-muted)" }}>
              {listings.length} listing{listings.length === 1 ? "" : "s"} · {liveCount} live · {draftCount} draft{draftCount === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/vendor/listings/create"
            data-testid="listings-create-cta"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", background: "var(--color-amber)", color: "var(--color-forest)", borderRadius: 11, textDecoration: "none", fontWeight: 700, fontSize: 13, boxShadow: "0 6px 18px rgba(232,163,61,.32)" }}
          >
            <Plus size={15} /> New listing
          </Link>
        </div>

        {/* Filter segments */}
        <div data-testid="listing-segments" style={{ display: "inline-flex", alignSelf: "flex-start", background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 11, padding: 3, gap: 2 }}>
          {([
            ["all", `All ${listings.length}`],
            ["live", `Live ${liveCount}`],
            ["draft", `Drafts ${draftCount}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                border: "none", background: filter === key ? "var(--color-forest)" : "transparent",
                color: filter === key ? "#f3f1ea" : "var(--role-text-muted)",
                fontFamily: "var(--role-font-ui)", fontSize: 12.5, fontWeight: 600,
                padding: "7px 14px", borderRadius: 8, cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* GO-LIVE banner (kept from r72) */}
      {!isPublic && (
        <section
          data-testid="listings-golive-banner"
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: 14,
            borderRadius: 12, border: "1px solid rgba(232,163,61,.45)", background: "var(--color-cream)", marginBottom: 12,
          }}
        >
          <Rocket size={20} style={{ color: "var(--color-forest)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ color: "var(--color-forest)", display: "block", fontSize: 13.5 }}>
              Not live yet — shoppers can't see your storefront
            </strong>
            <span style={{ fontSize: 12.5, color: "var(--role-text-muted)" }}>
              Add a profile photo, then press Go live to appear in Explore.
            </span>
          </div>
          <Link
            href="/vendor/dashboard"
            data-testid="listings-golive-cta"
            style={{ padding: "9px 15px", background: "var(--color-amber)", color: "var(--color-forest)", borderRadius: 999, textDecoration: "none", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}
          >
            Go live
          </Link>
        </section>
      )}

      {/* Preview card (kept from r72) */}
      <Link
        href={vendor.slug ? `/v/${vendor.slug}` : `/vendor/${vendor.id}`}
        data-testid="listings-preview-card"
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: 13, marginBottom: 14,
          borderRadius: 12, border: "1px solid var(--role-border)", background: "var(--role-surface)",
          textDecoration: "none", color: "inherit", boxShadow: "0 1px 4px rgba(15,42,29,.05)",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--color-forest)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-cream)", fontSize: 17, fontFamily: "var(--font-display)", flexShrink: 0 }}>
          {vendor.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (vendor.name[0]?.toUpperCase() ?? "V")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", color: "var(--color-forest)", fontSize: 14 }}>{vendor.name}</strong>
          <span style={{ fontSize: 12, color: "var(--role-text-muted)" }}>
            {isPublic ? "Live storefront — what shoppers see" : "Preview storefront (preview only until live)"}
          </span>
        </div>
        <ExternalLink size={15} style={{ color: "var(--role-accent-strong)", flexShrink: 0 }} />
      </Link>

      {/* Listings — card grid */}
      {listings.length === 0 ? (
        <section
          data-testid="listings-empty"
          style={{ textAlign: "center", padding: "44px 24px", border: "1.5px dashed var(--role-border)", borderRadius: 14 }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--role-text)" }}>
            No listings yet
          </p>
          <p style={{ margin: "6px 0 14px", fontSize: 13.5, color: "var(--role-text-muted)" }}>
            Create your first one — it takes less than a minute.
          </p>
          <Link href="/vendor/listings/create" style={{ padding: "10px 20px", background: "var(--color-forest)", color: "var(--color-cream)", borderRadius: 999, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            Create listing
          </Link>
        </section>
      ) : (
        <div data-testid="listings-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(235px, 1fr))", gap: 12 }}>
          {visible.map((l) => {
            const live = isLive(l);
            const stat = stats.get(l.id);
            const isTop = l.id === topId;
            return (
              <div
                key={l.id}
                data-testid={`listing-row-${l.id}`}
                style={{
                  border: "1px solid var(--role-border)", borderRadius: 15, background: "var(--role-surface)",
                  overflow: "hidden", boxShadow: "0 1px 4px rgba(15,42,29,.05)", display: "flex", flexDirection: "column",
                  opacity: live ? 1 : 0.88,
                }}
              >
                <Link href={`/listing/${l.id}`} aria-label={`View ${l.title}`} style={{ display: "block", position: "relative", aspectRatio: "16/10", background: "var(--color-amber-soft, rgba(232,163,61,.14))", textDecoration: "none" }}>
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0]} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 30 }}>🛍</span>
                  )}
                  {live ? (
                    <span data-testid={`pill-${l.id}`} style={{ position: "absolute", top: 9, left: 9, display: "inline-flex", alignItems: "center", gap: 5, background: "var(--color-forest)", color: "#f3f1ea", fontSize: 9.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-amber)", animation: "listingPulse 1.8s infinite" }} /> Live
                    </span>
                  ) : (
                    <span data-testid={`pill-${l.id}`} style={{ position: "absolute", top: 9, left: 9, background: "var(--color-cream)", color: "var(--role-text-muted)", border: "1px solid var(--role-border)", fontSize: 9.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
                      Draft
                    </span>
                  )}
                  {live && isTop && (
                    <span title="Top performer this week" style={{ position: "absolute", top: 9, right: 9, background: "var(--color-amber)", color: "var(--color-forest)", fontSize: 9.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
                      ★ Top
                    </span>
                  )}
                  {live && stat && stat.views > 0 && (
                    <span style={{ position: "absolute", bottom: 9, right: 9, background: "rgba(11,31,21,.72)", color: "#f3f1ea", backdropFilter: "blur(3px)", fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999 }}>
                      👁 {stat.views}
                    </span>
                  )}
                </Link>
                <div style={{ padding: "11px 13px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                  <strong style={{ fontSize: 14, color: "var(--role-text)", lineHeight: 1.3 }}>{l.title}</strong>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--color-forest)" }}>
                    {fmtN(l.priceMinMinor)}{l.priceMaxMinor ? ` – ${fmtN(l.priceMaxMinor)}` : ""}
                  </span>
                  {live && stat ? (
                    <span style={{ fontSize: 11.5, color: "var(--role-text-muted)", marginTop: 2 }}>
                      🔖 {stat.saves} saves · 👁 {stat.views} views
                    </span>
                  ) : !live ? (
                    <span style={{ fontSize: 11.5, color: "var(--role-text-muted)", fontStyle: "italic", marginTop: 2 }}>finish setting up</span>
                  ) : (
                    <span style={{ fontSize: 11.5, color: "var(--role-text-muted)", marginTop: 2 }}>gathering data…</span>
                  )}
                </div>
                <div style={{ display: "flex", borderTop: "1px solid var(--role-border)", marginTop: "auto" }}>
                  <Link href={`/listing/${l.id}`} style={{ ...footBtn, textDecoration: "none" }}>
                    👁 View
                  </Link>
                  <Link href={`/vendor/listings/${l.id}/edit`} style={{ ...footBtn, textDecoration: "none", borderRight: "none" }}>
                    ✎ Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

const footBtn: React.CSSProperties = {
  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  background: "none", border: "none", borderRight: "1px solid var(--role-border)",
  fontFamily: "var(--role-font-ui)", fontSize: 12.5, fontWeight: 600, color: "var(--role-text)",
  padding: "10px 4px", cursor: "pointer",
};
