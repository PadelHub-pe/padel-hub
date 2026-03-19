import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAuthLimiter } from "~/lib/rate-limit";

// --- Rate Limiting ---

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

async function checkRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/auth")) return null;
  if (request.method !== "POST") return null;

  const limiter = getAuthLimiter();
  if (!limiter) return null;

  const ip = getClientIp(request);
  const result = await limiter.limit(ip);
  if (result.success) return null;

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.reset / 1000)),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

// --- Session Auth ---

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/trpc",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")
  );
}

function checkAuth(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();

  // Allow /no-organization for authenticated users
  if (pathname === "/no-organization") {
    if (!hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protected routes — require session cookie
  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect bare /org/[slug] to /org/[slug]/facilities (avoid server component redirect loop)
  const orgSlugMatch = /^\/org\/([^/]+)$/.exec(pathname);
  if (orgSlugMatch) {
    return NextResponse.redirect(
      new URL(`/org/${orgSlugMatch[1]}/facilities`, request.url),
    );
  }

  return null;
}

// --- Main ---

export async function middleware(request: NextRequest) {
  // Step 1: Rate limiting
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Step 2: Session auth
  const authResponse = checkAuth(request);
  if (authResponse) return authResponse;

  // Pass pathname to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/).*)",
  ],
};
