"use client";

import Link from "next/link";
import { Plus, Eye, Stars, MessageSquare, BarChart3, Store, ArrowUpRight } from "lucide-react";
import { VendorWeeklyStats } from "@/components/vendor/VendorWeeklyStats";
import type { ExploreListing } from "@voeq/data";

/**
 * P-A round 68 — VENDOR DASHBOARD = COMMAND CENTER (not a mega-form).
 *
 * Why: the old dashboard stacked identity form + hours + socials + listings
 * manager + reviews + followers + analytics + storefront preview on ONE page
 * even though /vendor/storefront, /vendor/analytics, /vendor/reviews pages
 * already exist. Vendors couldn't tell what lived where.
 *
 * NEW split (minimal duplication, honest routing):
 *   - This week     -> /api/vendor/weekly (real page_events/messages/saves/follows)
 *   - My listings   -> card grid with LIVE / DRAFT pills (isPublished + status)
 *   - Quick actions -> Create listing, Edit storefront, Analytics, Messages
 *   - Everything else lives on its dedicated page (storefront/analytics/reviews).
 */
interface Props {
  vendor: { id: string; name: string; status: string };
  listings: Array<{
    id: string;
    title: string;
    description: string | null;
    priceMinMinor: number;
    priceMaxMinor: number | null;
    images: string[];
    isPublished: boolean;
    status: string;
    categorySlug?: string | null;
    vendorName?: string;
  }>;
}

const PRICE = (v: number) => `₦${(v / 100).toLocaleString("en-NG")}`;

export function VendorDashboardClient({ vendor, listings }: Props) {
  const liveCount = listings.filter((l) => l.isPublished && l.status === "active").length;
  const draftCount = listings.length - liveCount;

  const quickActions = [
    { href: "/vendor/listings/create", label: "Create listing", icon: Plus, tone: "amber" },
    { href: "/vendor/storefront", label: "Edit storefront", icon: Store, tone: "outline" },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart3, tone: "outline" },
    { href: "/messages", label: "Messages", icon: MessageSquare, tone: "outline" },
  ];

  return (
    <div data-testid="vendor-dashboard-client" style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 4, paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}>
      {/* P-A round 68: bottom padding clears the AppShell fixed bottom bar — the
          old dashboard had paddingBottom: 80 INSIDE the grid so the last cards
          were never covered by the nav on mobile. */}
      {/* THIS WEEK — real numbers from /api/vendor/weekly */}
      <section aria-label="This week">
        <SectionTitle
          left={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Eye size={17} color="var(--role-accent)" /> This week
            </span>
          }
        />
        <VendorWeeklyStats />
      </section>

      {/* QUICK ACTIONS */}
      <section aria-label="Quick actions">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <Link
                key={qa.href}
                href={qa.href}
                data-testid={`quick-${qa.label.toLowerCase().replace(/\s+/g, "-")}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 15px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: qa.tone === "amber" ? "none" : "1px solid var(--role-border)",
                  background: qa.tone === "amber" ? "var(--role-accent)" : "var(--role-surface)",
                  color: qa.tone === "amber" ? "var(--role-on-accent)" : "var(--role-text)",
                  boxShadow: qa.tone === "amber" ? "0 6px 16px rgba(232,163,61,.30)" : "0 1px 4px rgba(15,42,29,.06)",
                }}
              >
                <Icon size={16} />
                {qa.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* MY LISTINGS — LIVE / DRAFT pills */}
      <section aria-label="My listings">
        <SectionTitle
          left={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Store <span style={{ color: "var(--role-text-muted)", fontWeight: 500, fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: "var(--role-text-muted)", fontWeight: 500 }}>
                {liveCount} live · {draftCount} draft
              </span>
            </span>
          }
          right={<Link href="/vendor/listings/create" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--role-gold)", textDecoration: "none" }}>+ Add listing</Link>}
        />
        {listings.length === 0 ? (
          <div
            data-testid="listings-empty"
            style={{
              border: "1.5px dashed var(--role-border)",
              borderRadius: 14,
              padding: "26px 18px",
              textAlign: "center",
              color: "var(--role-text-muted)",
              fontSize: 13.5,
            }}
          >
            No listings yet. Your storefront is waiting —{" "}
            <Link href="/vendor/listings/create" style={{ color: "var(--role-gold)", fontWeight: 600, textDecoration: "none" }}>
              create your first one
            </Link>
            .
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {/* LINKS THE MOBILE BOTTOM NAV DOESN'T HAVE (AppShell bottom bar already
          covers Dashboard/Listings/Analytics/Messages/You on mobile) — so we
          show only the two dedicated pages a vendor needs. */}
      <section aria-label="More">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TileLink href="/vendor/storefront" icon={<Store size={16} />} title="Storefront" desc="Photo, hours, socials" />
          <TileLink href="/vendor/reviews" icon={<Stars size={16} />} title="Reviews" desc="Ratings & feedback" />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--role-font-display)",
          fontSize: 19,
          fontWeight: 600,
          color: "var(--role-text)",
          margin: 0,
        }}
      >
        {left}
      </h2>
      {right}
    </div>
  );
}

function ListingCard({ listing }: { listing: Props["listings"][number] }) {
  const isLive = listing.isPublished && listing.status === "active";
  const img = listing.images?.[0];
  return (
    <Link
      href={`/vendor/listings/${listing.id}/edit`}
      data-testid={`listing-card-${listing.id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        border: "1px solid var(--role-border)",
        borderRadius: 14,
        overflow: "hidden",
        background: "var(--role-surface)",
        boxShadow: "0 1px 5px rgba(15,42,29,.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ aspectRatio: "4/3", background: "var(--role-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          <span style={{ fontFamily: "var(--role-font-display)", fontSize: 22, color: "var(--role-text-muted)" }}>
            {listing.title.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.title}</span>
          <StatusPill live={isLive} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--role-text)" }}>
          {PRICE(listing.priceMinMinor)}
          {listing.priceMaxMinor ? ` – ${PRICE(listing.priceMaxMinor)}` : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "var(--role-text-muted)" }}>
          <span>{listing.categorySlug ? listing.categorySlug.replace(/-/g, " ") : "—"}</span>
          <ArrowUpRight size={13} />
        </div>
      </div>
    </Link>
  );
}

function StatusPill({ live }: { live: boolean }) {
  return (
    <span
      data-testid="listing-status-pill"
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 999,
        background: live ? "var(--role-success-bg)" : "var(--role-warning)",
        color: live ? "var(--role-success-text)" : "var(--role-text-muted)",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: live ? "var(--role-success-text)" : "var(--role-gold)" }} />
      {live ? "Live" : "Draft"}
    </span>
  );
}

function TileLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      href={href}
      style={{
        border: "1px solid var(--role-border)",
        borderRadius: 14,
        padding: "13px 14px",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "var(--role-surface)",
      }}
    >
      <span style={{ color: "var(--role-accent)" }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 11.5, color: "var(--role-text-muted)" }}>{desc}</span>
    </Link>
  );
}
