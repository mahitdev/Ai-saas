import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const MUTATION_RATE_LIMIT = 45;

const globalRateLimitStore = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalRateLimitStore.__rateLimitStore ?? new Map<string, RateLimitEntry>();
globalRateLimitStore.__rateLimitStore = rateLimitStore;

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-dns-prefetch-control", "off");
  response.headers.set("x-download-options", "noopen");
  response.headers.set("cross-origin-opener-policy", "same-origin");
  response.headers.set("cross-origin-resource-policy", "same-origin");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("x-permitted-cross-domain-policies", "none");
  response.headers.set(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  );
}

function applyApiCacheHeaders(response: NextResponse) {
  response.headers.set("cache-control", "no-store, max-age=0");
}

function isTrustedOrigin(origin: string, request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  const allowedOrigins = new Set(
    [process.env.BETTER_AUTH_URL, process.env.ALLOWED_ORIGINS]
      .flatMap((value) => (value ? value.split(",") : []))
      .map((value) => value.trim())
      .filter(Boolean),
  );
  allowedOrigins.add(requestOrigin);
  return allowedOrigins.has(origin);
}

function getRequestIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

function isMutation(method: string) {
  return method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
}

export function proxy(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth/");

  if (isApiRoute && isMutation(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && !isTrustedOrigin(origin, request)) {
      const forbiddenResponse = NextResponse.json(
        { error: "Blocked by origin policy" },
        { status: 403 },
      );
      applyApiCacheHeaders(forbiddenResponse);
      applySecurityHeaders(forbiddenResponse);
      return forbiddenResponse;
    }

    if (!isAuthApi && request.method !== "DELETE") {
      const contentType = request.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const invalidTypeResponse = NextResponse.json(
          { error: "Unsupported content type" },
          { status: 415 },
        );
        applyApiCacheHeaders(invalidTypeResponse);
        applySecurityHeaders(invalidTypeResponse);
        return invalidTypeResponse;
      }
    }

    const key = `${getRequestIdentifier(request)}:${request.nextUrl.pathname}`;
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
    } else if (current.count >= MUTATION_RATE_LIMIT) {
      const limitedResponse = new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please wait a minute and try again.",
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
          },
        },
      );
      applyApiCacheHeaders(limitedResponse);
      applySecurityHeaders(limitedResponse);
      return limitedResponse;
    } else {
      current.count += 1;
      rateLimitStore.set(key, current);
    }
  }

  const response = NextResponse.next();
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }
  if (isApiRoute) {
    applyApiCacheHeaders(response);
  }
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
