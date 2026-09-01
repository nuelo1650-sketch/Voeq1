"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { VendorStorefrontView } from "@voeq/data";
import type { AuthStatusResponse } from "@/lib/authStatus";
import { OpenNowBadge } from "@/components/vendor/OpenNowBadge";
import { usePendingIntent } from "@/lib/usePendingIntent";
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
  const { pending: pendingIntent, consume: consumeIntent } = usePendingIntent();

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AuthStatusResponse | null) => {
        setIsAuthenticated(d?.authenticated ?? false);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });
  }, []);

  const handleContactVendor = async () => {
    // P-A round 32: check auth AT CLICK TIME (not from state — a race where the
    // status fetch hadn't resolved made clicks silently no-op or bounce to login
    // even though the session existed).
    let authed = isAuthenticated;
    if (!isAuthenticated || authLoading) {
      try {
        const s = await fetch("/api/auth/status");
        const d = (await s.json()) as AuthStatusResponse | null;
        authed = d?.authenticated ?? false;
      } catch {
        authed = false;
      }
      if (authed) setIsAuthenticated(true);
      setAuthLoading(false);
    }
    if (!authed) {
      router.push(
        `/login?next=${encodeURIComponent(pathname)}&intent=${encodeURIComponent(`message:${vendor.id}`)}`,
      );
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
        // P-A round 7 (A3): API returns { ok, conversation: { id } } —
        // reading data.conversationId produced /messages/undefined.
        const convId = data.conversation?.id ?? data.conversationId;
        if (convId) {
          router.push(`/messages/${convId}`);
        } else {
          router.push("/messages");
        }
      }
    } catch {
      // Error handled silently (K2.6 will add proper error UI)
    }
  };

  // Phase 1: resume a pending "message this vendor" intent after the auth gate.
  useEffect(() => {
    if (pendingIntent?.kind !== "message") return;
    if (!isAuthenticated || authLoading) return;
    if (pendingIntent.vendorId && pendingIntent.vendorId !== vendor.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId: vendor.id }),
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          // P-A round 7 (A3): same response-shape fix as handleContactVendor.
          const convId = data.conversation?.id ?? data.conversationId;
          if (convId) router.push(`/messages/${convId}`);
          else router.push("/messages");
        }
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent, isAuthenticated, authLoading, vendor.id]);

  useEffect(() => {
    if (pendingIntent) consumeIntent();
  }, [pendingIntent, consumeIntent]);

  // Category display
  const categories = Array.isArray(vendor.categoryIds) ? vendor.categoryIds : [];
  
  return (
    <div className="vs-hero">
      {/* Hero header */}
      <header data-testid="storefront-hero" className="vs-hero-top">
        {/* Avatar — P-A round 31: render the vendor PHOTO when one exists
            (Cloudinary) instead of always showing initials. */}
        <div data-testid="storefront-avatar" aria-hidden className="vs-avatar" style={vendor.profilePhotoUrl ? { background: "none", boxShadow: "0 8px 20px rgba(15,42,29,.18)" } : undefined}>
          {vendor.profilePhotoUrl ? (
            <img src={vendor.profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 24 }} />
          ) : (
            initials(vendor.name)
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: 8 }}>
              <h1 data-testid="storefront-name" className="vs-name">
                {vendor.name}
              </h1>
              <OpenNowBadge vendor={vendor} />
            </div>

            <div className="vs-trustrow">
              {vendor.verified && (
                <span data-testid="storefront-vouched" className="vs-trust">
                  ✓ Verified
                </span>
              )}
              {hasRating && (
                <span data-testid="storefront-rating">★ {vendor.ratingAvg!.toFixed(1)} ({vendor.ratingCount} {vendor.ratingCount === 1 ? 'review' : 'reviews'})</span>
              )}
              <span data-testid="storefront-campus">{vendor.campus}</span>
              <Link href="/explore" data-testid="storefront-back" style={{ color: "var(--color-ink-muted, #6f6a5e)", textDecoration: "none" }}>
                ← Explore
              </Link>
            </div>

            {/* Category badges */}
            {categories.length > 0 && (
              <div className="vs-cat-badges" style={{ marginBottom: 12 }}>
                {categories.slice(0, 3).map((cat) => (
                  <span key={cat} className="vs-cat-badge">{cat}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {vendor.description && (
              <p className="vs-desc">{vendor.description}</p>
            )}
          </div>

          {/* Primary CTA */}
          <button
            data-testid="storefront-contact-cta"
            onClick={handleContactVendor}
            disabled={authLoading}
            className="vs-cta"
          >
            <MessageCircle size={18} />
            Contact {vendor.name}
          </button>

          {/* Socials (existing) */}
          {(vendor.socials?.phone || vendor.socials?.instagram || vendor.socials?.twitter || vendor.socials?.tiktok) && (
            <div data-testid="storefront-socials" className="vs-socials">
              {vendor.socials.phone && (
                <a href={`tel:${vendor.socials.phone}`} data-testid="storefront-social-phone" className="vs-social">📞 {vendor.socials.phone}</a>
              )}
              {vendor.socials.instagram && (
                <a href={`https://instagram.com/${vendor.socials.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-instagram" className="vs-social">Instagram: {vendor.socials.instagram}</a>
              )}
              {vendor.socials.twitter && (
                <a href={`https://x.com/${vendor.socials.twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-twitter" className="vs-social">Twitter: {vendor.socials.twitter}</a>
              )}
              {vendor.socials.tiktok && (
                <a href={`https://tiktok.com/@${vendor.socials.tiktok.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-tiktok" className="vs-social">TikTok: {vendor.socials.tiktok}</a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Stats row */}
      <div data-testid="storefront-stats" className="vs-stats">
        <div className="vs-stat">
          <div className="vs-stat-value">{vendor.listingCount}</div>
          <div className="vs-stat-label">{vendor.listingCount === 1 ? 'Listing' : 'Listings'}</div>
        </div>

        {hasRating && (
          <div className="vs-stat">
            <div className="vs-stat-value">{vendor.ratingAvg!.toFixed(1)} ★</div>
            <div className="vs-stat-label">Average rating</div>
          </div>
        )}

        <div className="vs-stat">
          <div className="vs-stat-value">{vendor.verifiedCount}</div>
          <div className="vs-stat-label">Verified {vendor.verifiedCount === 1 ? 'listing' : 'listings'}</div>
        </div>
      </div>

      {/* About section */}
      <div data-testid="storefront-about" className="vs-card">
        <h2 className="vs-card-title">About</h2>
        <div className="vs-card-body">
          {vendor.description ? (
            <p style={{ margin: 0, marginBottom: 12 }}>{vendor.description}</p>
          ) : (
            <p style={{ margin: 0, marginBottom: 12, color: "var(--color-ink-muted, #6f6a5e)" }}>
              No description available yet.
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-ink-muted, #6f6a5e)" }}>
            <span>📍</span>
            <span>{vendor.campus}</span>
            {vendor.subArea && <span>• {vendor.subArea}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
