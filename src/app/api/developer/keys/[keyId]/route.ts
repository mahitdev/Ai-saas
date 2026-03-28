import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { developerApiKey } from "@/db/schema";
import {
  deleteFallbackApiKey,
  updateFallbackApiKey,
} from "@/lib/server/fallback-persistence";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const updateKeySchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  limit: z.number().int().min(0).max(2_000_000).optional(),
  rotate: z.boolean().optional(),
  active: z.boolean().optional(),
});

function createApiKey() {
  return `sk_live_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function PATCH(request: Request, context: { params: Promise<{ keyId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { keyId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateKeySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid API key update payload" }, { status: 400 });
  }

  const updatePayload: {
    label?: string;
    limit?: number;
    apiKey?: string;
    active?: boolean;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (parsed.data.label !== undefined) updatePayload.label = parsed.data.label;
  if (parsed.data.limit !== undefined) updatePayload.limit = parsed.data.limit;
  if (parsed.data.active !== undefined) updatePayload.active = parsed.data.active;
  if (parsed.data.rotate) updatePayload.apiKey = createApiKey();

  try {
    const [updated] = await db
      .update(developerApiKey)
      .set(updatePayload)
      .where(and(eq(developerApiKey.id, keyId), eq(developerApiKey.userId, user.id)))
      .returning({
        id: developerApiKey.id,
        label: developerApiKey.label,
        key: developerApiKey.apiKey,
        limit: developerApiKey.limit,
        active: developerApiKey.active,
        createdAt: developerApiKey.createdAt,
        updatedAt: developerApiKey.updatedAt,
      });

    if (!updated) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ key: updated, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const updated = updateFallbackApiKey(user.id, keyId, {
      label: parsed.data.label,
      limit: parsed.data.limit,
      active: parsed.data.active,
      key: parsed.data.rotate ? createApiKey() : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ key: updated, storage: "fallback_memory" });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ keyId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { keyId } = await context.params;

  try {
    const [deleted] = await db
      .delete(developerApiKey)
      .where(and(eq(developerApiKey.id, keyId), eq(developerApiKey.userId, user.id)))
      .returning({ id: developerApiKey.id });

    if (!deleted) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const deleted = deleteFallbackApiKey(user.id, keyId);
    if (!deleted) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, storage: "fallback_memory" });
  }
}
