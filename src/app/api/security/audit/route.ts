import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const maskSchema = z.object({
  text: z.string().max(8000),
  enabled: z.boolean(),
});

function detectPromptInjection(text: string) {
  return /(ignore previous|system prompt|jailbreak|bypass|developer mode|act as|override rules)/i.test(text);
}

function maskPii(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[MASKED_EMAIL]")
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[MASKED_CARD]")
    .replace(/\b(?:\+?\d{1,3}[- ]?)?\d{10}\b/g, "[MASKED_PHONE]");
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const rows = await db
    .select({
      id: aiMessage.id,
      content: aiMessage.content,
      role: aiMessage.role,
      createdAt: aiMessage.createdAt,
    })
    .from(aiMessage)
    .where(and(eq(aiMessage.userId, user.id), eq(aiMessage.role, "user")))
    .orderBy(desc(aiMessage.createdAt))
    .limit(60);

  const alerts = rows
    .filter((row) => detectPromptInjection(row.content))
    .map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      excerpt: row.content.slice(0, 180),
      severity: "high" as const,
      type: "prompt_injection",
    }));

  return NextResponse.json({
    alerts,
    totalScanned: rows.length,
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = maskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid masking payload" }, { status: 400 });
  }

  const maskedText = parsed.data.enabled ? maskPii(parsed.data.text) : parsed.data.text;
  const piiDetected = maskedText !== parsed.data.text;

  return NextResponse.json({
    maskedText,
    piiDetected,
    injectionDetected: detectPromptInjection(parsed.data.text),
  });
}

