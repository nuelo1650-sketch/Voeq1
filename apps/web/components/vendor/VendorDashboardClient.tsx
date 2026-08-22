"use client";

import { useState } from "react";
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
 * VS5.4 — Stateful dashboard wrapper. Holds a draft of the vendor that all forms
 * write to via onChange, and feeds it into the live StorefrontPreview so edits
 * reflect immediately (before save). Saves are still server-authoritative per form.
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start" }}>
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
  );
}
