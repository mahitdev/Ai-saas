import { and, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import { aiMessage, weeklyDigest } from "@/db/schema";

type DeliveryMode = "email" | "pdf" | "in_app";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getWeekWindow(now = new Date()) {
  const end = startOfDay(now);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

function topKeywords(messages: string[]) {
  const skip = new Set(["about", "there", "which", "could", "would", "their", "where", "when", "with", "from"]);
  const counts = new Map<string, number>();
  for (const content of messages) {
    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 4 && !skip.has(word));
    for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

export async function buildWeeklyDigest(params: {
  userId: string;
  deliveryMode: DeliveryMode;
  deliveredTo?: string;
}) {
  const { start, end } = getWeekWindow(new Date());
  const rows = await db
    .select({
      id: aiMessage.id,
      role: aiMessage.role,
      content: aiMessage.content,
      createdAt: aiMessage.createdAt,
    })
    .from(aiMessage)
    .where(and(eq(aiMessage.userId, params.userId), gte(aiMessage.createdAt, start), lt(aiMessage.createdAt, end)))
    .orderBy(desc(aiMessage.createdAt));

  const userMessages = rows.filter((row) => row.role === "user");
  const assistantMessages = rows.filter((row) => row.role === "assistant");
  const totalChars = assistantMessages.reduce((sum, row) => sum + row.content.length, 0);
  const hoursSaved = Math.max(0, Math.round((totalChars / 1200) * 10) / 10);
  const topics = topKeywords(userMessages.map((row) => row.content));
  const topicText = topics.length > 0 ? topics.join(", ") : "general productivity";

  const prediction =
    userMessages.length > 35
      ? "High workload likely next week. Prioritize automation workflows."
      : userMessages.length > 15
        ? "Moderate workload expected. Continue batching recurring prompts."
        : "Light workload expected. Good time to build reusable templates.";

  const body = [
    "Weekly AI Digest",
    `Period: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
    "",
    `You saved approximately ${hoursSaved} hours with AI this week.`,
    `Top topics: ${topicText}.`,
    `Prediction: ${prediction}`,
  ].join("\n");

  const [saved] = await db
    .insert(weeklyDigest)
    .values({
      id: crypto.randomUUID(),
      userId: params.userId,
      weekStartIso: start.toISOString(),
      weekEndIso: end.toISOString(),
      hoursSaved: String(hoursSaved),
      topTopics: topicText,
      prediction,
      digestBody: body,
      deliveryMode: params.deliveryMode,
      deliveredTo: params.deliveredTo ?? null,
    })
    .returning({
      id: weeklyDigest.id,
      createdAt: weeklyDigest.createdAt,
      weekStartIso: weeklyDigest.weekStartIso,
      weekEndIso: weeklyDigest.weekEndIso,
      digestBody: weeklyDigest.digestBody,
      deliveryMode: weeklyDigest.deliveryMode,
      deliveredTo: weeklyDigest.deliveredTo,
      hoursSaved: weeklyDigest.hoursSaved,
      topTopics: weeklyDigest.topTopics,
      prediction: weeklyDigest.prediction,
    });

  return saved;
}
