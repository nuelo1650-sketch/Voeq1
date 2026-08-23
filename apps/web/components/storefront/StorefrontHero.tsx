"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { VendorStorefrontView } from "@voeq/data";
import { OpenNowBadge } from "@/components/vendor/OpenNowBadge";
import { MessageCircle } from "lucide-react";

/**
 * StorefrontHero — K2.4 enhanced vendor arrival band (PG-PUB-004).
 * Features:
 * - Large vendor avatar (80px forest green circle with initials)
 * - Vendor name (Playfair display), verified badge, rating
 * - Vendor description and category badges
 * - Stats row (total listings, rating average, verified count)
 * - Primary "Contact vendor" CTA (forest green, auth-gated)
 * - About section with campus location
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
  const pathname = usePathname();
  const router = useRouter();
  
  // Auth check for messaging
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setIsAuthenticated(d?.isAuthenticated ?? false);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });
  }, []);

  const handleContactVendor = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    
    // Create or open conversation (K2.4 #4)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversationId}`);
      }
    } catch {
      // Error handled silently (K2.6 will add proper error UI)
    }
  };

  // Category display
  const categories = Array.isArray(vendor.categoryIds) ? vendor.categoryIds : [];
  
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      {/* Hero header */}
      <header
        data-testid="storefront-hero"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-4)",
          padding: "var(--space-4) 0",
          marginBottom: "var(--space-3)",
        }}
      >
        {/* Avatar: 80px circle (K2.4 #2) */}
        <div
          data-testid="storefront-avatar"
          aria-hidden
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--color-forest)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: 700,
            fontFamily: "var(--role-font-display)",
            flexShrink: 0,
          }}
        >
          {initials(vendor.name)}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: 8 }}>
              <h1
                data-testid="storefront-name"
                style={{
                  margin: 0,
                  fontFamily: "var(--role-font-display)",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  lineHeight: 1.05,
                  color: "var(--role-text)",
                }}
              >
                {vendor.name}
              </h1>
              <OpenNowBadge vendor={vendor} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", fontSize: "14px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)", marginBottom: 8 }}>
              {/* Locked trust language — "Student Vouched" (K2.4 #2) */}
              <span data-testid="storefront-vouched" style={{ color: "var(--role-accent-strong)", fontWeight: 500 }}>
                ✓ Student Vouched
              </span>
              {hasRating && (
                <span data-testid="storefront-rating" style={{ fontWeight: 500 }}>★ {vendor.ratingAvg!.toFixed(1)} ({vendor.ratingCount} {vendor.ratingCount === 1 ? 'review' : 'reviews'})</span>
              )}
              <span>{vendor.campus}</span>
              <Link href="/explore" data-testid="storefront-back" style={{ color: "var(--role-text-muted)", textDecoration: "none" }}>
                ← Explore
              </Link>
            </div>

            {/* Category badges (K2.4 #2) */}
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", marginBottom: 12 }}>
                {categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    style={{
                      fontSize: "12px",
                      padding: "4px 12px",
                      background: "var(--role-surface-sunken)",
                      border: "1px solid var(--role-border)",
                      borderRadius: 999,
                      color: "var(--role-text)",
                      fontFamily: "var(--role-font-ui)",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Description (K2.4 #2) */}
            {vendor.description && (
              <p style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--role-text)",
                fontFamily: "var(--role-font-ui)",
                maxWidth: 600,
              }}>
                {vendor.description}
              </p>
            )}
          </div>

          {/* Primary CTA (K2.4 #4) */}
          <button 
            data-testid="storefront-contact-cta" 
            onClick={handleContactVendor}
            disabled={authLoading}
            style={{
              alignSelf: "flex-start",
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "var(--role-font-ui)",
              background: "var(--color-forest)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: authLoading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: authLoading ? 0.6 : 1,
            }}
          >
            <MessageCircle size={18} />
            Contact {vendor.name}
          </button>

          {/* Socials (existing) */}
          {(vendor.socials?.phone || vendor.socials?.instagram || vendor.socials?.twitter || vendor.socials?.tiktok) && (
            <div data-testid="storefront-socials" style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", fontSize: 13, fontFamily: "var(--role-font-ui)" }}>
              {vendor.socials.phone && (
                <a href={`tel:${vendor.socials.phone}`} data-testid="storefront-social-phone" style={{ color: "var(--role-text)" }}>📞 {vendor.socials.phone}</a>
              )}
              {vendor.socials.instagram && (
                <a href={`https://instagram.com/${vendor.socials.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-instagram" style={{ color: "var(--role-text)" }}>Instagram: {vendor.socials.instagram}</a>
              )}
              {vendor.socials.twitter && (
                <a href={`https://x.com/${vendor.socials.twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-twitter" style={{ color: "var(--role-text)" }}>Twitter: {vendor.socials.twitter}</a>
              )}
              {vendor.socials.tiktok && (
                <a href={`https://tiktok.com/@${vendor.socials.tiktok.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-tiktok" style={{ color: "var(--role-text)" }}>TikTok: {vendor.socials.tiktok}</a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Stats row (K2.4 #5) */}
      <div 
        data-testid="storefront-stats"
        style={{
          display: "flex",
          gap: "var(--space-4)",
          padding: "var(--space-3)",
          background: "var(--role-surface-sunken)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--role-border)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--role-text)",
            fontFamily: "var(--role-font-mono)",
          }}>
            {vendor.listingCount}
          </div>
          <div style={{
            fontSize: "13px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
          }}>
            {vendor.listingCount === 1 ? 'Listing' : 'Listings'}
          </div>
        </div>

        {hasRating && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--role-text)",
              fontFamily: "var(--role-font-mono)",
            }}>
              {vendor.ratingAvg!.toFixed(1)} ★
            </div>
            <div style={{
              fontSize: "13px",
              color: "var(--role-text-muted)",
              fontFamily: "var(--role-font-ui)",
            }}>
              Average rating
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--role-text)",
            fontFamily: "var(--role-font-mono)",
          }}>
            {vendor.verifiedCount}
          </div>
          <div style={{
            fontSize: "13px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
          }}>
            Verified {vendor.verifiedCount === 1 ? 'listing' : 'listings'}
          </div>
        </div>
      </div>

      {/* About section (K2.4 #6) */}
      <div 
        data-testid="storefront-about"
        style={{
          padding: "var(--space-3)",
          background: "var(--role-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--role-border)",
        }}
      >
        <h2 style={{
          margin: 0,
          marginBottom: "var(--space-2)",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-display)",
        }}>
          About
        </h2>
        <div style={{
          fontSize: "14px",
          lineHeight: 1.6,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-ui)",
        }}>
          {vendor.description ? (
            <p style={{ margin: 0, marginBottom: 12 }}>{vendor.description}</p>
          ) : (
            <p style={{ margin: 0, marginBottom: 12, color: "var(--role-text-muted)" }}>
              No description available yet.
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--role-text-muted)" }}>
            <span>📍</span>
            <span>{vendor.campus}</span>
            {vendor.subArea && <span>• {vendor.subArea}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
