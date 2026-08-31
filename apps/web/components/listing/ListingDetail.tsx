"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ExploreListing } from "@voeq/data";
import { ContourEdge, CampusFingerprint } from "@voeq/contour";
import { SaveButton } from "@/components/shopper/SaveButton";
import { LikeButton } from "@/components/shopper/LikeButton";
import { CommentForm } from "@/components/shopper/CommentForm";
import type { AuthStatusResponse, CommentsResponse, CreateResponse } from "@/lib/apiTypes";
import { CommentsList, type DisplayComment } from "@/components/shopper/CommentsList";
import { ReportForm } from "@/components/shopper/ReportForm";
import { usePendingIntent } from "@/lib/usePendingIntent";
import { Heart, Share2, Flag, X, ChevronLeft, ChevronRight, MessageCircle, Link2 } from "lucide-react";

/**
 * ListingDetail — K2.3 enhanced with gallery, vendor card, recommendation rows (Doc 04 PG-PUB-005).
 * Features:
 * - Image gallery with thumbnails + lightbox modal
 * - Vendor mini-card with rating, verified badge, storefront link
 * - Primary "Message vendor" CTA (forest green)
 * - "More from this vendor" horizontal row (3-4 listings)
 * - "You might also like" horizontal row (3-4 related listings, different vendors)
 * - Auth-gated messaging: authed → POST /api/conversations, unauthed → /login
 */

const AVAIL_LABEL: Record<string, string> = { open: "Open now", closed: "Sold out", soon: "Opening soon" };

function formatPrice(minor: number): string {
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

type DetailStatus = "loading" | "success" | "error" | "notfound";

export function ListingDetail({ id }: { id: string }) {
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [listing, setListing] = useState<ExploreListing | null>(null);
  const [moreFromVendor, setMoreFromVendor] = useState<ExploreListing[]>([]);
  const [youMightLike, setYouMightLike] = useState<ExploreListing[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Share
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [showShareButtons, setShowShareButtons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close share dropdown when clicking outside
  useEffect(() => {
    if (!showShareButtons) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-testid="listing-detail-share"]') && !target.closest('[data-testid="share-dropdown"]')) {
        setShowShareButtons(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showShareButtons]);
  // Report
  const [reportOpen, setReportOpen] = useState(false);
  // Comments (VS4.5) — public-read; fetched on mount
  const [comments, setComments] = useState<DisplayComment[]>([]);
  
  // Auth check for messaging
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Phase 1: pending intent (e.g. "I wanted to message this vendor") surfaced
  // after the auth gate. We wait for the vendor to resolve, then resume.
  const { pending: pendingIntent, consume: consumeIntent } = usePendingIntent();

  // Check auth status
  useEffect(() => {
    fetch("/api/auth/status")
      .then(async (r) => (r.ok ? await r.json() as AuthStatusResponse : null))
      .then((d) => {
        setIsAuthenticated(d?.authenticated ?? false);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    // Load main listing — P-A fix (2026-08-31): fetch the SERVER API route.
    // Previously client-side loadListing(id) bundled USE_REAL=false into the
    // browser -> mock repo -> null -> "Listing not found" for real Neon rows.
    (async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (res.status === 404) {
          if (!cancelled) setStatus("notfound");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setStatus("error");
          return;
        }
        const d = (await res.json()) as { listing: ExploreListing };
        if (cancelled) return;
        setListing(d.listing);
        setStatus("success");

        // Load "More from this vendor" (same vendorId, exclude current)
        try {
          const ex = (await (await fetch(`/api/explore`)).json()) as { data: ExploreListing[] };
          if (cancelled) return;
          const fromVendor = ex.data
            .filter((l) => l.vendorId === d.listing.vendorId && l.id !== id)
            .slice(0, 4);
          setMoreFromVendor(fromVendor);

          // Load "You might also like" (same category, different vendors)
          if (d.listing.categorySlug) {
            const ex2 = (await (
              await fetch(`/api/explore?${new URLSearchParams({ category: d.listing.categorySlug })}`)
            ).json()) as { data: ExploreListing[] };
            if (!cancelled) {
              const related = ex2.data
                .filter((l) => l.vendorId !== d.listing.vendorId && l.id !== id)
                .slice(0, 4);
              setYouMightLike(related);
            }
          }
        } catch {
          // secondary rails fail silently; the listing itself is shown
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    // Fetch public comments
    fetch(`/api/listings/${id}/comments`)
      .then(async (r) => (r.ok ? await r.json() as CommentsResponse : null))
      .then((d) => { if (!cancelled && d) setComments(d.comments); })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Phase 1: resume a pending "message vendor" intent after the auth gate.
  // We settle here (not in the handler) so it runs once the listing resolved and
  // the user is authenticated+post-login. consume() strips the intent so it
  // cannot re-fire on a refresh (the old loop).
  useEffect(() => {
    if (pendingIntent?.kind !== "message") return;
    if (!isAuthenticated || authLoading) return;
    if (!listing?.vendorId) return;
    const vendorId = listing.vendorId;
    if (pendingIntent.vendorId && pendingIntent.vendorId !== vendorId) return;
    let cancelledNow = false;
    (async () => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId, listingId: id }),
        });
        if (cancelledNow) return;
        if (res.ok) {
          const data = (await res.json()) as CreateResponse;
          if (data.conversation?.id) router.push(`/messages/${data.conversation.id}`);
        }
      } catch {
        // silent — user can tap Message manually
      }
    })();
    return () => {
      cancelledNow = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent, isAuthenticated, authLoading, listing, id]);

  useEffect(() => {
    if (pendingIntent) consumeIntent();
  }, [pendingIntent, consumeIntent]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing?.title ?? "Voeq listing";
    
    // Mobile: use native share API
    if (isMobile && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled share sheet — ignore */
      }
    }
    
    // Desktop: toggle social buttons dropdown
    if (!isMobile) {
      setShowShareButtons(!showShareButtons);
      return;
    }
    
    // Fallback: copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    }
  };

  const handleCopyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    }
  };

  const getShareUrls = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing?.title ?? "Voeq listing";
    const text = `Check out this listing: ${title}`;
    
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      instagram: url, // Copy link for Instagram
    };
  };

  // WhatsApp icon component
  const WhatsAppIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );

  // Twitter icon component
  const TwitterIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  // Facebook icon component
  const FacebookIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z"/>
    </svg>
  );

  // Instagram icon component
  const InstagramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
  );

  const handleMessageVendor = async () => {
    if (!listing?.vendorId) return;
    if (!isAuthenticated) {
      // Phase 1: carry the message intent through the auth gate so after login
      // the user drops straight into a conversation with THIS vendor (not just
      // back on the page, re-losing their intent — the old loop).
      router.push(
        `/login?next=${encodeURIComponent(pathname)}&intent=${encodeURIComponent(`message:${listing.vendorId}`)}`,
      );
      return;
    }
    
    if (!listing) return;
    
    // Create or open conversation (K2.6 - message thread wiring)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: listing.vendorId,
          listingId: listing.id,
        }),
      });
      
      if (res.ok) {
        const data = await res.json() as CreateResponse;
        if (data.conversation?.id) router.push(`/messages/${data.conversation.id}`);
      }
    } catch {
      // Error handled silently (K2.6 will add proper error UI)
    }
  };

  if (status === "loading") {
    return (
      <div data-testid="listing-detail-loading" style={{ padding: "var(--space-8) var(--nav-inline-pad)", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
        Loading…
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div data-testid="listing-detail-notfound" style={{ padding: "var(--space-8) var(--nav-inline-pad)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h1 style={{ fontFamily: "var(--role-font-display)", fontSize: "28px", margin: 0, color: "var(--role-text)" }}>Listing not found</h1>
        <Link href="/explore" data-testid="listing-detail-back" style={{ color: "var(--role-accent)", fontFamily: "var(--role-font-ui)" }}>← Back to Explore</Link>
      </div>
    );
  }

  if (status === "error" || !listing) {
    return (
      <div data-testid="listing-detail-error" role="alert" style={{ padding: "var(--space-8) var(--nav-inline-pad)", color: "var(--role-danger)", fontFamily: "var(--role-font-ui)" }}>
        Couldn&apos;t load this listing.
      </div>
    );
  }

  // Prepare gallery images
  const galleryImages = Array.isArray(listing.images) && listing.images.length > 0 
    ? listing.images 
    : listing.image 
    ? [listing.image] 
    : [];

  return (
    <div
      data-testid="listing-detail"
      className="explore-entrance"
      style={{ minHeight: "100vh", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)", paddingBottom: "calc(var(--space-8) + env(safe-area-inset-bottom))" }}
    >
      {/* Contour whisper */}
      <div data-testid="listing-detail-contour" style={{ marginBottom: "var(--space-2)" }}>
        <ContourEdge intensity="whisper" />
      </div>

      <div style={{ marginBottom: "var(--space-2)" }}>
        <Link
          href="/explore"
          data-testid="listing-detail-back"
          style={{ color: "var(--role-text-muted)", textDecoration: "none", fontFamily: "var(--role-font-ui)", fontSize: "14px" }}
        >
          ← Explore
        </Link>
      </div>

      <div
        className="listing-detail-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start" }}
      >
        {/* Gallery: main image + thumbnail strip (K2.3 #1) */}
        <div data-testid="listing-detail-gallery" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div
            data-testid="listing-detail-image-frame"
            onClick={() => galleryImages.length > 0 && setLightboxOpen(true)}
            style={{
              position: "relative",
              aspectRatio: "4 / 3",
              background: "var(--role-surface-sunken)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: galleryImages.length > 0 ? "pointer" : "default",
            }}
          >
            {galleryImages.length > 0 ? (
              <img
                src={galleryImages[selectedImageIndex]}
                alt={listing.title}
                data-testid="listing-detail-image"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <CampusFingerprint
                data-testid="listing-detail-monogram"
                activity={[0.6, 0.3, 0.8]}
                style={{ width: 72, height: 72 }}
              />
            )}
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div style={{ display: "flex", gap: "var(--space-1)", overflowX: "auto" }}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: 80,
                    height: 60,
                    flexShrink: 0,
                    border: idx === selectedImageIndex ? "2px solid var(--color-forest)" : "1px solid var(--role-border)",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <img src={img} alt={`${listing.title} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}

          {/* Action buttons (K2.3 #3, K2.10 enhanced with social share) */}
          <div className="listing-detail-actions" style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)", position: "relative" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <button 
                data-testid="listing-detail-share" 
                onClick={handleShare} 
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontFamily: "var(--role-font-ui)",
                  fontWeight: 500,
                  background: "transparent",
                  color: "var(--role-text)",
                  border: "1px solid var(--role-border)",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                }}
              >
                <Share2 size={16} />
                {shareState === "copied" ? "Link copied" : "Share"}
              </button>
              
              {/* Desktop: Social buttons dropdown */}
              {!isMobile && showShareButtons && (
                <div 
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    background: "var(--role-surface)",
                    border: "1px solid var(--role-border)",
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    minWidth: 200,
                  }}
                  data-testid="share-dropdown"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <a 
                      href={getShareUrls().whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#25D366",
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      <WhatsAppIcon />
                      WhatsApp
                    </a>
                    <button
                      onClick={handleCopyLink}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "var(--forest-800)",
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Link2 size={16} />
                      {shareState === "copied" ? "Copied!" : "Copy link"}
                    </button>
                    <a 
                      href={getShareUrls().twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#1DA1F2",
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      <TwitterIcon />
                      Twitter
                    </a>
                    <a 
                      href={getShareUrls().facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#1877F2",
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      <FacebookIcon />
                      Facebook
                    </a>
                    <button
                      onClick={async () => {
                        await navigator.clipboard?.writeText(getShareUrls().instagram);
                        setShareState("copied");
                        setTimeout(() => setShareState("idle"), 2000);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <InstagramIcon />
                      Instagram
                    </button>
                  </div>
                </div>
              )}
            </div>
            <SaveButton targetType="listing" targetId={listing.id} className="listing-detail-save" />
            <LikeButton targetType="listing" targetId={listing.id} className="listing-detail-like" />
            <button
              data-testid="listing-detail-report"
              onClick={() => setReportOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "transparent",
                border: "1px solid var(--role-border)",
                color: "var(--role-text-muted)",
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                fontSize: "14px",
                fontFamily: "var(--role-font-ui)",
                cursor: "pointer",
              }}
            >
              <Flag size={14} />
            </button>
          </div>

          {reportOpen && (
            <div
              data-testid="listing-detail-report-panel"
              style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontFamily: "var(--role-font-ui)" }}
            >
              <strong style={{ color: "var(--role-text)" }}>Report this listing</strong>
              <ReportForm targetType="listing" targetId={listing.id} onDone={() => setReportOpen(false)} />
            </div>
          )}
        </div>

        {/* Meta: title, price, vendor card, message CTA */}
        <div data-testid="listing-detail-meta" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div>
            <h1
              data-testid="listing-detail-title"
              style={{
                fontFamily: "var(--role-font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.05,
                margin: 0,
                marginBottom: "var(--space-2)",
                color: "var(--role-text)",
              }}
            >
              {listing.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
              <span
                data-testid="listing-detail-price"
                style={{
                  fontFamily: "var(--role-font-mono)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--role-text)",
                }}
              >
                {formatPrice(listing.priceMinor)}
              </span>
              {listing.availability && (
                <span
                  data-testid="listing-detail-availability"
                  style={{ fontSize: "12px", padding: "4px 10px", border: "1px solid var(--role-border)", borderRadius: 999, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}
                >
                  {AVAIL_LABEL[listing.availability]}
                </span>
              )}
            </div>

            <div
              data-testid="listing-detail-trust"
              style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", fontSize: "13px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}
            >
              {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
                <span data-testid="listing-detail-rating">★ {listing.vendorRatingAvg.toFixed(1)} <span style={{ color: "var(--role-text-muted)", fontSize: 14 }}>({listing.vendorRatingCount})</span></span>
              ) : (
                <span data-testid="listing-detail-rating-empty" style={{ color: "var(--role-text-muted)", fontSize: 14 }}>New</span>
              )}
              {listing.featured && (
                <span data-testid="listing-detail-featured" style={{ color: "var(--role-gold)" }}>
                  Featured
                </span>
              )}
            </div>

            {listing.description && (
              <p style={{ 
                marginTop: "var(--space-2)", 
                fontSize: "15px", 
                lineHeight: 1.6,
                color: "var(--role-text)",
                fontFamily: "var(--role-font-ui)",
              }}>
                {listing.description}
              </p>
            )}
          </div>

          {/* Vendor mini-card (K2.3 #2) */}
          <div 
            data-testid="listing-detail-vendor-card"
            style={{
              border: "1px solid var(--role-border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-3)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--color-forest)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontFamily: "var(--role-font-ui)",
                fontWeight: 600,
                fontSize: "18px",
              }}>
                {listing.vendorName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--role-text)", fontFamily: "var(--role-font-ui)" }}>
                  {listing.vendorName}
                </div>
              </div>
            </div>
            <Link
              href={`/vendor/${listing.vendorId}`}
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--color-forest)",
                textDecoration: "none",
                fontFamily: "var(--role-font-ui)",
              }}
            >
              View storefront →
            </Link>
          </div>

          {/* Message CTA - primary forest green (K2.3 #3, #6) */}
          <button 
            data-testid="listing-detail-message-cta" 
            onClick={handleMessageVendor}
            disabled={authLoading}
            style={{
              width: "100%",
              padding: "16px 28px",
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
              justifyContent: "center",
              gap: 10,
              opacity: authLoading ? 0.6 : 1,
            }}
          >
            <MessageCircle size={20} />
            Message {listing.vendorName}
          </button>
        </div>
      </div>

      {/* More from this vendor (K2.3 #4) */}
      {moreFromVendor.length > 0 && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h2 style={{
            fontFamily: "var(--role-font-display)",
            fontSize: "24px",
            marginBottom: "var(--space-3)",
            color: "var(--role-text)",
          }}>
            More from {listing.vendorName}
          </h2>
          <div style={{ 
            display: "flex", 
            gap: "var(--space-3)", 
            overflowX: "auto",
            paddingBottom: "var(--space-2)",
          }}>
            {moreFromVendor.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      {/* You might also like (K2.3 #5) */}
      {youMightLike.length > 0 && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h2 style={{
            fontFamily: "var(--role-font-display)",
            fontSize: "24px",
            marginBottom: "var(--space-3)",
            color: "var(--role-text)",
          }}>
            You might also like
          </h2>
          <div style={{ 
            display: "flex", 
            gap: "var(--space-3)", 
            overflowX: "auto",
            paddingBottom: "var(--space-2)",
          }}>
            {youMightLike.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section data-testid="listing-detail-comments" style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <CommentsList comments={comments} />
        <CommentForm listingId={listing.id} />
      </section>

      {/* Lightbox modal */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: 12,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                }}
                style={{
                  position: "absolute",
                  left: 20,
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                }}
                style={{
                  position: "absolute",
                  right: 20,
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={galleryImages[selectedImageIndex]}
            alt={listing.title}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}

/** ListingCard for recommendation rows */
function ListingCard({ listing }: { listing: ExploreListing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      style={{
        flexShrink: 0,
        width: 280,
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--role-surface)",
        textDecoration: "none",
        transition: "box-shadow 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: "100%",
        height: 180,
        background: "var(--role-surface-sunken)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {listing.image ? (
          <img src={listing.image} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <CampusFingerprint activity={[0.5, 0.5, 0.5]} style={{ width: 48, height: 48 }} />
        )}
      </div>
      <div style={{ padding: "var(--space-2)" }}>
        <div style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-ui)",
          marginBottom: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {listing.title}
        </div>
        <div style={{
          fontSize: "13px",
          color: "var(--role-text-muted)",
          fontFamily: "var(--role-font-ui)",
          marginBottom: 8,
        }}>
          {listing.vendorName}
        </div>
        <div style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-mono)",
        }}>
          {formatPrice(listing.priceMinor)}
        </div>
        {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
          <div style={{
            fontSize: "12px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
            marginTop: 4,
          }}>
            ★ {listing.vendorRatingAvg.toFixed(1)} ({listing.vendorRatingCount})
          </div>
        ) : (
          <div style={{
            fontSize: "12px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
            marginTop: 4,
          }}>
            New
          </div>
        )}
      </div>
    </Link>
  );
}
