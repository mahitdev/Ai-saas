import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { aiConversation, aiMemory } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const conversations = await db
    .select()
    .from(aiConversation)
    .where(eq(aiConversation.userId, user.id))
    .orderBy(desc(aiConversation.updatedAt));

  const [memory] = await db
    .select()
    .from(aiMemory)
    .where(eq(aiMemory.userId, user.id))
    .limit(1);

  return NextResponse.json({
    conversations,
    memory: memory?.summary ?? "",
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid conversation payload" }, { status: 400 });
  }

  const [conversation] = await db
    .insert(aiConversation)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      title: parsed.data.title ?? "New Chat",
    })
    .returning();

  return NextResponse.json({ conversation }, { status: 201 });
}
