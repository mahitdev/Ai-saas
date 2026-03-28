import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { user } from "@/db/schema";
import { env } from "@/lib/env";
import { runVoiceAction } from "@/lib/server/voice-actions";

const webhookSchema = z.object({
  userEmail: z.string().email(),
  transcript: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!env.VOICE_WEBHOOK_SECRET || token !== env.VOICE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const [matchedUser] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, parsed.data.userEmail))
    .limit(1);

  if (!matchedUser) {
    return NextResponse.json({ error: "User not found for voice webhook" }, { status: 404 });
  }

  const result = await runVoiceAction({
    userId: matchedUser.id,
    transcript: parsed.data.transcript,
    source: "phone_call",
  });

  return NextResponse.json({ ok: true, ...result });
}
