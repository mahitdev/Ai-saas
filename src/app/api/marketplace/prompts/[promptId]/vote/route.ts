import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { promptTemplate, promptTemplateVote } from "@/db/schema";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { voteFallbackPromptTemplate } from "@/lib/server/fallback-persistence";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function POST(_: Request, context: { params: Promise<{ promptId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { promptId } = await context.params;

  try {
    const [already] = await db
      .select({ id: promptTemplateVote.id })
      .from(promptTemplateVote)
      .where(and(eq(promptTemplateVote.userId, user.id), eq(promptTemplateVote.templateId, promptId)))
      .limit(1);

    if (already) {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }

    await db.insert(promptTemplateVote).values({
      id: crypto.randomUUID(),
      userId: user.id,
      templateId: promptId,
    });

    const [current] = await db
      .select({ uses: promptTemplate.uses, rewardCredits: promptTemplate.rewardCredits })
      .from(promptTemplate)
      .where(eq(promptTemplate.id, promptId))
      .limit(1);

    const [updated] = await db
      .update(promptTemplate)
      .set({
        uses: (current?.uses ?? 0) + 1,
        rewardCredits: (current?.rewardCredits ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(promptTemplate.id, promptId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template: updated, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const updated = voteFallbackPromptTemplate(user.id, promptId);
    if (!updated) {
      return NextResponse.json({ error: "Template not found or already voted" }, { status: 404 });
    }
    return NextResponse.json({ template: updated, storage: "fallback_memory" });
  }
}
