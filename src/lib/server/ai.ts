import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiMemory, aiMessage } from "@/db/schema";
import { env } from "@/lib/env";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function localFallbackReply(input: string, history: ChatMessage[], memory: string) {
  const lastAssistant = [...history].reverse().find((item) => item.role === "assistant")?.content;
  const memoryLine = memory ? `I remember: ${memory.split("\n").slice(-2).join(" | ")}.` : "";

  return [
    "I heard you.",
    `You said: "${input}"`,
    memoryLine,
    lastAssistant ? "I can continue from where we left off." : "Ask me anything and I will keep track of context.",
  ]
    .filter(Boolean)
    .join(" ");
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

  if (!env.OPENAI_API_KEY) {
    return {
      reply: localFallbackReply(userMessage, history, memorySummary),
      memorySummary,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
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
      throw new Error(`Model request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { output_text?: string };
    const reply = payload.output_text?.trim();

    if (!reply) {
      throw new Error("Empty model reply");
    }

    return { reply, memorySummary };
  } catch {
    return {
      reply: localFallbackReply(userMessage, history, memorySummary),
      memorySummary,
    };
  }
}
