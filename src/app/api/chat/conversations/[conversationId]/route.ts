import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { conversationId } = await context.params;

  const [deleted] = await db
    .delete(aiConversation)
    .where(and(eq(aiConversation.id, conversationId), eq(aiConversation.userId, user.id)))
    .returning({ id: aiConversation.id });

  if (!deleted) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
