import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { setTyping } from "@/lib/server/chat-realtime";

const typingSchema = z.object({
  conversationId: z.string().trim().min(1).optional().nullable(),
  typing: z.boolean(),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = typingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid typing payload" }, { status: 400 });
  }

  const updated = setTyping(user.id, parsed.data.conversationId ?? null, parsed.data.typing);
  return NextResponse.json({ typing: updated });
}
