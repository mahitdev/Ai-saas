import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
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
      .where(eq(aiMessage.conversationId, conversationId))
      .orderBy(asc(aiMessage.createdAt));

    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: `Unable to load messages: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const { conversationId } = await context.params;
    
    // Parse the incoming message data
    const body = await request.json();
    const { content, role = "user" } = body;

    // Verify the conversation exists and belongs to the user
    const [conversation] = await db
      .select({ id: aiConversation.id })
      .from(aiConversation)
      .where(and(eq(aiConversation.id, conversationId), eq(aiConversation.userId, user.id)))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Insert the new message
    const [newMessage] = await db
      .insert(aiMessage)
      .values({
        conversationId,
        content,
        role,
      })
      .returning();

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: `Unable to save message: ${message}` }, { status: 500 });
  }
}
