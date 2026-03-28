import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { developerApiKey } from "@/db/schema";
import { addFallbackApiKey, getFallbackApiKeys } from "@/lib/server/fallback-persistence";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createKeySchema = z.object({
  label: z.string().trim().min(1).max(80).default("Primary"),
  limit: z.number().int().min(0).max(2_000_000).default(5000),
});

function createApiKey() {
  return `sk_live_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const keys = await db
      .select({
        id: developerApiKey.id,
        label: developerApiKey.label,
        key: developerApiKey.apiKey,
        limit: developerApiKey.limit,
        active: developerApiKey.active,
        createdAt: developerApiKey.createdAt,
        updatedAt: developerApiKey.updatedAt,
      })
      .from(developerApiKey)
      .where(eq(developerApiKey.userId, user.id))
      .orderBy(desc(developerApiKey.updatedAt));

    return NextResponse.json({ keys, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ keys: getFallbackApiKeys(user.id), storage: "fallback_memory" });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createKeySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid API key payload" }, { status: 400 });
  }

  try {
    const [key] = await db
      .insert(developerApiKey)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        label: parsed.data.label,
        apiKey: createApiKey(),
        limit: parsed.data.limit,
        active: true,
      })
      .returning({
        id: developerApiKey.id,
        label: developerApiKey.label,
        key: developerApiKey.apiKey,
        limit: developerApiKey.limit,
        active: developerApiKey.active,
        createdAt: developerApiKey.createdAt,
        updatedAt: developerApiKey.updatedAt,
      });

    return NextResponse.json({ key, storage: "database" }, { status: 201 });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const now = new Date().toISOString();
    const key = addFallbackApiKey({
      id: crypto.randomUUID(),
      userId: user.id,
      label: parsed.data.label,
      key: createApiKey(),
      limit: parsed.data.limit,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ key, storage: "fallback_memory" }, { status: 201 });
  }
}
