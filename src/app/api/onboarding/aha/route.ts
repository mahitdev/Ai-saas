import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const firstInputs = await db
    .select({
      id: aiMessage.id,
      content: aiMessage.content,
      createdAt: aiMessage.createdAt,
    })
    .from(aiMessage)
    .where(and(eq(aiMessage.userId, user.id), eq(aiMessage.role, "user")))
    .orderBy(asc(aiMessage.createdAt))
    .limit(3);

  if (firstInputs.length < 3) {
    return NextResponse.json({
      ready: false,
      note: "Aha report unlocks after your first 3 inputs.",
      remaining: 3 - firstInputs.length,
      valueMilestone: "No-setup start: connect one file or account and get a first value milestone.",
    });
  }

  const joined = firstInputs.map((item) => item.content).join(" ");
  const productivity = /task|todo|deadline|meeting|project/i.test(joined);
  const coding = /code|api|bug|deploy|build|typescript|react/i.test(joined);
  const finance = /budget|revenue|cost|profit|invoice|expense/i.test(joined);

  const focus = finance ? "Finance Optimization" : coding ? "Developer Productivity" : "Workflow Efficiency";
  const recommendation = productivity
    ? "Use command bar shortcuts + weekly digest to auto-summarize work blocks."
    : "Use a single file or MCP connection to generate your first value milestone immediately.";

  return NextResponse.json({
    ready: true,
    report: {
      focus,
      recommendation,
      confidence: finance || coding || productivity ? 88 : 72,
      estimatedTwoWeekHoursSaved: finance ? 9 : coding ? 12 : 7,
      valueMilestone: "Generated report + progress bar unlock after the first successful sync.",
    },
    sourceSamples: firstInputs,
  });
}
