import { auth } from "@/lib/auth";
import { checkRateLimit, verifyTurnstile } from "@/lib/server/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

const handlers = toNextJsHandler(auth);
const PROTECTED_PATHS = [
  "/api/auth/sign-in/email",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
  "/api/auth/send-verification-email",
];

function getIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function guardAuthPost(request: Request) {
  const path = new URL(request.url).pathname;
  if (!PROTECTED_PATHS.some((protectedPath) => path.startsWith(protectedPath))) {
    return null;
  }

  const ip = getIp(request);
  const limit = await checkRateLimit({
    key: `${path}:${ip}`,
    limit: path.includes("forget-password") ? 5 : 20,
    windowSeconds: 60,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.resetSeconds),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  }

  const turnstileOk = await verifyTurnstile(request.headers.get("x-turnstile-token"), ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: "Bot protection challenge failed." }, { status: 403 });
  }

  return null;
}

export const GET = handlers.GET;

export async function POST(request: Request) {
  const blocked = await guardAuthPost(request);
  if (blocked) return blocked;
  return handlers.POST(request);
}
