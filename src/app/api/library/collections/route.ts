import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { libraryCollection } from "@/db/schema";
import { ensureFallbackCollection, getFallbackLibrary } from "@/lib/server/fallback-persistence";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const collections = await db
      .select({ id: libraryCollection.id, name: libraryCollection.name })
      .from(libraryCollection)
      .where(eq(libraryCollection.userId, user.id))
      .orderBy(asc(libraryCollection.name));

    return NextResponse.json({ collections, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const fallback = getFallbackLibrary(user.id);
    return NextResponse.json({
      collections: fallback.collections.map((name) => ({ id: name.toLowerCase(), name })),
      storage: "fallback_memory",
    });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid collection payload" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select({ id: libraryCollection.id, name: libraryCollection.name })
      .from(libraryCollection)
      .where(and(eq(libraryCollection.userId, user.id), eq(libraryCollection.name, parsed.data.name)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ collection: existing, created: false, storage: "database" });
    }

    const [collection] = await db
      .insert(libraryCollection)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        name: parsed.data.name,
      })
      .returning({ id: libraryCollection.id, name: libraryCollection.name });

    return NextResponse.json({ collection, created: true, storage: "database" }, { status: 201 });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    ensureFallbackCollection(user.id, parsed.data.name);
    return NextResponse.json(
      { collection: { id: parsed.data.name.toLowerCase(), name: parsed.data.name }, created: true, storage: "fallback_memory" },
      { status: 201 },
    );
  }
}
