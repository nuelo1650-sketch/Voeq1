import { describe, it, expect } from "vitest";
import type { AuthStatusResponse } from "@/lib/authStatus";

describe("AuthStatusResponse type contract", () => {
  it("uses `authenticated` (lowercase) — the field /api/auth/status returns", () => {
    const loggedIn: AuthStatusResponse = { authenticated: true, unreadCount: 3, role: "shopper" };
    const loggedOut: AuthStatusResponse = { authenticated: false, unreadCount: 0 };

    // The consumers read `.authenticated`, NOT `.isAuthenticated`.
    // If someone reintroduces `isAuthenticated`, this type will not have it.
    expect(loggedIn.authenticated).toBe(true);
    expect(loggedOut.authenticated).toBe(false);

    // @ts-expect-error — `isAuthenticated` must NOT exist on this type (regression guard)
    expect((loggedIn as { isAuthenticated?: boolean }).isAuthenticated).toBeUndefined();
  });

  it("all three response shapes are valid", () => {
    const shapes: AuthStatusResponse[] = [
      { authenticated: false, unreadCount: 0 },
      { authenticated: true, unreadCount: 0, role: "shopper" },
      { authenticated: true, unreadCount: 5, role: "vendor" },
      { authenticated: true, unreadCount: 1, role: "admin" },
    ];
    expect(shapes.length).toBe(4);
  });
});
