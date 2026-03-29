import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { retentionInsight } from "@/db/schema";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { saveFallbackRetentionInsight } from "@/lib/server/fallback-persistence";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const interventionSchema = z.object({
  discountPercent: z.number().int().min(0).max(80).default(15),
  tip: z.string().trim().min(2).max(200).default("Try the Logic Builder for your top recurring workflow."),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = interventionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid intervention payload" }, { status: 400 });
  }

  const emailBody = `We missed you, ${user.name}. Here is ${parsed.data.discountPercent}% off and a quick tip: ${parsed.data.tip}`;

  try {
    const [existing] = await db.select().from(retentionInsight).where(eq(retentionInsight.userId, user.id)).limit(1);
    if (!existing) {
      await db.insert(retentionInsight).values({
        id: crypto.randomUUID(),
        userId: user.id,
        lastInterventionEmail: emailBody,
      });
    } else {
      await db
        .update(retentionInsight)
        .set({ lastInterventionEmail: emailBody, updatedAt: new Date() })
        .where(eq(retentionInsight.userId, user.id));
    }

    return NextResponse.json({ queued: true, emailBody, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    saveFallbackRetentionInsight(user.id, { lastInterventionEmail: emailBody });
    return NextResponse.json({ queued: true, emailBody, storage: "fallback_memory" });
  }
}
