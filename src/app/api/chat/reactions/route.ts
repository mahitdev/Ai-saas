import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { addReaction, listReactions } from "@/lib/server/chat-realtime";

const reactionSchema = z.object({
  messageId: z.string().trim().min(1).max(200),
  emoji: z.string().trim().min(1).max(20),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ reactions: listReactions(user.id) });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reaction payload" }, { status: 400 });
  }

  return NextResponse.json({ reaction: addReaction(user.id, parsed.data.messageId, parsed.data.emoji) });
}
