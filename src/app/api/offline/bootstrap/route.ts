import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const conversations = await db
    .select({ id: aiConversation.id, title: aiConversation.title, updatedAt: aiConversation.updatedAt })
    .from(aiConversation)
    .where(eq(aiConversation.userId, user.id))
    .orderBy(desc(aiConversation.updatedAt))
    .limit(5);

  const history: Array<{ conversationId: string; messages: Array<{ role: string; content: string; createdAt: Date }> }> = [];

  for (const conversation of conversations) {
    const messages = await db
      .select({ role: aiMessage.role, content: aiMessage.content, createdAt: aiMessage.createdAt })
      .from(aiMessage)
      .where(and(eq(aiMessage.userId, user.id), eq(aiMessage.conversationId, conversation.id)))
      .orderBy(asc(aiMessage.createdAt))
      .limit(30);
    history.push({ conversationId: conversation.id, messages });
  }

  return NextResponse.json({
    offlineReady: true,
    cachedAt: new Date().toISOString(),
    conversations,
    history,
    draftHint: "Offline mode keeps history readable and drafts sync once connected.",
  });
}
