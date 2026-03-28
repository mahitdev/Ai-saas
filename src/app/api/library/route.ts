import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { libraryAsset, libraryCollection } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createAssetSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  content: z.string().trim().min(1).max(10000),
  collection: z.string().trim().min(1).max(80).default("General"),
  source: z.string().trim().min(1).max(60).default("manual"),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
});

function normalizeTags(input?: string[]) {
  if (!input || input.length === 0) return "general";
  return Array.from(new Set(input.map((item) => item.toLowerCase()))).join(",");
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const [collections, assets] = await Promise.all([
    db
      .select({ id: libraryCollection.id, name: libraryCollection.name })
      .from(libraryCollection)
      .where(eq(libraryCollection.userId, user.id)),
    db
      .select({
        id: libraryAsset.id,
        title: libraryAsset.title,
        content: libraryAsset.content,
        collection: libraryAsset.collection,
        source: libraryAsset.source,
        tags: libraryAsset.tags,
        createdAt: libraryAsset.createdAt,
        updatedAt: libraryAsset.updatedAt,
      })
      .from(libraryAsset)
      .where(eq(libraryAsset.userId, user.id))
      .orderBy(desc(libraryAsset.updatedAt)),
  ]);

  const assetCollections = new Set(assets.map((asset) => asset.collection));
  for (const collection of collections) {
    assetCollections.add(collection.name);
  }
  if (assetCollections.size === 0) {
    assetCollections.add("General");
  }

  return NextResponse.json({
    collections: Array.from(assetCollections),
    assets: assets.map((asset) => ({
      ...asset,
      tags: asset.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid library asset payload" }, { status: 400 });
  }

  const title = parsed.data.title?.trim() || parsed.data.content.slice(0, 60);

  const [existingCollection] = await db
    .select({ id: libraryCollection.id })
    .from(libraryCollection)
    .where(and(eq(libraryCollection.userId, user.id), eq(libraryCollection.name, parsed.data.collection)))
    .limit(1);

  if (!existingCollection) {
    await db.insert(libraryCollection).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: parsed.data.collection,
    });
  }

  const [asset] = await db
    .insert(libraryAsset)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      content: parsed.data.content,
      collection: parsed.data.collection,
      source: parsed.data.source,
      tags: normalizeTags(parsed.data.tags),
    })
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

  return NextResponse.json(
    {
      asset: {
        ...asset,
        tags: asset.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    },
    { status: 201 },
  );
}
