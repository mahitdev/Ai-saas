import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { developerWebhookLog } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createWebhookLogSchema = z.object({
  event: z.string().trim().min(1).max(160).default("task-finished"),
  statusCode: z.number().int().min(100).max(599).default(200),
  detail: z.string().trim().min(1).max(300).optional(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const logs = await db
    .select({
      id: developerWebhookLog.id,
      event: developerWebhookLog.event,
      statusCode: developerWebhookLog.statusCode,
      detail: developerWebhookLog.detail,
      createdAt: developerWebhookLog.createdAt,
    })
    .from(developerWebhookLog)
    .where(eq(developerWebhookLog.userId, user.id))
    .orderBy(desc(developerWebhookLog.createdAt))
    .limit(20);

  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createWebhookLogSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook log payload" }, { status: 400 });
  }

  const [log] = await db
    .insert(developerWebhookLog)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      event: parsed.data.event,
      statusCode: parsed.data.statusCode,
      detail: parsed.data.detail ?? "Webhook ping accepted.",
    })
    .returning({
      id: developerWebhookLog.id,
      event: developerWebhookLog.event,
      statusCode: developerWebhookLog.statusCode,
      detail: developerWebhookLog.detail,
      createdAt: developerWebhookLog.createdAt,
    });

  return NextResponse.json({ log }, { status: 201 });
}
