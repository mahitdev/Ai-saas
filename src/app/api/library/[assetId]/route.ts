import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { libraryAsset } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const updateAssetSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  content: z.string().trim().min(1).max(10000).optional(),
  collection: z.string().trim().min(1).max(80).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
});

function normalizeTags(input?: string[]) {
  if (!input) return undefined;
  if (input.length === 0) return "general";
  return Array.from(new Set(input.map((item) => item.toLowerCase()))).join(",");
}

export async function PATCH(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { assetId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid library asset payload" }, { status: 400 });
  }

  const updatePayload: {
    title?: string;
    content?: string;
    collection?: string;
    tags?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title;
  if (parsed.data.content !== undefined) updatePayload.content = parsed.data.content;
  if (parsed.data.collection !== undefined) updatePayload.collection = parsed.data.collection;

  const normalizedTags = normalizeTags(parsed.data.tags);
  if (normalizedTags !== undefined) updatePayload.tags = normalizedTags;

  const [asset] = await db
    .update(libraryAsset)
    .set(updatePayload)
    .where(and(eq(libraryAsset.id, assetId), eq(libraryAsset.userId, user.id)))
    .returning({
      id: libraryAsset.id,
      title: libraryAsset.title,
      content: libraryAsset.content,
      collection: libraryAsset.collection,
      source: libraryAsset.source,
      tags: libraryAsset.tags,
      createdAt: libraryAsset.createdAt,
      updatedAt: libraryAsset.updatedAt,
    });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({
    asset: {
      ...asset,
      tags: asset.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    },
  });
}

export async function DELETE(_: Request, context: { params: Promise<{ assetId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { assetId } = await context.params;

  const [deleted] = await db
    .delete(libraryAsset)
    .where(and(eq(libraryAsset.id, assetId), eq(libraryAsset.userId, user.id)))
    .returning({ id: libraryAsset.id });

  if (!deleted) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
