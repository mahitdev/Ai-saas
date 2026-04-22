import { and, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const roiSchema = z.object({
  hourlyRate: z.coerce.number().min(1).max(1000).default(35),
  subscriptionCost: z.coerce.number().min(0).max(50000).default(49),
  successfulTaskPrice: z.coerce.number().min(0).max(100).default(1),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = roiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ROI payload" }, { status: 400 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rows = await db
    .select({ content: aiMessage.content, role: aiMessage.role, createdAt: aiMessage.createdAt })
    .from(aiMessage)
    .where(and(eq(aiMessage.userId, user.id), gte(aiMessage.createdAt, since)));

  const successfulTasks = rows.filter(
    (row) =>
      row.role === "assistant" &&
      /(done|completed|summary|plan|draft|resolved|fixed|report)/i.test(row.content),
  ).length;
  const assistantChars = rows
    .filter((row) => row.role === "assistant")
    .reduce((sum, row) => sum + row.content.length, 0);
  const hoursSaved = Math.max(0, Number((assistantChars / 1400).toFixed(1)));
  const totalSavings = Number((hoursSaved * parsed.data.hourlyRate - parsed.data.subscriptionCost).toFixed(2));
  const outcomeBill = Number((successfulTasks * parsed.data.successfulTaskPrice).toFixed(2));
  const payPerSuccess = Number((successfulTasks * 2).toFixed(2));
  const carbonKg = Number((assistantChars * 0.00000036).toFixed(6));

  return NextResponse.json({
    model: "outcome_based_pricing",
    monthly: {
      successfulTasks,
      outcomeBill,
      hoursSaved,
      hourlyRate: parsed.data.hourlyRate,
      subscriptionCost: parsed.data.subscriptionCost,
      totalSavings,
      payPerSuccess,
    },
    esg: {
      carbonFootprintKgCo2e: carbonKg,
      badge: carbonKg < 0.02 ? "Low Impact" : carbonKg < 0.08 ? "Moderate Impact" : "High Impact",
    },
  });
}
