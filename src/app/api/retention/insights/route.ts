import { and, count, desc, eq, gte, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { aiMessage, projectTask, retentionInsight } from "@/db/schema";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { getFallbackRetentionInsight, saveFallbackRetentionInsight } from "@/lib/server/fallback-persistence";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const progressiveAnswerSchema = z.object({
  questionKey: z.string().trim().min(1).max(60),
  answer: z.string().trim().min(1).max(300),
});

const progressiveQuestions = [
  { key: "weekly_goal", question: "What is your main goal this week?" },
  { key: "focus_metric", question: "Which metric matters most to you this month?" },
  { key: "biggest_blocker", question: "What is your biggest blocker right now?" },
  { key: "preferred_tone", question: "How should AI respond: concise, strategic, or detailed?" },
];

function pickNextQuestion(profile: Record<string, string>) {
  return progressiveQuestions.find((item) => !profile[item.key]) ?? null;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [[msgRow], [unfinishedRow], [existing]] = await Promise.all([
      db.select({ value: count() }).from(aiMessage).where(and(eq(aiMessage.userId, user.id), gte(aiMessage.createdAt, sevenDaysAgo))),
      db.select({ value: count() }).from(projectTask).where(and(eq(projectTask.ownerId, user.id), ne(projectTask.status, "done"))),
      db
        .select()
        .from(retentionInsight)
        .where(eq(retentionInsight.userId, user.id))
        .orderBy(desc(retentionInsight.updatedAt))
        .limit(1),
    ]);

    const messagesLast7d = Number(msgRow?.value ?? 0);
    const unfinishedTasks = Number(unfinishedRow?.value ?? 0);
    const churnRiskScore = Math.min(95, Math.max(5, 65 - messagesLast7d * 4 + unfinishedTasks * 3));
    const weeklyHoursSaved = Math.max(1, Math.round(messagesLast7d * 0.35 + 3));
    const weeklyTasksCompleted = Math.max(1, Math.round(messagesLast7d * 1.8));

    const profile = existing?.progressiveProfile ? JSON.parse(existing.progressiveProfile) as Record<string, string> : {};
    const nextQuestion = pickNextQuestion(profile);

    if (!existing) {
      await db.insert(retentionInsight).values({
        id: crypto.randomUUID(),
        userId: user.id,
        churnRiskScore,
        weeklyHoursSaved,
        weeklyTasksCompleted,
        progressiveProfile: JSON.stringify(profile),
      });
    } else {
      await db
        .update(retentionInsight)
        .set({ churnRiskScore, weeklyHoursSaved, weeklyTasksCompleted, updatedAt: new Date() })
        .where(eq(retentionInsight.userId, user.id));
    }

    return NextResponse.json({
      churnRiskScore,
      weeklyImpact: {
        hoursSaved: weeklyHoursSaved,
        tasksCompleted: weeklyTasksCompleted,
        mondayDigestPreview: `This week, AI saved you ${weeklyHoursSaved} hours and completed ${weeklyTasksCompleted} tasks.`,
      },
      progressiveQuestion: nextQuestion,
      inactiveRisk: churnRiskScore >= 70,
      storage: "database",
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const fallback = getFallbackRetentionInsight(user.id);
    const nextQuestion = pickNextQuestion(fallback.progressiveProfile);
    return NextResponse.json({
      churnRiskScore: fallback.churnRiskScore,
      weeklyImpact: {
        hoursSaved: fallback.weeklyHoursSaved,
        tasksCompleted: fallback.weeklyTasksCompleted,
        mondayDigestPreview: `This week, AI saved you ${fallback.weeklyHoursSaved} hours and completed ${fallback.weeklyTasksCompleted} tasks.`,
      },
      progressiveQuestion: nextQuestion,
      inactiveRisk: fallback.churnRiskScore >= 70,
      storage: "fallback_memory",
    });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = progressiveAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profiling payload" }, { status: 400 });
  }

  try {
    const [existing] = await db.select().from(retentionInsight).where(eq(retentionInsight.userId, user.id)).limit(1);
    const profile = existing?.progressiveProfile ? JSON.parse(existing.progressiveProfile) as Record<string, string> : {};
    profile[parsed.data.questionKey] = parsed.data.answer;

    if (!existing) {
      await db.insert(retentionInsight).values({
        id: crypto.randomUUID(),
        userId: user.id,
        progressiveProfile: JSON.stringify(profile),
      });
    } else {
      await db
        .update(retentionInsight)
        .set({ progressiveProfile: JSON.stringify(profile), updatedAt: new Date() })
        .where(eq(retentionInsight.userId, user.id));
    }

    return NextResponse.json({ profile, nextQuestion: pickNextQuestion(profile), storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const current = getFallbackRetentionInsight(user.id);
    const profile = { ...current.progressiveProfile, [parsed.data.questionKey]: parsed.data.answer };
    const updated = saveFallbackRetentionInsight(user.id, { progressiveProfile: profile });
    return NextResponse.json({ profile: updated.progressiveProfile, nextQuestion: pickNextQuestion(updated.progressiveProfile), storage: "fallback_memory" });
  }
}
