import type { Review } from "@voeq/data";

/**
 * ReviewsList — public-read list of a vendor's reviews (VS4.4).
 * Honest empty state: never show a fake 0.0 / "0 reviews".
 * Rating avg + count are derived from the reviews array (passed by the route/view).
 */
export function ReviewsList({
  reviews,
  ratingAvg,
  ratingCount,
}: {
  reviews: Review[];
  ratingAvg: number | null;
  ratingCount: number;
}) {
  return (
    <div data-testid="reviews-list">
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: "1.4rem" }}>Reviews</h3>
        {ratingAvg != null && ratingCount > 0 && (
          <span data-testid="reviews-rating" style={{ color: "var(--color-amber)", fontSize: 15 }}>
            ★ {ratingAvg.toFixed(1)} <span style={{ color: "var(--role-text-muted)" }}>({ratingCount})</span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p data-testid="reviews-empty" style={{ color: "var(--role-text-muted)", fontSize: 14 }}>
          No reviews yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => (
            <li key={r.id} data-testid="review-item" className="voeq-review">
              <div className="voeq-review-head">
                <span className="voeq-review-stars" aria-label={`${r.rating} stars`}>
                  {"★".repeat(r.rating)}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-ink-muted, #6f6a5e)" }}>
                  {new Date(r.createdAt ?? Date.now()).toLocaleDateString()}
                </span>
              </div>
              <p className="voeq-review-text">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
