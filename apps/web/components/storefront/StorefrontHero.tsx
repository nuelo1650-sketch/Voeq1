"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { VendorStorefrontView } from "@voeq/data";
// S1 (2026-09-06): client-safe category data for id→NAME pills (the old hero
// rendered raw ids — shoppers literally saw "food"). Pure data, no repo leak.
import { categories } from "@voeq/data/explore-view";
import type { AuthStatusResponse } from "@/lib/authStatus";
import { trackEvent } from "@/lib/track";
import { OpenNowBadge } from "@/components/vendor/OpenNowBadge";
import { ContextBack } from "@/components/shopper/ContextBack";
import { FollowButton } from "@/components/shopper/FollowButton";
import { BrandBanner } from "@/components/storefront/BrandBanner";
import { usePendingIntent } from "@/lib/usePendingIntent";
import { MessageCircle } from "lucide-react";

/**
 * StorefrontHero — S1 "Goods first" (2026-09-06, founder-picked from the
 * storefront-layouts mock). Compact identity header: avatar + name + trust
 * line + category NAME pills + FULL description (the About card is retired —
 * the description lives here once, no lede duplication) + Contact/Follow row
 * + social chips + stat bar. Listings render immediately below.
 *
 * All behavior preserved: auth-to-act contact flow, pending-intent resume,
 * storefront_view tracking, ContextBack, OpenNowBadge, social links.
 */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const CAT_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.name]),
);

export function StorefrontHero({ vendor }: { vendor: VendorStorefrontView }) {
  const hasRating = typeof vendor.ratingAvg === "number" && vendor.ratingAvg > 0;
  const pathname = usePathname();
  const router = useRouter();

  // Auth check for messaging
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const { pending: pendingIntent, consume: consumeIntent } = usePendingIntent();

  // P-A round 60: record storefront visits (admin visibility; privacy-safe).
  useEffect(() => {
    if (vendor?.id) trackEvent("storefront_view", { refId: vendor.id, path: `/vendor/${vendor.id}` });
  }, [vendor?.id]);

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

  const categoriesShown = Array.isArray(vendor.categoryIds) ? vendor.categoryIds : [];
  // MONEY BAG D2 (A18): category pills COMPUTED from active listings when the
  // vendor's declared categoryIds are empty (fallback, no fabrication).
  const computedFromListings = new Set(
    (vendor.listings ?? []).map((l) => l.categorySlug).filter((s): s is string => Boolean(s)),
  );
  const pillIds =
    categoriesShown.length > 0
      ? categoriesShown
      : [...computedFromListings].map((slug) => slug); // slugs resolve via CAT_NAME_BY_ID fallback in the pills render
  const reviewCount = vendor.reviews.length;

  return (
    <div className="vs-hero">
      {/* MONEY BAG D2a (A17 hybrid banner): the banner slot ABOVE the identity
          header — brand plate by default, vendor cover when set. The name
          stays the identity-card hero below (v1.7 watermark rule). */}
      <BrandBanner
        vendorName={vendor.name}
        categoryNames={categoriesShown.map((id) => CAT_NAME_BY_ID[id] ?? id).filter(Boolean)}
        photoCover={vendor.photoCover}
      />
      {/* S1 identity header */}
      <header data-testid="storefront-hero" className="vs-hero-top">
        <div className="vs-idrow">
          {/* Avatar — P-A round 31: render the vendor PHOTO when one exists
              (Cloudinary) instead of always showing initials. */}
          <div data-testid="storefront-avatar" aria-hidden className="vs-avatar" style={vendor.profilePhotoUrl ? { background: "none", boxShadow: "0 8px 20px rgba(15,42,29,.18)" } : undefined}>
            {vendor.profilePhotoUrl ? (
              <img src={vendor.profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 24 }} />
            ) : (
              initials(vendor.name)
            )}
          </div>

          <div className="vs-idmeta">
            <div className="vs-namerow">
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
                <span data-testid="storefront-rating">★ {vendor.ratingAvg!.toFixed(1)} ({vendor.ratingCount} {vendor.ratingCount === 1 ? "review" : "reviews"})</span>
              )}
              <span data-testid="storefront-campus" style={{ color: "var(--color-ink-muted, #6f6a5e)", fontSize: 13.5 }}>{vendor.campus}</span>
              <span aria-hidden style={{ color: "var(--color-ink-subtle, #d9d2c3)" }}>·</span>
              {/* L3 (2026-09-06): was a hardcoded /explore link — half of the
                  explore<->storefront cycle. Now goes BACK the way the visitor
                  came; /explore only as the direct-entry fallback. */}
              <ContextBack
                fallback="/explore"
                label="← Back"
                testid="storefront-back"
                style={{
                  color: "var(--color-forest-mid, #2d5a3d)",
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: 550,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              />
            </div>

            {/* S1: category pills show NAMES (the old hero rendered raw ids —
                shoppers saw "food"). Unknown ids fall back to the id.
                D2: falls back to pills COMPUTED from active listings when the
                vendor has no declared categories. */}
            {pillIds.length > 0 && (
              <div className="vs-cat-badges" style={{ marginTop: 8 }}>
                {pillIds.slice(0, 3).map((cat) => (
                  <span key={cat} className="vs-cat-badge">{CAT_NAME_BY_ID[cat] ?? cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* S1: the FULL description lives here once — the About card is
            retired (no more lede + full-text duplication). storefront-about
            rides this element so the probe contract (full text present) holds. */}
        {vendor.description && (
          <p data-testid="storefront-about" className="vs-desc">{vendor.description}</p>
        )}

        {/* MONEY BAG D2 (A18): "On Voeq since {year}" — real member duration
            from the agreement acceptance. Omitted when null (honest). */}
        {vendor.agreementAcceptedAt && (
          <p data-testid="storefront-member-since" style={{ margin: 0, fontSize: 12.5, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
            On Voeq since {new Date(vendor.agreementAcceptedAt).getFullYear()}
          </p>
        )}

        {/* S1: Contact + Follow side by side (Follow moved up from Trust —
            one place per action). */}
        <div className="vs-ctarow">
          <button
            data-testid="storefront-contact-cta"
            onClick={handleContactVendor}
            disabled={authLoading}
            className="vs-cta"
          >
            <MessageCircle size={18} />
            Contact {vendor.name}
          </button>
          <FollowButton vendorId={vendor.id} className="storefront-follow-btn vs-follow" />
        </div>

        {/* Socials as chips */}
        {(vendor.socials?.phone || vendor.socials?.instagram || vendor.socials?.twitter || vendor.socials?.tiktok || vendor.socials?.whatsappChannel) && (
          <div data-testid="storefront-socials" className="vs-socials">
            {vendor.socials.phone && (
              <a href={`tel:${vendor.socials.phone}`} data-testid="storefront-social-phone" className="vs-social">📞 {vendor.socials.phone}</a>
            )}
            {/* L4b (2026-09-06): WhatsApp CHANNEL link — a public profile
                (same rule as Instagram/TikTok). The Doc 13 §13.13 ban covers
                vendor MESSAGING, not channel links. Full URL expected
                (https://www.whatsapp.com/channel/…) — mobile apps resolve to
                the channel, not WhatsApp Business. */}
            {vendor.socials.whatsappChannel && (
              <a href={vendor.socials.whatsappChannel} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-whatsapp" className="vs-social">✆ WhatsApp channel</a>
            )}
            {vendor.socials.instagram && (
              <a href={`https://instagram.com/${vendor.socials.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-instagram" className="vs-social">📷 {vendor.socials.instagram}</a>
            )}
            {vendor.socials.twitter && (
              <a href={`https://x.com/${vendor.socials.twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-twitter" className="vs-social">𝕏 {vendor.socials.twitter}</a>
            )}
            {vendor.socials.tiktok && (
              <a href={`https://tiktok.com/@${vendor.socials.tiktok.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" data-testid="storefront-social-tiktok" className="vs-social">🎵 TikTok</a>
            )}
          </div>
        )}

        {/* S1 stat bar: LISTINGS / RATING / REVIEWS — honest numbers only
            (rating shows — until real reviews exist; never invented). */}
        <div data-testid="storefront-stats" className="vs-statbar">
          <div className="vs-stat">
            <b>{vendor.listingCount}</b>
            <span>{vendor.listingCount === 1 ? "LISTING" : "LISTINGS"}</span>
          </div>
          <div className="vs-stat">
            <b>{hasRating ? `${vendor.ratingAvg!.toFixed(1)}★` : "—"}</b>
            <span>RATING</span>
          </div>
          <div className="vs-stat">
            <b>{reviewCount}</b>
            <span>{reviewCount === 1 ? "REVIEW" : "REVIEWS"}</span>
          </div>
        </div>
      </header>
    </div>
  );
}
