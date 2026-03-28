import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { weeklyDigest } from "@/db/schema";
import { buildWeeklyDigest } from "@/lib/server/weekly-digest";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const digestSchema = z.object({
  deliveryMode: z.enum(["email", "pdf", "in_app"]).default("in_app"),
  deliveredTo: z.string().trim().max(200).optional(),
});

function toMarkdown(digest: { digestBody: string; topTopics: string; prediction: string }) {
  return [
    "# Weekly AI Digest",
    "",
    digest.digestBody,
    "",
    `Top Topics: ${digest.topTopics}`,
    `Prediction: ${digest.prediction}`,
  ].join("\n");
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const rows = await db
    .select({
      id: weeklyDigest.id,
      weekStartIso: weeklyDigest.weekStartIso,
      weekEndIso: weeklyDigest.weekEndIso,
      hoursSaved: weeklyDigest.hoursSaved,
      topTopics: weeklyDigest.topTopics,
      prediction: weeklyDigest.prediction,
      deliveryMode: weeklyDigest.deliveryMode,
      deliveredTo: weeklyDigest.deliveredTo,
      createdAt: weeklyDigest.createdAt,
      digestBody: weeklyDigest.digestBody,
    })
    .from(weeklyDigest)
    .where(eq(weeklyDigest.userId, user.id))
    .orderBy(desc(weeklyDigest.createdAt))
    .limit(8);

  return NextResponse.json({ digests: rows });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = digestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid weekly digest payload" }, { status: 400 });
  }

  const digest = await buildWeeklyDigest({
    userId: user.id,
    deliveryMode: parsed.data.deliveryMode,
    deliveredTo: parsed.data.deliveredTo,
  });

  if (parsed.data.deliveryMode === "pdf") {
    const pdfLikeText = `WEEKLY AI DIGEST\n\n${digest.digestBody}\n`;
    return new NextResponse(pdfLikeText, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="weekly-digest-${Date.now()}.pdf"`,
      },
    });
  }

  if (parsed.data.deliveryMode === "email") {
    return NextResponse.json({
      delivered: true,
      channel: "email",
      deliveredTo: parsed.data.deliveredTo ?? user.email,
      digest,
    });
  }

  const markdown = toMarkdown(digest);
  return NextResponse.json({
    delivered: true,
    channel: "in_app",
    digest,
    markdown,
  });
}
