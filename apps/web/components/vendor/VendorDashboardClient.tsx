"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit, BarChart3, MessageSquare, Eye, Heart, Bookmark } from "lucide-react";
import type { Vendor, VendorStorefrontView, ExploreListing } from "@voeq/data";
import { StorefrontIdentityForm } from "@/components/vendor/StorefrontIdentityForm";
import { StorefrontHoursForm } from "@/components/vendor/StorefrontHoursForm";
import { StorefrontSocialsForm } from "@/components/vendor/StorefrontSocialsForm";
import { StorefrontPreview } from "@/components/vendor/StorefrontPreview";
import { ListingManager } from "@/components/vendor/ListingManager";
import { VendorReviewsManager } from "@/components/vendor/VendorReviewsManager";
import { VendorAnalyticsPanel } from "@/components/vendor/VendorAnalyticsPanel";
import { VendorFollowersPanel } from "@/components/vendor/VendorFollowersPanel";

/**
 * VS5.4 + K3b.1 — Stateful dashboard wrapper. Holds a draft of the vendor that all forms
 * write to via onChange, and feeds it into the live StorefrontPreview so edits
 * reflect immediately (before save). Saves are still server-authoritative per form.
 * Enhanced with performance stats and quick actions bar.
 */
export function VendorDashboardClient({
  vendor,
  listings,
  ratingAvg,
  ratingCount,
  verifiedCount,
  reviews,
  disabled = false,
}: {
  vendor: Vendor;
  listings: ExploreListing[];
  ratingAvg: number;
  ratingCount: number;
  verifiedCount: number;
  reviews: VendorStorefrontView["reviews"];
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<Partial<Vendor>>({});

  const merged: Vendor = { ...vendor, ...draft };
  const previewView: VendorStorefrontView = {
    ...merged,
    listings,
    ratingAvg,
    ratingCount,
    verifiedCount,
    listingCount: listings.length,
    reviews,
  };

  return (
    <>
      {/* K3b.1 Performance summary - honest data only */}
      <section style={{ marginBottom: "var(--space-4)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0, marginBottom: "var(--space-3)", color: "var(--color-forest)" }}>
          This week
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <StatCard icon={Eye} label="Views" value="—" />
          <StatCard icon={MessageSquare} label="Messages" value="—" />
          <StatCard icon={Heart} label="New followers" value="—" />
          <StatCard icon={Bookmark} label="Saves" value="—" />
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start", paddingBottom: 80 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <section data-testid="storefront-identity-section">
            <StorefrontIdentityForm vendor={merged} disabled={disabled} onChange={(d) => setDraft((p) => ({ ...p, ...d }))} />
          </section>
          <section data-testid="hours-socials-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <StorefrontHoursForm vendor={merged} disabled={disabled} onChange={(d) => setDraft((p) => ({ ...p, ...d }))} />
            <StorefrontSocialsForm vendor={merged} disabled={disabled} onChange={(d) => setDraft((p) => ({ ...p, ...d }))} />
          </section>
          <section data-testid="listings-section">
            <ListingManager
              initial={listings.map((l) => ({
                id: l.id,
                title: l.title,
                priceMinMinor: l.priceMinMinor,
                priceMaxMinor: l.priceMaxMinor,
                categoryId: l.categoryId,
                description: l.description,
                images: l.images,
              }))}
            />
          </section>
          <VendorReviewsManager />
          <VendorFollowersPanel />
        </div>
        <div>
          <StorefrontPreview view={previewView} />
          <div style={{ marginTop: "var(--space-4)" }}>
            <VendorAnalyticsPanel />
          </div>
        </div>
      </div>

      {/* K3b.1 Quick actions bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--color-forest)",
        borderTop: "1px solid var(--color-forest-light)",
        padding: "var(--space-2) var(--space-3)",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/vendor/listings/create" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "var(--color-amber)", color: "var(--color-forest)", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            <Plus size={18} />
            Create listing
          </Link>
          <Link href="/vendor/storefront" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "transparent", color: "var(--color-cream)", border: "1px solid var(--color-cream)", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            <Edit size={18} />
            Edit storefront
          </Link>
          <Link href="/vendor/analytics" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "transparent", color: "var(--color-cream)", border: "1px solid var(--color-cream)", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            <BarChart3 size={18} />
            Analytics
          </Link>
          <Link href="/messages" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "transparent", color: "var(--color-cream)", border: "1px solid var(--color-cream)", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            <MessageSquare size={18} />
            Messages
          </Link>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          [style*="gridTemplateColumns"][style*="1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--color-cream)", border: "1px solid var(--color-ink-subtle)", borderRadius: 12, padding: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={20} style={{ color: "var(--color-forest-mid)" }} />
        <span style={{ fontSize: 14, color: "var(--color-ink-muted)" }}>{label}</span>
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 700, color: "var(--color-forest)" }}>
        {value}
      </span>
    </div>
  );
}
