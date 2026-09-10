import type { Review } from "@voeq/data";

/**
 * ReviewsList — public-read list of a vendor's reviews (VS4.4).
 * Honest empty state: never show a fake 0.0 / "0 reviews".
 * Rating avg + count are derived from the reviews array (passed by the route/view).
 *
 * RATINGS LAYOUT (2026-09-05, founder-approved direction, finally built):
 * out-of-five stars in the header, 5→1 distribution bars behind the average,
 * per-review star rows + author chips, warm cards (cream surface, soft radius)
 * matching the one-shared-design-language directive.
 */
// MONEY BAG A19 (founder-locked): aggregate score + distribution bars unlock
// at 50 real reviews — below that, individual texts carry the honesty.
const UNLOCK_AT = 50;

export function ReviewsList({
  reviews,
  ratingAvg,
  ratingCount,
}: {
  reviews: Review[];
  ratingAvg: number | null;
  ratingCount: number;
}) {
  // Distribution: count of 1..5 star reviews (derived, never fabricated).
  const dist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <div data-testid="reviews-list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: "1.4rem" }}>Reviews</h3>
        {/* MONEY BAG A19 (founder-locked twice): the aggregate score + distribution
            bars are HIDDEN until 50 real reviews exist — "scores unlock after 50
            reviews (keeps ratings honest)". Individual texts + star glyphs stay. */}
        {ratingAvg != null && ratingCount > 0 && ratingCount < UNLOCK_AT && (
          <span data-testid="reviews-unlock-note" style={{ color: "var(--role-text-muted)", fontSize: 12.5 }}>
            {ratingCount} {ratingCount === 1 ? "review" : "reviews"} · scores unlock at {UNLOCK_AT} reviews
          </span>
        )}
        {ratingAvg != null && ratingCount >= UNLOCK_AT && (
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
        <>
          {/* A19: distribution bars — ONLY render at score-unlock (>=50 reviews).
              Below that, individual review texts carry the honesty. */}
          {ratingCount >= UNLOCK_AT && (
          <div data-testid="reviews-distribution" style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
            {dist.map(({ stars, count }) => {
              const pct = ratingCount > 0 ? Math.round((count / ratingCount) * 100) : 0;
              return (
                <div key={stars} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--role-font-ui)", fontSize: 12.5 }}>
                  <span style={{ width: 28, color: "var(--role-text-muted)", textAlign: "right" }}>{stars}★</span>
                  <div aria-hidden style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--role-surface-sunken)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "var(--color-amber)", minWidth: pct > 0 ? 2 : 0 }} />
                  </div>
                  <span style={{ width: 26, color: "var(--role-text-muted)" }}>{count}</span>
                </div>
              );
            })}
          </div>
          )}

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((r) => (
              <li
                key={r.id}
                data-testid="review-item"
                className="voeq-review"
                style={{
                  background: "var(--role-surface)",
                  border: "1px solid var(--role-border)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  className="voeq-review-head"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}
                >
                  {/* Out-of-five stars (approved direction: show the scale,
                      not just the filled count) */}
                  <span
                    className="voeq-review-stars"
                    aria-label={`${r.rating} out of 5 stars`}
                    style={{ letterSpacing: 1, fontSize: 13 }}
                  >
                    <span style={{ color: "var(--color-amber)" }}>{"★".repeat(r.rating)}</span>
                    <span style={{ color: "var(--role-border)" }}>{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-ink-muted, #6f6a5e)" }}>
                    {new Date(r.createdAt ?? Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p className="voeq-review-text" style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--role-text)", overflowWrap: "anywhere" }}>
                  {r.body}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
