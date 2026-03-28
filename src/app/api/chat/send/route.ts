import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { generateAssistantReply } from "@/lib/server/ai";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
  assistant: z.enum(["auto", "chatgpt", "gemini"]).optional(),
  imageDataUrl: z.string().max(3_000_000).optional(),
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

  const aiResult = await generateAssistantReply({
    userId: user.id,
    userMessage: parsed.data.message,
    conversationId,
    assistant: parsed.data.assistant ?? "auto",
    imageDataUrl: parsed.data.imageDataUrl,
  });

  const [assistantMessage] = await db
    .insert(aiMessage)
    .values({
      id: crypto.randomUUID(),
      conversationId,
      userId: user.id,
      role: "assistant",
      content: aiResult.reply,
    })
    .returning();

  await db
    .update(aiConversation)
    .set({
      title: buildConversationTitle(parsed.data.message),
      updatedAt: new Date(),
    })
    .where(and(eq(aiConversation.id, conversationId), eq(aiConversation.userId, user.id)));

  const firstThreeInputs = await db
    .select({ content: aiMessage.content })
    .from(aiMessage)
    .where(and(eq(aiMessage.userId, user.id), eq(aiMessage.role, "user")))
    .orderBy(asc(aiMessage.createdAt))
    .limit(3);

  let onboardingAha: string | null = null;
  if (firstThreeInputs.length === 3) {
    const joined = firstThreeInputs.map((row) => row.content).join(" ").toLowerCase();
    const focus = /budget|profit|cost|revenue/.test(joined)
      ? "finance planning"
      : /code|build|api|bug|deploy/.test(joined)
        ? "developer workflows"
        : "productivity automation";
    onboardingAha = `Aha report: based on your first 3 prompts, your highest value path is ${focus}. Try Workflow Builder + Weekly Digest for immediate gains.`;
  }

  return NextResponse.json({
    conversationId,
    userMessage,
    assistantMessage,
    memorySummary: aiResult.memorySummary,
    metadata: aiResult.metadata ?? null,
    onboardingAha,
  });
}
