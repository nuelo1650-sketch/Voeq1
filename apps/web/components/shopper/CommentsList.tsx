import type { Comment } from "@voeq/data";

/** Enriched comment as returned by GET /api/listings/[id]/comments (authorName resolved). */
export type DisplayComment = Omit<Comment, "listingId" | "authorId" | "status"> & { authorName?: string };

/**
 * CommentsList — public-read, flat (no threading), newest first (VS4.5).
 * Honest empty state. Author display name resolved server-side (no raw identityId).
 */
export function CommentsList({ comments }: { comments: DisplayComment[] }) {
  return (
    <div data-testid="comments-list">
      <h3 style={{ fontFamily: "var(--role-font-display)", fontSize: "1.3rem", margin: "0 0 var(--space-2)" }}>
        Comments {comments.length > 0 && <span style={{ color: "var(--role-text-muted)", fontSize: 14 }}>({comments.length})</span>}
      </h3>
      {comments.length === 0 ? (
        <p data-testid="comments-empty" style={{ color: "var(--role-text-muted)", fontSize: 14 }}>
          No comments yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {comments.map((c) => (
            <li key={c.id} data-testid="comment-item" style={{ borderBottom: "1px solid var(--role-border)", paddingBottom: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--role-text-muted)" }}>
                <span style={{ fontWeight: 600, color: "var(--role-text)" }}>{c.authorName ?? "Shopper"}</span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--role-text)" }}>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
