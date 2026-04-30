import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { addThreadReply, listThreadReplies } from "@/lib/server/chat-realtime";

const threadSchema = z.object({
  messageId: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(4000),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ replies: await listThreadReplies(user.id) });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = threadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid thread payload" }, { status: 400 });
  }

  return NextResponse.json({ reply: await addThreadReply(user.id, parsed.data.messageId, parsed.data.content) });
}
