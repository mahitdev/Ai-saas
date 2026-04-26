import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const aiSchema = z.object({
  mode: z.enum(["summarize", "sentiment", "suggest", "translate"]),
  text: z.string().trim().min(1).max(10000),
  targetLanguage: z.string().trim().max(20).optional(),
});

function summarize(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 3);
  return sentences.join(" ").trim() || text.slice(0, 220);
}

function sentiment(text: string) {
  const positive = /(great|good|love|win|happy|thanks|awesome|ship|fast)/i.test(text);
  const negative = /(bad|bug|angry|urgent|hate|blocked|delay|risk)/i.test(text);
  return {
    label: positive && !negative ? "positive" : negative && !positive ? "negative" : "neutral",
    emotion: positive ? "optimistic" : negative ? "concerned" : "steady",
    score: positive ? 82 : negative ? 28 : 54,
  };
}

function suggest(text: string) {
  if (/budget|cost|roi|revenue/i.test(text)) return "Suggest: frame the next reply around impact, savings, and decision time.";
  if (/bug|error|fix|deploy|api/i.test(text)) return "Suggest: acknowledge the issue, share the fix plan, and provide an ETA.";
  return "Suggest: keep it short, confirm the next step, and close with a clear question.";
}

function translate(text: string, targetLanguage?: string) {
  return `Translated (${targetLanguage ?? "target"}): ${text}`;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = aiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI helper payload" }, { status: 400 });
  }

  if (parsed.data.mode === "summarize") {
    return NextResponse.json({ summary: summarize(parsed.data.text) });
  }
  if (parsed.data.mode === "sentiment") {
    return NextResponse.json({ ...sentiment(parsed.data.text) });
  }
  if (parsed.data.mode === "suggest") {
    return NextResponse.json({ suggestion: suggest(parsed.data.text) });
  }
  return NextResponse.json({ translation: translate(parsed.data.text, parsed.data.targetLanguage) });
}
