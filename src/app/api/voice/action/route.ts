import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { runVoiceAction } from "@/lib/server/voice-actions";

const voiceActionSchema = z.object({
  transcript: z.string().trim().min(1).max(4000),
  source: z.enum(["phone_call", "mobile_widget"]).default("mobile_widget"),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = voiceActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid voice action payload" }, { status: 400 });
  }

  const result = await runVoiceAction({
    userId: user.id,
    transcript: parsed.data.transcript,
    source: parsed.data.source,
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
