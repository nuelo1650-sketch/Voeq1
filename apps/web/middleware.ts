import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS allowlist for /api/* (D.7/D.8). Defense-in-depth: the primary
 * cross-origin path is the Vercel→Render rewrite (browser sees same-origin),
 * but direct browser→Render calls (SSE, future native apps) are permitted from
 * approved origins only.
 */
function corsHeaders(origin: string | null): HeadersInit {
  const allowlist = (process.env.CORS_ALLOWLIST ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowed = origin && allowlist.includes(origin) ? origin : allowlist[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

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
  "/home",
  "/vendor/dashboard",
  "/messages",
  "/staff",
  "/admin",
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
  // CORS preflight + header injection for API routes.
  if (req.nextUrl.pathname.startsWith("/api")) {
    const headers = corsHeaders(req.headers.get("origin"));
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers });
    }
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v as string);
    return res;
  }

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
    "/api/:path*",
    "/onboarding/:path*",
    "/shopper/:path*",
    "/home/:path*",
    "/vendor/dashboard/:path*",
    "/messages/:path*",
    "/staff/:path*",
  ],
};
