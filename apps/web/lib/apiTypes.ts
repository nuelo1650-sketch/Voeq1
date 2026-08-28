/** Shared typed response interfaces for client-side fetches. */

/** GET /api/auth/status */
export interface AuthStatusResponse {
  authenticated: boolean;
  unreadCount: number;
  role?: "shopper" | "vendor" | "admin";
}

/** GET /api/home */
export interface HomeResponse {
  reviewCount: number;
  unreadNotifications: number;
}

/** GET /api/listings/[id]/comments */
export interface CommentsResponse {
  comments: Array<{
    id: string;
    listingId: string;
    authorId: string;
    body: string;
    createdAt: string;
    status: "published" | "hidden" | "flagged";
    authorName?: string;
  }>;
}

/** POST /api/listings/[id]/comments & POST /api/conversations */
export interface CreateResponse {
  ok: boolean;
  comment?: { id: string; body: string; createdAt: string };
  conversation?: { id: string };
  error?: string;
  message?: string;
}

/** POST /api/reviews */
export interface ReviewResponse {
  ok: boolean;
  review?: { id: string; rating: number; body: string; createdAt: string };
  error?: string;
  message?: string;
}
