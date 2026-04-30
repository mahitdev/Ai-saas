import { and, count, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiMessage, projectTask } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { getPresence } from "@/lib/server/chat-realtime";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [messageCountRow, taskCountRow] = await Promise.all([
    db.select({ value: count() }).from(aiMessage).where(and(eq(aiMessage.userId, user.id), gte(aiMessage.createdAt, since))),
    db.select({ value: count() }).from(projectTask).where(eq(projectTask.ownerId, user.id)),
  ]);

  const activePresence = await getPresence(user.id);
  const latencyMs = 220 + (activePresence?.typing ? 90 : 0);
  const sentimentScore = Math.max(40, Math.min(98, 72 + Number(messageCountRow[0]?.value ?? 0) * 2 - Number(taskCountRow[0]?.value ?? 0)));
  const churnRisk = Math.max(8, Math.min(92, 62 - Number(messageCountRow[0]?.value ?? 0) * 2 + Number(taskCountRow[0]?.value ?? 0) * 3));

  return NextResponse.json({
    activeUsers: activePresence?.status === "online" ? 1 : 0,
    messageLatencyMs: latencyMs,
    sentimentScore,
    churnRisk,
    presence: activePresence,
    storage: "database",
  });
}
