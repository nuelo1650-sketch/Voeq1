"use client";

import Link from "next/link";
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

export function VendorListingsManager({ vendor, isPublic, listings }: Props) {
  const live = listings.filter((l) => l.isPublished && l.status === "active");
  const draft = listings.filter((l) => !l.isPublished || l.status !== "active");

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "var(--space-3) 16px 88px" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--color-forest)" }}>
            Your listings
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--role-text-muted)" }}>
            {live.length} live · {draft.length} draft — shoppers see this on "{vendor.name}"
          </p>
        </div>
        <Link
          href="/vendor/listings/create"
          data-testid="listings-create-cta"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "var(--color-forest)", color: "var(--color-cream)", borderRadius: 999, textDecoration: "none", fontWeight: 650, fontSize: 14 }}
        >
          <Plus size={16} /> Add listing
        </Link>
      </header>

      {/* GO-LIVE banner — the honest gate: pending vendors can't be seen yet */}
      {!isPublic && (
        <section
          data-testid="listings-golive-banner"
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "var(--space-3)",
            borderRadius: 12, border: "1px solid var(--color-amber)", background: "var(--color-cream)", marginBottom: "var(--space-3)",
          }}
        >
          <Rocket size={22} style={{ color: "var(--color-forest)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ color: "var(--color-forest)", display: "block", fontSize: 14 }}>
              Not live yet — shoppers can't see your storefront
            </strong>
            <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>
              Add a profile photo, then press Go live to appear in Explore.
            </span>
          </div>
          <Link
            href="/vendor/dashboard"
            data-testid="listings-golive-cta"
            style={{ padding: "9px 16px", background: "var(--color-amber)", color: "var(--color-forest)", borderRadius: 999, textDecoration: "none", fontWeight: 700, fontSize: 13, flexShrink: 0 }}
          >
            Go live
          </Link>
        </section>
      )}

      {/* Preview card — what shoppers see */}
      <Link
        href={vendor.slug ? `/v/${vendor.slug}` : `/vendor/${vendor.id}`}
        data-testid="listings-preview-card"
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "var(--space-3)", marginBottom: "var(--space-3)",
          borderRadius: 12, border: "1px solid var(--role-border)", background: "var(--role-surface)",
          textDecoration: "none", color: "inherit",
        }}
      >
        <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", background: "var(--color-forest)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-cream)", fontSize: 18, fontFamily: "var(--font-display)", flexShrink: 0 }}>
          {vendor.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (vendor.name[0]?.toUpperCase() ?? "V")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", color: "var(--color-forest)", fontSize: 14.5 }}>{vendor.name}</strong>
          <span style={{ fontSize: 12.5, color: "var(--role-text-muted)" }}>
            {isPublic ? "Live storefront — what shoppers see" : "Preview storefront (preview only until live)"}
          </span>
        </div>
        <ExternalLink size={16} style={{ color: "var(--role-accent-strong)", flexShrink: 0 }} />
      </Link>

      {/* Listings */}
      {listings.length === 0 ? (
        <section
          data-testid="listings-empty"
          style={{ textAlign: "center", padding: "48px 24px", border: "1px dashed var(--role-border)", borderRadius: 12 }}
        >
          <div style={{ fontSize: 38, marginBottom: 8 }}>📦</div>
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
        <ul data-testid="listings-grid" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {listings.map((l) => (
            <li key={l.id} data-testid={`listing-row-${l.id}`} style={{ border: "1px solid var(--role-border)", borderRadius: 12, background: "var(--role-surface)", overflow: "hidden" }}>
              <Link href={`/listing/${l.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, textDecoration: "none", color: "inherit" }}>
                <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "var(--role-surface-sunken)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--role-muted)" }}>
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 14.5, color: "var(--role-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</strong>
                    <span
                      data-testid={`pill-${l.id}`}
                      style={{
                        fontSize: 10.5, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
                        background: l.isPublished && l.status === "active" ? "var(--role-success-bg)" : "var(--color-amber)",
                        color: l.isPublished && l.status === "active" ? "var(--role-success-text)" : "var(--color-forest)",
                      }}
                    >
                      {l.isPublished && l.status === "active" ? "Live" : "Draft"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--role-text-muted)", marginTop: 2 }}>
                    {fmtN(l.priceMinMinor)}{l.priceMaxMinor ? ` – ${fmtN(l.priceMaxMinor)}` : ""}
                    {l.description ? ` · ${l.description.slice(0, 42)}${l.description.length > 42 ? "…" : ""}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Link href={`/listing/${l.id}`} style={{ fontSize: 12, color: "var(--role-accent-strong)", fontWeight: 600, textDecoration: "none" }}>View</Link>
                  <Link href={`/vendor/listings/${l.id}/edit`} style={{ fontSize: 12, color: "var(--role-accent-strong)", fontWeight: 600, textDecoration: "none" }}>Edit</Link>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
