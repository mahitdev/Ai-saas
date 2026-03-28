import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { semanticMetric } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { ensureDefaultSemanticMetrics, evaluateFormula } from "@/lib/server/semantic-layer";

const resolveSchema = z.object({
  metricKey: z.string().trim().min(2).max(100),
  input: z.record(z.string(), z.coerce.number()),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  await ensureDefaultSemanticMetrics(user.id);

  const body = await request.json().catch(() => null);
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid semantic resolve payload" }, { status: 400 });
  }

  const [metric] = await db
    .select({
      metricKey: semanticMetric.metricKey,
      displayName: semanticMetric.displayName,
      formula: semanticMetric.formula,
    })
    .from(semanticMetric)
    .where(and(eq(semanticMetric.userId, user.id), eq(semanticMetric.metricKey, parsed.data.metricKey)))
    .limit(1);

  if (!metric) {
    return NextResponse.json({ error: "Semantic metric not found" }, { status: 404 });
  }

  try {
    const result = evaluateFormula(metric.formula, parsed.data.input);
    return NextResponse.json({
      metricKey: metric.metricKey,
      displayName: metric.displayName,
      formula: metric.formula,
      value: Number(result.toFixed(4)),
      input: parsed.data.input,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resolve semantic metric" },
      { status: 400 },
    );
  }
}
