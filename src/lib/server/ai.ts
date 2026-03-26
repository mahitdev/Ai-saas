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

function extractModelText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const part of content) {
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

  const apiKey = env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      reply:
        "OPENAI_API_KEY is not configured for this deployment yet. Add it in Vercel Environment Variables and redeploy.",
      memorySummary,
    };
  }

  const models = ["gpt-4o-mini", "gpt-4.1-mini"];
  let lastError = "Unknown provider error";

  for (const model of models) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content:
                "You are a warm AI assistant in a personal chat app. Be concise, helpful, and remember user context.",
            },
            ...(memorySummary
              ? [{ role: "system", content: `User memory:\n${memorySummary}` }]
              : []),
            ...history,
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        lastError = `Model ${model} failed (${response.status}). ${errorText}`.slice(0, 240);
        continue;
      }

      const payload = await response.json();
      const reply = extractModelText(payload);

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
