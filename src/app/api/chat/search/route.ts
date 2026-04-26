import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiConversation, aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) return unauthorized();

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const from = dateFrom ? new Date(dateFrom) : null;
  const to = dateTo ? new Date(dateTo) : null;

  const rows = await db
    .select({
      messageId: aiMessage.id,
      conversationId: aiMessage.conversationId,
      content: aiMessage.content,
      role: aiMessage.role,
      createdAt: aiMessage.createdAt,
      conversationTitle: aiConversation.title,
    })
    .from(aiMessage)
    .leftJoin(aiConversation, eq(aiConversation.id, aiMessage.conversationId))
    .where(eq(aiMessage.userId, currentUser.id))
    .orderBy(desc(aiMessage.createdAt))
    .limit(50);

  return NextResponse.json({
    results: rows
      .filter((row) => {
        const haystack = `${row.content} ${row.conversationTitle ?? ""}`.toLowerCase();
        const createdAt = new Date(row.createdAt);
        const matchesDateFrom = from ? createdAt >= from : true;
        const matchesDateTo = to ? createdAt <= to : true;
        return haystack.includes(q.toLowerCase()) && matchesDateFrom && matchesDateTo;
      })
      .map((row) => ({
        ...row,
        highlight: q,
      })),
  });
}
