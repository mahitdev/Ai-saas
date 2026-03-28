import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { libraryAsset, libraryCollection } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function DELETE(_: Request, context: { params: Promise<{ collectionId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { collectionId } = await context.params;

  const [collection] = await db
    .select({ id: libraryCollection.id, name: libraryCollection.name })
    .from(libraryCollection)
    .where(and(eq(libraryCollection.id, collectionId), eq(libraryCollection.userId, user.id)))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  await db
    .update(libraryAsset)
    .set({ collection: "General", updatedAt: new Date() })
    .where(and(eq(libraryAsset.userId, user.id), eq(libraryAsset.collection, collection.name)));

  await db
    .delete(libraryCollection)
    .where(and(eq(libraryCollection.id, collectionId), eq(libraryCollection.userId, user.id)));

  return NextResponse.json({ ok: true });
}
