import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: a CHEAP guard for authed subpaths only (D3).
 * It does NOT do identity/db lookups — that happens server-side via
 * lib/session.getCurrentIdentity(). Here we only check the session cookie is
 * present and bounce to /login?next=... if not. This keeps the edge fast and
 * avoids importing the (Node-only) data layer into the edge runtime.
 *
 * Public paths (including /vendor/[id], PG-PUB-004) are deliberately NOT guarded.
 */
const PROTECTED_PREFIXES = [
  "/onboarding",
  "/shopper",
  "/vendor/dashboard",
  "/messages",
  "/staff",
];

const PUBLIC_EXACT = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  "/consent",
  "/select-campus",
  "/account-state",
]);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Guarded?
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  // Allow exact public routes even if they share a prefix token (defensive).
  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next();

  const hasSession = req.cookies.has("sessionId");
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/shopper/:path*",
    "/vendor/dashboard/:path*",
    "/messages/:path*",
    "/staff/:path*",
  ],
};
