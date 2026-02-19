import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";
import { getGateCookieName, verifyGateToken } from "~/lib/gate";
import {
  getAuthLimiter,
  getGateLimiter,
  getTrpcLimiter,
} from "~/lib/rate-limit";

// --- Gate ---

const GATE_BYPASS_ROUTES = ["/gate", "/api/gate"];

function isGateBypassRoute(pathname: string): boolean {
  return GATE_BYPASS_ROUTES.some((route) => pathname.startsWith(route));
}

async function checkGate(request: NextRequest): Promise<NextResponse | null> {
  const sitePassword = env.ADMIN_SITE_PASSWORD;
  if (!sitePassword) return null; // Gate disabled

  const { pathname } = request.nextUrl;
  if (isGateBypassRoute(pathname)) return null;

  const token = request.cookies.get(getGateCookieName())?.value;
  if (token && (await verifyGateToken(token, sitePassword))) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/gate";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

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
  const method = request.method;
  const ip = getClientIp(request);

  let limiter = null;

  if (pathname.startsWith("/api/auth")) {
    limiter = getAuthLimiter();
  } else if (pathname.startsWith("/api/trpc") && method === "POST") {
    limiter = getTrpcLimiter();
  } else if (pathname.startsWith("/api/gate") && method === "POST") {
    limiter = getGateLimiter();
  }

  if (!limiter) return null;

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

// --- Session Auth (existing logic) ---

const AUTH_PUBLIC_ROUTES = ["/login", "/api/auth", "/api/trpc"];

function isAuthPublicRoute(pathname: string): boolean {
  return AUTH_PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")
  );
}

function checkAuth(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Gate routes are handled separately
  if (isGateBypassRoute(pathname)) return null;

  if (isAuthPublicRoute(pathname)) return NextResponse.next();

  if (pathname === "/") {
    if (!hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/access-requests", request.url));
  }

  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return null;
}

// --- Main ---

export async function middleware(request: NextRequest) {
  // Step 1: Gate check
  const gateResponse = await checkGate(request);
  if (gateResponse) return gateResponse;

  // Step 2: Rate limiting
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Step 3: Session auth
  const authResponse = checkAuth(request);
  if (authResponse) return authResponse;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
