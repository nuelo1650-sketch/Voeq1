"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MessageCircle, Lock, Trash2, AlertCircle } from "lucide-react";
import type { Vendor } from "@voeq/data";

/**
 * K3b.6 — Vendor reviews management component.
 * List reviews, respond (500 chars max, 24h edit window), 
 * response locked badge after 24h, delete response with confirm.
 */

interface Review {
  id: string;
  shopperName: string;
  rating: number;
  body: string;
  createdAt: Date;
  response?: {
    body: string;
    createdAt: Date;
  };
}

export function VendorReviewsManagement({ vendor, disabled }: { vendor: Vendor; disabled: boolean }) {
  const router = useRouter();
  
  // Mock reviews data - in production would come from API
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      shopperName: "John D.",
      rating: 5,
      body: "Excellent service! Fast delivery and great quality products.",
      createdAt: new Date(Date.now() - 2 * 24 * 3600000), // 2 days ago
    },
    {
      id: "2",
      shopperName: "Sarah M.",
      rating: 4,
      body: "Good experience overall, but delivery was a bit slow.",
      createdAt: new Date(Date.now() - 5 * 24 * 3600000), // 5 days ago
      response: {
        body: "Thank you for your feedback! We're working on improving our delivery times.",
        createdAt: new Date(Date.now() - 4 * 24 * 3600000),
      },
    },
  ]);

  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startResponse = (reviewId: string, existingResponse?: string) => {
    setRespondingTo(reviewId);
    setResponseText(existingResponse ?? "");
  };

  const cancelResponse = () => {
    setRespondingTo(null);
    setResponseText("");
  };

  const saveResponse = async (reviewId: string) => {
    if (disabled || !responseText.trim() || responseText.length > 500) return;

    setSaving(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                response: {
                  body: responseText,
                  createdAt: new Date(),
                },
              }
            : r
        )
      );

      setRespondingTo(null);
      setResponseText("");
      router.refresh();
    } catch {
      // Error handling would go here
    } finally {
      setSaving(false);
    }
  };

  const deleteResponse = async (reviewId: string) => {
    setDeleting(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                response: undefined,
              }
            : r
        )
      );

      setDeleteModal(null);
      router.refresh();
    } catch {
      // Error handling would go here
    } finally {
      setDeleting(false);
    }
  };

  const canEditResponse = (response?: { createdAt: Date }) => {
    if (!response) return true;
    const hoursSinceResponse = (Date.now() - response.createdAt.getTime()) / (1000 * 3600);
    return hoursSinceResponse < 24;
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : "—";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-4)" }}>
          <Link
            href="/vendor/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--color-ink-muted)",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, margin: 0, color: "var(--color-forest)" }}>
                Reviews
              </h1>
              <p style={{ fontSize: 16, color: "var(--color-ink-muted)", margin: 0, marginTop: 8 }}>
                Respond to customer reviews
              </p>
            </div>

            {/* Summary stats */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "var(--space-3)",
                background: "var(--color-cream)",
                border: "1px solid var(--color-ink-subtle)",
                borderRadius: 12,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-forest)" }}>
                  {avgRating}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-ink-muted)" }}>Avg. rating</p>
              </div>
              <div style={{ width: 1, height: 40, background: "var(--color-ink-subtle)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-forest)" }}>
                  {reviews.length}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-ink-muted)" }}>Total reviews</p>
              </div>
            </div>
          </div>
        </header>

        {disabled && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "var(--space-3)",
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 12,
              marginBottom: "var(--space-4)",
            }}
          >
            <AlertCircle size={24} />
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Your account is suspended</p>
              <p style={{ margin: 0, fontSize: 14 }}>You cannot respond to reviews while suspended.</p>
            </div>
          </div>
        )}

        {/* Reviews list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {reviews.length > 0 ? (
            reviews.map((review) => {
              const isResponding = respondingTo === review.id;
              const canEdit = canEditResponse(review.response);

              return (
                <div
                  key={review.id}
                  style={{
                    background: "var(--color-cream)",
                    border: "1px solid var(--color-ink-subtle)",
                    borderRadius: 12,
                    padding: "var(--space-4)",
                  }}
                >
                  {/* Review header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: "var(--color-ink)" }}>
                        {review.shopperName}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--color-ink-muted)", marginTop: 4 }}>
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= review.rating ? "var(--color-amber-dark)" : "none"}
                          stroke={star <= review.rating ? "var(--color-amber-dark)" : "var(--color-ink-subtle)"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review body */}
                  <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink)", lineHeight: 1.6 }}>
                    {review.body}
                  </p>

                  {/* Vendor response */}
                  {review.response && !isResponding && (
                    <div
                      style={{
                        marginTop: "var(--space-3)",
                        padding: "var(--space-3)",
                        background: "var(--color-glass-white)",
                        borderRadius: 8,
                        border: "1px solid var(--color-ink-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <MessageCircle size={16} style={{ color: "var(--color-forest-mid)" }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-forest)" }}>Your response</span>
                          {!canEdit && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                background: "var(--color-ink-subtle)",
                                borderRadius: 4,
                              }}
                            >
                              <Lock size={12} />
                              <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>Locked</span>
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => startResponse(review.id, review.response?.body)}
                              disabled={disabled}
                              style={{ ...linkButtonStyle, color: "var(--color-forest)" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteModal(review.id)}
                              disabled={disabled}
                              style={{ ...linkButtonStyle, color: "var(--color-danger)" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink)", lineHeight: 1.6 }}>
                        {review.response.body}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-ink-muted)", marginTop: 8 }}>
                        {formatDate(review.response.createdAt)}
                        {canEdit && " • You can edit this response for 24 hours"}
                      </p>
                    </div>
                  )}

                  {/* Response form */}
                  {isResponding && (
                    <div style={{ marginTop: "var(--space-3)" }}>
                      <label style={{ fontSize: 14, fontWeight: 600, color: "var(--color-forest)", display: "block", marginBottom: 8 }}>
                        Your response
                      </label>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        disabled={disabled || saving}
                        placeholder="Write a professional response..."
                        maxLength={500}
                        style={{
                          width: "100%",
                          minHeight: 100,
                          padding: 12,
                          fontSize: 14,
                          border: "1px solid var(--color-ink-subtle)",
                          borderRadius: 8,
                          background: "var(--color-glass-white)",
                          color: "var(--color-ink)",
                          fontFamily: "var(--font-body)",
                          resize: "vertical",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: responseText.length > 500 ? "var(--color-danger)" : "var(--color-ink-muted)" }}>
                          {responseText.length}/500 characters
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={cancelResponse} disabled={saving} style={secondaryButtonStyle}>
                            Cancel
                          </button>
                          <button
                            onClick={() => saveResponse(review.id)}
                            disabled={disabled || saving || !responseText.trim() || responseText.length > 500}
                            style={primaryButtonStyle(disabled || saving || !responseText.trim() || responseText.length > 500)}
                          >
                            {saving ? "Saving..." : review.response ? "Update response" : "Post response"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Respond button */}
                  {!review.response && !isResponding && (
                    <button
                      onClick={() => startResponse(review.id)}
                      disabled={disabled}
                      style={{
                        ...secondaryButtonStyle,
                        marginTop: "var(--space-3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MessageCircle size={16} />
                      Respond
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "var(--space-6)",
                textAlign: "center",
                background: "var(--color-cream)",
                border: "1px solid var(--color-ink-subtle)",
                borderRadius: 12,
              }}
            >
              <Star size={48} style={{ color: "var(--color-ink-subtle)", marginBottom: 16 }} />
              <p style={{ margin: 0, fontSize: 16, color: "var(--color-ink)" }}>No reviews yet</p>
              <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink-muted)", marginTop: 8 }}>
                Reviews from customers will appear here
              </p>
            </div>
          )}
        </div>

        {/* Delete confirmation modal */}
        {deleteModal && (
          <Modal onClose={() => setDeleteModal(null)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <AlertCircle size={24} style={{ color: "var(--color-danger)" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0, color: "var(--color-forest)" }}>
                Delete response?
              </h2>
            </div>
            <p style={{ margin: 0, marginBottom: "var(--space-4)", color: "var(--color-ink)", lineHeight: 1.6 }}>
              This will permanently delete your response. The original review will remain visible.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteModal(null)} disabled={deleting} style={secondaryButtonStyle}>
                Cancel
              </button>
              <button
                onClick={() => deleteResponse(deleteModal)}
                disabled={deleting}
                style={{ ...primaryButtonStyle(deleting), background: "var(--color-danger)" }}
              >
                {deleting ? "Deleting..." : "Delete response"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

// Reusable components
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-cream)",
          border: "1px solid var(--color-ink-subtle)",
          borderRadius: 12,
          padding: "var(--space-4)",
          maxWidth: 480,
          width: "90%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Helper functions
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 3600 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// Styles
const primaryButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  background: disabled ? "var(--color-ink-subtle)" : "var(--color-forest)",
  color: "var(--color-cream)",
  border: "none",
  borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: !disabled ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none",
});

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  background: "transparent",
  color: "var(--color-ink-muted)",
  border: "1px solid var(--color-ink-subtle)",
  borderRadius: 6,
  cursor: "pointer",
};

const linkButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
};
