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
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && isMutation(request.method)) {
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
      applySecurityHeaders(limitedResponse);
      return limitedResponse;
    } else {
      current.count += 1;
      rateLimitStore.set(key, current);
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
