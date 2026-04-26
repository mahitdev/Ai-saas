import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { getReceipt } from "@/lib/server/chat-realtime";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { conversationId } = await context.params;

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
      .where(and(eq(aiMessage.conversationId, conversationId), eq(aiMessage.userId, user.id)))
      .orderBy(asc(aiMessage.createdAt));

    return NextResponse.json({
      messages: messages.map((message) => ({
        ...message,
        receipt: getReceipt(message.id),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: `Unable to load messages: ${message}` }, { status: 500 });
  }
}
