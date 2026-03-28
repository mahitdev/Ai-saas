import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { semanticMetric } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { listSemanticMetrics } from "@/lib/server/semantic-layer";

const upsertMetricSchema = z.object({
  metricKey: z.string().trim().min(2).max(100).regex(/^[a-z0-9_]+$/),
  displayName: z.string().trim().min(2).max(120),
  formula: z.string().trim().min(3).max(250),
  description: z.string().trim().max(400).optional(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const metrics = await listSemanticMetrics(user.id);
  return NextResponse.json({ metrics });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = upsertMetricSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid semantic metric payload" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: semanticMetric.id })
    .from(semanticMetric)
    .where(and(eq(semanticMetric.userId, user.id), eq(semanticMetric.metricKey, parsed.data.metricKey)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(semanticMetric)
      .set({
        displayName: parsed.data.displayName,
        formula: parsed.data.formula,
        description: parsed.data.description ?? null,
        active: true,
        updatedAt: new Date(),
      })
      .where(and(eq(semanticMetric.id, existing.id), eq(semanticMetric.userId, user.id)))
      .returning({
        id: semanticMetric.id,
        metricKey: semanticMetric.metricKey,
        displayName: semanticMetric.displayName,
        formula: semanticMetric.formula,
        description: semanticMetric.description,
        active: semanticMetric.active,
      });
    return NextResponse.json({ metric: updated, updated: true });
  }

  const [created] = await db
    .insert(semanticMetric)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      metricKey: parsed.data.metricKey,
      displayName: parsed.data.displayName,
      formula: parsed.data.formula,
      description: parsed.data.description ?? null,
      active: true,
    })
    .returning({
      id: semanticMetric.id,
      metricKey: semanticMetric.metricKey,
      displayName: semanticMetric.displayName,
      formula: semanticMetric.formula,
      description: semanticMetric.description,
      active: semanticMetric.active,
    });

  return NextResponse.json({ metric: created, created: true });
}
