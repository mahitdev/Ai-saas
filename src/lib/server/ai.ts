import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiMemory, aiMessage } from "@/db/schema";
import { env } from "@/lib/env";

function extractFacts(input: string) {
  const lower = input.toLowerCase();
  const patterns = [
    "my name is",
    "i am",
    "i'm",
    "i like",
    "i love",
    "i work as",
    "my goal is",
  ];
  const found: string[] = [];

  for (const pattern of patterns) {
    const index = lower.indexOf(pattern);
    if (index >= 0) {
      const snippet = input.slice(index, Math.min(input.length, index + 90)).trim();
      if (snippet.length > pattern.length + 3) {
        found.push(snippet);
      }
    }
  }

  return found;
}

export async function updateUserMemory(userId: string, userMessage: string) {
  const newFacts = extractFacts(userMessage);
  if (newFacts.length === 0) {
    const [existingOnly] = await db.select().from(aiMemory).where(eq(aiMemory.userId, userId)).limit(1);
    return existingOnly?.summary ?? "";
  }

  const [existing] = await db.select().from(aiMemory).where(eq(aiMemory.userId, userId)).limit(1);
  const currentFacts = existing?.summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean) ?? [];

  const merged = Array.from(new Set([...currentFacts, ...newFacts])).slice(-20);
  const summary = merged.join("\n");

  if (existing) {
    await db
      .update(aiMemory)
      .set({ summary, updatedAt: new Date() })
      .where(eq(aiMemory.userId, userId));
  } else {
    await db.insert(aiMemory).values({
      id: crypto.randomUUID(),
      userId,
      summary,
    });
  }

  return summary;
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) {
    return "";
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== "object") {
      continue;
    }
    const parts = (content as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      if (!part || typeof part !== "object") {
        continue;
      }
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    }
  }

  return "";
}

export async function generateAssistantReply(params: {
  userId: string;
  userMessage: string;
  conversationId: string;
}) {
  const { userId, userMessage, conversationId } = params;

  const memorySummary = await updateUserMemory(userId, userMessage);

  const historyRows = await db
    .select({
      role: aiMessage.role,
      content: aiMessage.content,
    })
    .from(aiMessage)
    .where(eq(aiMessage.conversationId, conversationId))
    .orderBy(desc(aiMessage.createdAt))
    .limit(16);

  const history = historyRows
    .reverse()
    .map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));

  const apiKey = env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return {
      reply:
        "GEMINI_API_KEY is not configured for this deployment yet. Add it in Vercel Environment Variables and redeploy.",
      memorySummary,
    };
  }

  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = "Unknown provider error";

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "You are a warm AI assistant in a personal chat app. Be concise, helpful, and remember user context.",
                },
              ],
            },
            ...(memorySummary
              ? [{ role: "user", parts: [{ text: `User memory:\n${memorySummary}` }] }]
              : []),
            ...history.map((item) => ({
              role: item.role === "assistant" ? "model" : "user",
              parts: [{ text: item.content }],
            })),
            { role: "user", parts: [{ text: userMessage }] },
          ],
        }),
      },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        lastError = `Model ${model} failed (${response.status}). ${errorText}`.slice(0, 240);
        continue;
      }

      const payload = await response.json();
      const reply = extractGeminiText(payload);

      if (!reply) {
        lastError = `Model ${model} returned empty output`;
        continue;
      }

      return { reply, memorySummary };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Request exception";
    }
  }

  return {
    reply: `I couldn't reach the AI provider right now. ${lastError}`,
    memorySummary,
  };
}
