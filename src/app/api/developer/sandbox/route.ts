import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const sandboxSchema = z.object({
  request: z.string().trim().min(1).max(20000),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = sandboxSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sandbox payload" }, { status: 400 });
  }

  const startedAt = Date.now();
  const latencyMs = 120 + Math.floor(Math.random() * 240);

  return NextResponse.json({
    sandbox: true,
    status: "ok",
    latencyMs,
    preview: `Sandbox executed for ${user.email}`,
    echoLength: parsed.data.request.length,
    runtimeMs: Date.now() - startedAt,
  });
}
