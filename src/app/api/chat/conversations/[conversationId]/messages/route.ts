import { and, desc, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { getReceipt, listReactions, listThreadReplies } from "@/lib/server/chat-realtime";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { conversationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
    const cursorDate = cursor ? new Date(cursor) : null;

    const [conversation] = await db

      .select({ id: aiConversation.id })

      .from(aiConversation)
      
      .where(and(eq(aiConversation.id, conversationId), eq(aiConversation.userId, user.id)))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(aiMessage)
      .where(
        cursorDate && !Number.isNaN(cursorDate.getTime())
          ? and(
              eq(aiMessage.conversationId, conversationId),
              eq(aiMessage.userId, user.id),
              lt(aiMessage.createdAt, cursorDate),
            )
          : and(eq(aiMessage.conversationId, conversationId), eq(aiMessage.userId, user.id)),
      )
      .orderBy(desc(aiMessage.createdAt))
      .limit(limit + 1);

    const [reactions, threadReplies] = await Promise.all([
      listReactions(user.id),
      listThreadReplies(user.id),
    ]);

    const visibleMessages = messages.slice(0, limit).reverse();

    return NextResponse.json({
      messages: await Promise.all(visibleMessages.map(async (message) => ({
        ...message,
        receipt: await getReceipt(message.id),
        reactions: reactions.filter((reaction) => reaction.messageId === message.id),
        threadReplies: threadReplies.filter((reply) => reply.messageId === message.id),
      }))),
      nextCursor:
        messages.length > limit
          ? visibleMessages[0]?.createdAt?.toISOString()
          : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: `Unable to load messages: ${message}` }, { status: 500 });
  }
}
