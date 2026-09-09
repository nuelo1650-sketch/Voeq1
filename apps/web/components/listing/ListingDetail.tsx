"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ExploreListing } from "@voeq/data";
// A2 (2026-09-06): client-safe category-name helper (pure data — no repo imports).
import { categoryNameFromSlug } from "@voeq/data/explore-view";
import { ContourEdge, CampusFingerprint } from "@voeq/contour";
import { SaveButton } from "@/components/shopper/SaveButton";
import { LikeButton } from "@/components/shopper/LikeButton";
import { CommentForm } from "@/components/shopper/CommentForm";
import { cdnTransform } from "@/lib/image-upload";
import type { AuthStatusResponse, CommentsResponse, CreateResponse } from "@/lib/apiTypes";
import { CommentsList, type DisplayComment } from "@/components/shopper/CommentsList";
import { ContextBack } from "@/components/shopper/ContextBack";
import { ReportForm } from "@/components/shopper/ReportForm";
import { usePendingIntent } from "@/lib/usePendingIntent";
import { trackEvent } from "@/lib/track";
import { Heart, Share2, Flag, X, ChevronLeft, ChevronRight, MessageCircle, Link2, Store } from "lucide-react";
import { StickyCtaBar } from "@/components/listing/StickyCtaBar";

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

export function ListingDetail({ id, initialListing }: { id: string; initialListing?: ExploreListing | null }) {
  const [status, setStatus] = useState<DetailStatus>(initialListing ? "success" : "loading");
  const [listing, setListing] = useState<ExploreListing | null>(initialListing ?? null);
  const [moreFromVendor, setMoreFromVendor] = useState<ExploreListing[]>([]);
  const [youMightLike, setYouMightLike] = useState<ExploreListing[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // LIGHTBOX v2 (2026-09-06): lock the page behind the lightbox (the page used
  // to keep scrolling under the modal) + Esc closes it.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  // Share
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [showShareButtons, setShowShareButtons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile on mount
  // P-A round 60: record the listing view (admin visibility; privacy-safe).
  useEffect(() => {
    if (id) trackEvent("listing_view", { refId: id, path: `/listing/${id}` });
  }, [id]);

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
    // P-A fix (2026-08-31): when the server already passed the listing
    // (initialListing), don't flash "loading" — the page renders immediately.
    if (!initialListing) setStatus("loading");

    // Load main listing — P-A fix (2026-08-31): fetch the SERVER API route.
    // Previously client-side loadListing(id) bundled USE_REAL=false into the
    // browser -> mock repo -> null -> "Listing not found" for real Neon rows.
    (async () => {
      try {
        // P-A fix (2026-08-31): the SERVER component already loaded the listing
        // (initialListing) — used directly, no client refetch of /api/listings/[id]
        // (which on production hits a Vercel->Render proxy loop -> 508).
        // Fallback: if the server pass was null/missing (e.g. direct client nav),
        // refetch through the API; a 404 or error maps to notfound/error.
        let mainListing: ExploreListing | null = initialListing ?? null;
        if (!mainListing) {
          const res = await fetch(`/api/listings/${id}`);
          if (res.status === 404) {
            if (!cancelled) setStatus("notfound");
            return;
          }
          if (!res.ok) {
            if (!cancelled) setStatus("error");
            return;
          }
          const d = (await res.json()) as { listing?: ExploreListing };
          mainListing = d.listing ?? null;
        }
        if (cancelled) return;
        if (!mainListing) {
          setStatus("notfound");
          return;
        }
        setListing(mainListing);
        setStatus("success");

        // Load "More from this vendor" (same vendorId, exclude current)
        try {
          const ex = (await (await fetch(`/api/explore`)).json()) as { data: ExploreListing[] };
          if (cancelled) return;
          const fromVendor = ex.data
            .filter((l) => l.vendorId === mainListing.vendorId && l.id !== id)
            .slice(0, 4);
          setMoreFromVendor(fromVendor);

          // Load "You might also like" (same category, different vendors)
          if (mainListing.categorySlug) {
            const ex2 = (await (
              await fetch(`/api/explore?${new URLSearchParams({ category: mainListing.categorySlug })}`)
            ).json()) as { data: ExploreListing[] };
            if (!cancelled) {
              const related = ex2.data
                .filter((l) => l.vendorId !== mainListing.vendorId && l.id !== id)
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
    // P-A round 60: message-click event (admin analytics; no content).
    if (listing?.id) trackEvent("message_click", { refId: listing.id, path: `/listing/${listing.id}` });
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

  // Prepare gallery images — MATRIX FIX (2026-09-06): filter falsy URLs (a
  // demo listing carries an empty string in images[] → <img src=""> broke the
  // prod verify-matrix; same guard as ListingCard).
  const galleryImages = (Array.isArray(listing.images) && listing.images.length > 0 
    ? listing.images 
    : listing.image 
    ? [listing.image] 
    : []).filter((u): u is string => typeof u === "string" && u.trim() !== "");

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
        {/* L3 (2026-09-06): was a hardcoded /explore link — the other half of
            the explore<->storefront cycle. Goes BACK the way the visitor
            came; /explore only as the direct-entry fallback. */}
        <ContextBack
          fallback="/explore"
          label="← Back"
          testid="listing-detail-back"
          style={{ color: "var(--role-text-muted)", textDecoration: "none", fontFamily: "var(--role-font-ui)", fontSize: "14px" }}
        />
      </div>

      <div
        className="listing-detail-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start" }}
      >
        {/* Gallery: main image + thumbnail strip (K2.3 #1) */}
        <div data-testid="listing-detail-gallery" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div
            data-testid="listing-detail-image-frame"
            style={{
              position: "relative",
              aspectRatio: "4 / 3",
              background: "var(--role-surface-sunken)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              cursor: galleryImages.length > 0 ? "zoom-in" : "default",
            }}
          >
            {galleryImages.length > 0 ? (
              /* BUG-3 FIX (2026-09-05): the detail page showed ONE image plus a
                 thumbnail strip — no swipe on phones, unlike the Explore card
                 (r81-F). Same scroll-snap track + dots pattern everywhere:
                 swipe through full-size images, tap the frame to zoom. */
              <>
                <div
                  data-testid="listing-detail-track"
                  className="voeq-card-track"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollLeft / Math.max(1, el.scrollWidth / galleryImages.length));
                    if (idx !== selectedImageIndex) setSelectedImageIndex(Math.min(galleryImages.length - 1, Math.max(0, idx)));
                  }}
                  style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", width: "100%", height: "100%", scrollbarWidth: "none" }}
                >
                  {galleryImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={cdnTransform(img, 900)}
                      alt={`${listing.title} — image ${idx + 1}`}
                      data-testid="listing-detail-image"
                      onClick={() => setLightboxOpen(true)}
                      style={{ minWidth: "100%", width: "100%", height: "100%", objectFit: "cover", display: "block", scrollSnapAlign: "start", cursor: "zoom-in" }}
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ))}
                </div>
                {galleryImages.length > 1 && (
                  <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, pointerEvents: "none" }}>
                    {galleryImages.map((_, idx) => (
                      <span
                        key={idx}
                        data-testid="listing-detail-dot"
                        style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: idx === selectedImageIndex ? "var(--color-cream)" : "rgba(246,241,230,.45)",
                          boxShadow: "0 0 2px rgba(15,42,29,.5)",
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* MONEY BAG D1 (B8): ▹ 1/N counter synced to the swipe track. */}
                {galleryImages.length > 1 && (
                  <span
                    data-testid="listing-detail-imgcount"
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(15,42,29,0.72)",
                      color: "#f6f1e6",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "3px 9px",
                      pointerEvents: "none",
                    }}
                  >
                    ▹ {selectedImageIndex + 1}/{galleryImages.length}
                  </span>
                )}
                {/* MONEY BAG D1 (A15): gold ✦ Voeq Live seal on featured listings. */}
                {listing.featured && (
                  <span
                    data-testid="listing-detail-live-seal"
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "var(--color-forest, #0F2A1D)",
                      color: "var(--color-amber, #E8A33D)",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      borderRadius: 999,
                      padding: "5px 11px",
                      boxShadow: "0 4px 14px rgba(15,42,29,0.35)",
                      pointerEvents: "none",
                    }}
                  >
                    ✦ Voeq Live
                  </span>
                )}
              </>
            ) : (
              <CampusFingerprint
                data-testid="listing-detail-monogram"
                activity={[0.6, 0.3, 0.8]}
                style={{ width: 72, height: 72 }}
              />
            )}
          </div>

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
          {/* A2 "SOFT EDITORIAL" DETAIL (2026-09-06, founder-picked from
              detail-a-refined mock): eyebrow → serif title → quiet vendor
              byline → huge serif price. Calm rounded cards below; the Message
              CTA floats alone (nothing competes with it); text-only micro
              actions; facts in a 2x2 grid. Carries the C1 card's DNA. */}
          <div>
            <div data-testid="listing-detail-catline" style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "#9a6d1f", fontFamily: "var(--role-font-ui)" }}>
                {listing.categorySlug ? categoryNameFromSlug(listing.categorySlug) : "Listing"}
              </span>
              <span aria-hidden style={{ flex: 1, maxWidth: 60, height: 1, background: "var(--role-border)" }} />
              {listing.featured && (
                <span data-testid="listing-detail-featured" style={{ fontSize: 10, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: "#9a6d1f", fontFamily: "var(--role-font-ui)" }}>
                  Featured
                </span>
              )}
            </div>
            <h1
              data-testid="listing-detail-title"
              style={{
                fontFamily: "var(--font-display, var(--role-font-display))",
                fontSize: "clamp(1.35rem, 5.2vw, 1.75rem)",
                lineHeight: 1.14,
                margin: 0,
                marginBottom: 4,
                color: "var(--color-forest, var(--role-text))",
                fontWeight: 600,
              }}
            >
              {listing.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)", marginBottom: 12 }}>
              by
              <Link href={`/vendor/${listing.vendorId}`} style={{ color: "var(--color-forest-mid, #2d5a3d)", fontWeight: 650, textDecoration: "none" }}>
                {listing.vendorName}
              </Link>
              {listing.verified && <span data-testid="listing-detail-vbadge" aria-label="Verified vendor" style={{ width: 15, height: 15, borderRadius: 999, background: "var(--color-forest)", color: "var(--color-cream)", fontSize: 9.5, display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>✓</span>}
              <span aria-hidden>·</span>
              <span>{listing.categorySlug ? categoryNameFromSlug(listing.categorySlug) : "Listing"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <span
                data-testid="listing-detail-price"
                style={{
                  fontFamily: "var(--font-display, var(--role-font-display))",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "clamp(1.5rem, 6.4vw, 1.9rem)",
                  fontWeight: 700,
                  color: "var(--color-forest, var(--role-text))",
                  lineHeight: 1,
                }}
              >
                {formatPrice(listing.priceMinor)}
                {typeof listing.priceMaxMinor === "number" && listing.priceMaxMinor > listing.priceMinor ? (
                  <small style={{ fontFamily: "var(--role-font-ui)", fontSize: 12, fontWeight: 500, color: "var(--role-text-muted)" }}> – {formatPrice(listing.priceMaxMinor)}</small>
                ) : null}
              </span>
              {/* MONEY BAG D1 (B9): the free-market rule in UX — the price is
                  the opening bid of a conversation, never a fixed tag. */}
              <span
                data-testid="listing-detail-price-note"
                style={{
                  flexBasis: "100%",
                  fontSize: 12,
                  color: "var(--role-text-muted)",
                  fontFamily: "var(--role-font-ui)",
                }}
              >
                Price agreed in chat — you set it with the vendor.
              </span>
              {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
                <span data-testid="listing-detail-rating" style={{ fontSize: 12.5, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
                  <span style={{ color: "var(--color-amber)" }}>★</span> {listing.vendorRatingAvg.toFixed(1)} ({listing.vendorRatingCount})
                </span>
              ) : (
                <span data-testid="listing-detail-rating-empty" style={{ fontSize: 10, fontWeight: 650, color: "#9a6d1f", background: "rgba(232,163,61,.14)", padding: "3px 10px", borderRadius: 999, fontFamily: "var(--role-font-ui)" }}>New</span>
              )}
              {listing.availability && (
                <span
                  data-testid="listing-detail-availability"
                  style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", border: "1px solid var(--role-border)", borderRadius: 999, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}
                >
                  {AVAIL_LABEL[listing.availability]}
                </span>
              )}
            </div>
          </div>

          {/* A2: the vendor card is retired — the byline in the head carries
              the vendor (name + verified + campus, linked to the storefront).
              One calm surface instead of a box inside a box. */}

          {/* Message CTA — floats ALONE (A2): nothing competes with it. */}
          <button 
            data-testid="listing-detail-message-cta" 
            onClick={handleMessageVendor}
            disabled={authLoading}
            style={{
              width: "100%",
              padding: "15px 28px",
              fontSize: "15px",
              fontWeight: 650,
              fontFamily: "var(--role-font-ui)",
              background: "var(--color-forest)",
              color: "var(--color-cream)",
              border: "none",
              borderRadius: 999,
              cursor: authLoading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              opacity: authLoading ? 0.6 : 1,
              boxShadow: "0 6px 18px rgba(15,42,29,.22)",
            }}
          >
            <MessageCircle size={19} />
            Message {listing.vendorName}
          </button>

          {/* STOREFRONT VISIBILITY (2026-09-07, founder: "'go to storefront'
              is not very visible in listings"): the byline link was too quiet.
              A real outlined button under the Message CTA gives the vendor's
              storefront equal billing — browse the shop, not just one item. */}
          <Link
            href={`/vendor/${listing.vendorId}`}
            data-testid="listing-detail-storefront-cta"
            style={{
              width: "100%",
              padding: "13px 28px",
              fontSize: "14px",
              fontWeight: 650,
              fontFamily: "var(--role-font-ui)",
              background: "transparent",
              color: "var(--color-forest, #0F2A1D)",
              border: "1.5px solid rgba(15,42,29,.25)",
              borderRadius: 999,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <Store size={17} />
            Go to {listing.vendorName}'s storefront
          </Link>

          {/* A2: micro-actions — the existing Share/Save/Like/Report row (kept
              in the gallery column below) IS the quiet action row; the
              buttons get their text-less pill treatment via
              .listing-detail-actions styles in globals.css. Nothing else
              needed here. */}

          {/* A2: About this listing — calm rounded card. */}
          {listing.description && (
            <div data-testid="listing-detail-about" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 15, padding: "13px 15px" }}>
              <h5 style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#9a6d1f", margin: "0 0 7px", fontFamily: "var(--role-font-ui)" }}>
                About this listing
              </h5>
              <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "var(--role-text)", fontFamily: "var(--role-font-ui)", margin: 0 }}>
                {listing.description}
              </p>
            </div>
          )}

          {/* A2: facts — neat 2x2 grid (campus / hours / pickup / vendor). */}
          <div data-testid="listing-detail-facts" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 12, padding: "9px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "#9a6d1f", fontFamily: "var(--role-font-ui)", marginBottom: 2 }}>CATEGORY</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-forest)", fontFamily: "var(--role-font-ui)" }}>{listing.categorySlug ? categoryNameFromSlug(listing.categorySlug) : "—"}</div>
            </div>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 12, padding: "9px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "#9a6d1f", fontFamily: "var(--role-font-ui)", marginBottom: 2 }}>VENDOR</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-forest)", fontFamily: "var(--role-font-ui)", display: "flex", alignItems: "center", gap: 5 }}>
                {listing.vendorName}
                {listing.verified && <span aria-label="Verified" style={{ width: 13, height: 13, borderRadius: 999, background: "var(--color-forest)", color: "var(--color-cream)", fontSize: 8.5, display: "grid", placeItems: "center", fontWeight: 700 }}>✓</span>}
              </div>
            </div>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 12, padding: "9px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "#9a6d1f", fontFamily: "var(--role-font-ui)", marginBottom: 2 }}>HOURS</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-forest)", fontFamily: "var(--role-font-ui)" }}>
                {listing.vendorHours ? `${listing.vendorHours.open}–${listing.vendorHours.close}` : "Ask vendor"}
              </div>
            </div>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 12, padding: "9px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "#9a6d1f", fontFamily: "var(--role-font-ui)", marginBottom: 2 }}>CONTACT</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-forest)", fontFamily: "var(--role-font-ui)" }}>
                {listing.availability ? AVAIL_LABEL[listing.availability] : "In-app messages"}
              </div>
            </div>
          </div>
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
        <CommentsList comments={comments} listingId={listing.id} />
        <CommentForm listingId={listing.id} />
      </section>

      {/* MONEY BAG D1 (A15): sticky mobile CTA bar — Message + save + share
          float at the bottom on phones only. Desktop keeps the inline CTA.
          Hidden once the main Message CTA scrolls into view (no duplication
          on screen); B2: disabled under prefers-reduced-motion is NOT needed
          (it's position, not motion). */}
      <StickyCtaBar
        onMessage={handleMessageVendor}
        authLoading={authLoading}
        saveSlot={<SaveButton targetType="listing" targetId={listing.id} className="listing-detail-save-sticky" />}
        shareSlot={
          <button
            data-testid="listing-detail-sticky-share"
            onClick={() => {
              const el = document.querySelector('[data-testid="listing-detail-share"]') as HTMLButtonElement | null;
              el?.click();
              el?.scrollIntoView({ block: "center" });
            }}
            aria-label="Share"
            style={{
              width: 44, height: 44, borderRadius: 999, border: "1px solid var(--role-border)",
              background: "var(--role-surface)", color: "var(--role-text)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Share2 size={18} />
          </button>
        }
        mainCtaSelector='[data-testid="listing-detail-message-cta"]'
      />

      {/* LIGHTBOX v2 (2026-09-06, founder bug report): the old modal centered
          the image with flex + maxWidth/maxHeight 90% — a tall photo overflowed
          BOTH ends of the fixed container and was unscrollable (the flexbox
          centering clip trap), and the nav buttons overlapped the image on
          phones. Now: the image renders at full container width at its natural
          aspect inside an overflow-y:auto sheet — tall photos SCROLL to see
          the whole thing — with the buttons floating clear of the content. */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div
          data-testid="listing-lightbox"
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 20, 16, 0.97)",
            zIndex: 9999,
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sticky header row: counter + close — stays reachable while the
              image scrolls beneath it. */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "linear-gradient(180deg, rgba(15,20,16,.85), transparent)",
            }}
          >
            <span style={{ color: "rgba(246,241,230,.75)", fontSize: 12.5, fontFamily: "var(--role-font-ui)" }}>
              {galleryImages.length > 1 ? `Photo ${selectedImageIndex + 1} of ${galleryImages.length}` : "Photo"}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              aria-label="Close"
              style={{
                background: "rgba(246,241,230,.12)",
                border: "none",
                color: "var(--color-cream)",
                cursor: "pointer",
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* The image: full-width at natural aspect; the sheet scrolls when
              the photo is taller than the screen. Bottom padding reserves the
              footer's height so the photo's tail scrolls CLEAR of the sticky
              prev/next row (the first v2 cut let the footer cover the last
              ~250px of a tall photo). */}
          <div style={{ margin: "0 auto", width: "100%", maxWidth: 900, padding: "0 8px 170px" }}>
            {/* SPEED (2026-09-06, founder: lightbox 'a bit slow'): the track
                loads w_900 and the lightbox capped at 900px wide — requesting
                w_1200 here was a DIFFERENT URL = a fresh multi-MB download on
                every open. Same URL as the track = opens from cache. */}
            <img
              src={cdnTransform(galleryImages[selectedImageIndex], 900)}
              alt={`${listing.title} — photo ${selectedImageIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                borderRadius: 10,
                touchAction: "pan-y",
              }}
            />
          </div>

          {/* Footer row: prev/next ride BELOW the image (never overlapping
              the photo) + a swipe hint when there are multiple photos. */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "12px 14px 18px",
              background: "linear-gradient(0deg, rgba(15,20,16,.85), transparent)",
            }}
          >
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  }}
                  aria-label="Previous photo"
                  style={{
                    background: "rgba(246,241,230,.12)",
                    border: "none",
                    color: "var(--color-cream)",
                    cursor: "pointer",
                    padding: "10px 18px",
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--role-font-ui)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ color: "rgba(246,241,230,.55)", fontSize: 12, fontFamily: "var(--role-font-ui)" }}>
                  or swipe the listing photos
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  }}
                  aria-label="Next photo"
                  style={{
                    background: "rgba(246,241,230,.12)",
                    border: "none",
                    color: "var(--color-cream)",
                    cursor: "pointer",
                    padding: "10px 18px",
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--role-font-ui)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
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
