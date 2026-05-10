import { asc, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorized();

    const conversations = await db
      .select({ id: aiConversation.id, title: aiConversation.title, updatedAt: aiConversation.updatedAt })
      .from(aiConversation)
      .where(eq(aiConversation.userId, user.id))
      .orderBy(desc(aiConversation.updatedAt))
      .limit(5);

    const conversationIds = conversations.map((conversation) => conversation.id);
    const messages = conversationIds.length
      ? await db
          .select({
            id: aiMessage.id,
            conversationId: aiMessage.conversationId,
            role: aiMessage.role,
            content: aiMessage.content,
            createdAt: aiMessage.createdAt,
          })
          .from(aiMessage)
          .where(inArray(aiMessage.conversationId, conversationIds))
          .orderBy(asc(aiMessage.createdAt))
      : [];

    const history = conversations.map((conversation) => ({
      conversationId: conversation.id,
      messages: messages
        .filter((message) => message.conversationId === conversation.id)
        .slice(-30)
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        })),
    }));

    return NextResponse.json(
      {
        offlineReady: true,
        cachedAt: new Date().toISOString(),
        conversations,
        history,
        draftHint: "Offline mode keeps history readable and drafts sync once connected.",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[OFFLINE_BOOTSTRAP_GET]", error);
    return NextResponse.json(
      { error: "Internal server error during offline bootstrap" },
      { status: 500 }
    );
  }
}
