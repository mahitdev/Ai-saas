import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { generateAssistantReply } from "@/lib/server/ai";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
});

function buildConversationTitle(message: string) {
  return message.slice(0, 60).trim() || "New Chat";
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
  }

  let conversationId = parsed.data.conversationId;

  if (conversationId) {
    const [existing] = await db
      .select({ id: aiConversation.id })
      .from(aiConversation)
      .where(and(eq(aiConversation.id, conversationId), eq(aiConversation.userId, user.id)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    const [created] = await db
      .insert(aiConversation)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        title: buildConversationTitle(parsed.data.message),
      })
      .returning({ id: aiConversation.id });
    conversationId = created.id;
  }

  const [userMessage] = await db
    .insert(aiMessage)
    .values({
      id: crypto.randomUUID(),
      conversationId,
      userId: user.id,
      role: "user",
      content: parsed.data.message,
    })
    .returning();

  const { reply, memorySummary } = await generateAssistantReply({
    userId: user.id,
    userMessage: parsed.data.message,
    conversationId,
  });

  const [assistantMessage] = await db
    .insert(aiMessage)
    .values({
      id: crypto.randomUUID(),
      conversationId,
      userId: user.id,
      role: "assistant",
      content: reply,
    })
    .returning();

  await db
    .update(aiConversation)
    .set({
      title: buildConversationTitle(parsed.data.message),
      updatedAt: new Date(),
    })
    .where(and(eq(aiConversation.id, conversationId), eq(aiConversation.userId, user.id)));

  return NextResponse.json({
    conversationId,
    userMessage,
    assistantMessage,
    memorySummary,
  });
}
