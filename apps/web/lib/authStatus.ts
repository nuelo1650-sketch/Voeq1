/** Shared type for GET /api/auth/status response. */
export interface AuthStatusResponse {
  authenticated: boolean;
  unreadCount: number;
  role?: "shopper" | "vendor" | "admin";
}
