import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const styleSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  samples: z.array(z.string().trim().min(1).max(10000)).min(1).max(10),
});

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = styleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid style score payload" }, { status: 400 });
  }

  const contentTokens = new Set(tokenize(parsed.data.content));
  const sampleTokens = new Set(tokenize(parsed.data.samples.join(" ")));

  const overlap = Array.from(contentTokens).filter((token) => sampleTokens.has(token)).length;
  const union = new Set([...contentTokens, ...sampleTokens]).size || 1;
  const lexicalScore = overlap / union;

  const avgSampleLen =
    parsed.data.samples.reduce((sum, sample) => sum + sample.split(/\s+/).length, 0) / parsed.data.samples.length;
  const contentLen = parsed.data.content.split(/\s+/).length;
  const lengthPenalty = Math.min(1, Math.abs(contentLen - avgSampleLen) / Math.max(1, avgSampleLen));

  const score = Math.max(0, Math.min(100, Math.round((lexicalScore * 0.8 + (1 - lengthPenalty) * 0.2) * 100)));
  const band = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs tuning" : "Low match";

  return NextResponse.json({
    brandConsistencyScore: score,
    band,
    notes: [
      `Vocabulary overlap: ${Math.round(lexicalScore * 100)}%`,
      `Length similarity: ${Math.round((1 - lengthPenalty) * 100)}%`,
    ],
  });
}

