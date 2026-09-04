import { redirect } from "next/navigation";
import { requireConsent, getStaffIdentity } from "@/lib/session";
import {
  mockVendorRepo,
  mockListingsRepo,
  canVendorBePublic,
  mockReviewRepo,
  mockCampusRepo,
  mockFollowRepo,
} from "@voeq/data";
import { VendorGoLiveButton } from "@/components/vendor/VendorGoLiveButton";
import { GreetingText } from "@/components/vendor/GreetingText";
import { VendorDashboardClient } from "@/components/vendor/VendorDashboardClient";
import { AppShell } from "@/components/shell/AppShell";

/**
 * VS3.4 / VS5 + K3b.1 — Vendor dashboard (single-scroll, one-identity).
 * Enhanced with modern header, attention queue indicators, and quick actions.
 */
export default async function VendorDashboardPage() {
  const identity = await requireConsent("/vendor/dashboard");
  const staff = await getStaffIdentity();
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  const allListings = await mockListingsRepo.list();
  const listings = allListings
    .filter((l) => l.vendorId === vendor.id)
    .map((l) => ({
      ...l,
      vendorName: vendor.name,
      rating: undefined,
      // P-A round 57 (C11): `verified` was read off the LISTING — a field that
      // does not exist (verification lives on the VENDOR). Rows showed
      // "verified: $undefined" and verifiedCount was forever 0.
      verified: vendor.verified,
      categorySlug: l.categoryId,
      image: l.images?.[0],
    }));
  const live = canVendorBePublic(vendor);
  const reviews = await mockReviewRepo.listByVendor(vendor.id);
  const ratingCount = reviews.length;
  const ratingAvg =
    ratingCount > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10 : 0;
  const verifiedCount = listings.filter((l) => (l as { verified?: boolean }).verified).length;

  const campusList = await mockCampusRepo.list(identity.id);
  const campus = campusList.find((c) => c.id === vendor.campus);
  const campusName = campus?.name || vendor.campus;

  // Time-aware greeting. P-A round 66: the SERVER version used UTC
  // (new Date().getHours() is UTC on Render/Vercel) — wrong for West Africa
  // Time (UTC+1): e.g. 00:30 Lagos read "Good evening" at 23:30 UTC.
  // Greeting is rendered by a client component (GreetingText) so the hour
  // follows the visitor's LOCAl clock; server passes the vendor name only.
  const greetingValue = "Good day"; // client overrides immediately

  // Vendor redesign (2026-09-04): real follower count for the hero.
  const followers = await mockFollowRepo.listByVendor(vendor.id).catch(() => []);
  const followersCount = followers.length;

  return (
    <AppShell role="vendor" userName={vendor.name} staffRole={staff?.staffRole ?? null}>
      <div data-testid="vendor-dashboard" style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      {/* Vendor redesign (2026-09-04, mock v2 GO): the storefront HERO replaces
          the old greeting header — the vendor's identity IS their shop.
          Greeting still lives in the shell context; the hero is the anchor. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0, color: "var(--color-forest)" }}>
          <GreetingText name={vendor.name.split(" ")[0]} />
        </h1>
      </div>

      {vendor.status === "suspended" && (
        <div data-testid="vendor-suspended-banner" role="alert" style={{ background: "var(--color-danger)", color: "var(--color-cream)", padding: "var(--space-3)", borderRadius: 8, marginBottom: "var(--space-3)" }}>
          Your storefront is suspended. Contact support@voeq.ng for details.
        </div>
      )}

      {/* Open your store — warm progress (mock v2: amber current ring, forest
          done steps, horizontal desktop / vertical mobile). Only for vendors
          who haven't gone live yet; live vendors see the hero LIVE pill. */}
      {!live && (
        <section data-testid="phase-b-steps" style={{ background: "var(--color-cream)", border: "1px solid rgba(232,163,61,.45)", borderRadius: 14, padding: "18px 20px", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 4, color: "var(--color-forest)" }}>
            Open your store
          </h2>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 13, margin: 0, marginBottom: 14 }}>
            Three steps and your storefront goes live on Explore.
          </p>
          <ol style={{ listStyle: "none", display: "flex", gap: 0, margin: 0, padding: 0 }} aria-label="Setup progress">
            {[
              { done: !!vendor.profilePhotoUrl, label: "Profile photo", n: "1" },
              { done: listings.length > 0, label: "First listing", n: "2" },
              { done: live, label: "Go live", n: "3" },
            ].map((s, i, arr) => {
              const current = !s.done && arr.slice(0, i).every((p) => p.done);
              return (
                <li key={s.label} data-testid={`step-${s.label.toLowerCase().replace(/\s+/g, "-")}`} style={{ flex: 1, textAlign: "center", position: "relative", padding: "0 6px" }}>
                  {i < arr.length - 1 && (
                    <span aria-hidden style={{ position: "absolute", top: 16, left: "calc(50% + 20px)", width: "calc(100% - 40px)", height: 2, background: arr[i].done ? "var(--color-forest)" : "var(--role-border)" }} />
                  )}
                  <span style={{
                    width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 7px",
                    fontSize: 13, fontWeight: 700,
                    background: s.done ? "var(--color-forest)" : current ? "var(--color-amber)" : "var(--role-surface)",
                    color: s.done ? "#f3f1ea" : current ? "var(--color-forest)" : "var(--role-text-muted)",
                    border: s.done ? "1.5px solid var(--color-forest)" : current ? "1.5px solid var(--color-amber)" : "1.5px solid var(--role-border)",
                    boxShadow: current ? "0 0 0 5px rgba(232,163,61,.18)" : "none",
                  }}>
                    {s.done ? "✓" : s.n}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.done || current ? "var(--color-ink)" : "var(--role-text-muted)" }}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <div data-testid="can-go-live" style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <VendorGoLiveButton live={live} />
          </div>
        </section>
      )}

      <hr style={{ border: 0, borderTop: "1px solid var(--role-border)", margin: "var(--space-4) 0" }} />

      <VendorDashboardClient
        vendor={{
          id: vendor.id,
          name: vendor.name,
          status: vendor.status,
          verified: vendor.verified,
          campus: campusName,
          profilePhotoUrl: vendor.profilePhotoUrl ?? null,
        }}
        followersCount={followersCount}
        listings={listings}
      />
      </div>
    </AppShell>
  );
}
