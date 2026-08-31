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
        <p data-testid="comments-empty" className="voeq-comment-msg">
          No comments yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {comments.map((c) => (
            <li key={c.id} data-testid="comment-item" className="voeq-comment">
              <div className="voeq-comment-avatar" aria-hidden>
                {(c.authorName ?? "S").slice(0, 1).toUpperCase()}
              </div>
              <div className="voeq-comment-body">
                <div className="voeq-comment-head">
                  <span className="voeq-comment-author">{c.authorName ?? "Shopper"}</span>
                  <span className="voeq-comment-time">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="voeq-comment-text">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
