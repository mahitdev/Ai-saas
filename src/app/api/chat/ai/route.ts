import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const aiSchema = z.object({
  mode: z.enum(["summarize", "sentiment", "suggest", "translate"]),
  text: z.string().trim().min(1).max(10000),
  targetLanguage: z.string().trim().max(20).optional(),
});

function buildPrompt(mode: z.infer<typeof aiSchema>["mode"], text: string, targetLanguage?: string) {
  if (mode === "summarize") {
    return `Summarize this chat content in 3 concise bullets. Return JSON: {"summary":"..."}.\n\n${text}`;
  }
  if (mode === "sentiment") {
    return `Analyze sentiment for this chat content. Return JSON only: {"label":"positive|neutral|negative","emotion":"one-word emotion","score":0-100}.\n\n${text}`;
  }
  if (mode === "suggest") {
    return `Suggest the next best reply or action for this chat content. Return JSON: {"suggestion":"..."}.\n\n${text}`;
  }
  return `Translate this text to ${targetLanguage || "English"}. Return JSON: {"translation":"..."}.\n\n${text}`;
}

function parseJsonObject(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function askOpenAi(prompt: string) {
  if (!env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI helper failed with ${response.status}`);
  const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text ?? "";
}

async function askGemini(prompt: string) {
  if (!env.GEMINI_API_KEY) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini helper failed with ${response.status}`);
  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).find((part) => part.text)?.text ?? "";
}

async function runHelper(mode: z.infer<typeof aiSchema>["mode"], text: string, targetLanguage?: string) {
  const prompt = buildPrompt(mode, text, targetLanguage);
  const raw = (await askOpenAi(prompt)) ?? (await askGemini(prompt));
  if (!raw) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.");
  }
  const parsed = parseJsonObject(raw);
  if (!parsed) {
    throw new Error("AI helper returned non-JSON output.");
  }
  return parsed;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = aiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI helper payload" }, { status: 400 });
  }

  try {
    const result = await runHelper(parsed.data.mode, parsed.data.text, parsed.data.targetLanguage);
    return NextResponse.json({ ...result, provider: env.OPENAI_API_KEY ? "openai" : "gemini" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI helper failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
