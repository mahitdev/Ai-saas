import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { modelLabProfile } from "@/db/schema";
import {
  getFallbackModelLabProfile,
  saveFallbackModelLabProfile,
} from "@/lib/server/fallback-persistence";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const updateModelLabSchema = z.object({
  systemPrompt: z.string().trim().min(3).max(6000),
  engine: z.enum(["flash", "pro"]),
  styleProfileEnabled: z.boolean(),
  knowledgeFiles: z.array(z.string().trim().min(1).max(200)).max(200),
  playbooks: z.array(z.string().trim().min(1).max(240)).max(200),
});

function parseStoredList(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [] as string[];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [] as string[];
  }
}

async function getOrCreateProfile(userId: string) {
  const [existing] = await db
    .select({
      id: modelLabProfile.id,
      systemPrompt: modelLabProfile.systemPrompt,
      engine: modelLabProfile.engine,
      styleProfileEnabled: modelLabProfile.styleProfileEnabled,
      knowledgeFiles: modelLabProfile.knowledgeFiles,
      playbooks: modelLabProfile.playbooks,
      updatedAt: modelLabProfile.updatedAt,
    })
    .from(modelLabProfile)
    .where(eq(modelLabProfile.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(modelLabProfile)
    .values({
      id: crypto.randomUUID(),
      userId,
      systemPrompt: "Always respond in a structured, practical format.",
      engine: "flash",
      styleProfileEnabled: false,
      knowledgeFiles: "[]",
      playbooks: "[]",
    })
    .returning({
      id: modelLabProfile.id,
      systemPrompt: modelLabProfile.systemPrompt,
      engine: modelLabProfile.engine,
      styleProfileEnabled: modelLabProfile.styleProfileEnabled,
      knowledgeFiles: modelLabProfile.knowledgeFiles,
      playbooks: modelLabProfile.playbooks,
      updatedAt: modelLabProfile.updatedAt,
    });

  return created;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const profile = await getOrCreateProfile(user.id);

    return NextResponse.json({
      profile: {
        id: profile.id,
        systemPrompt: profile.systemPrompt,
        engine: profile.engine,
        styleProfileEnabled: profile.styleProfileEnabled,
        knowledgeFiles: parseStoredList(profile.knowledgeFiles),
        playbooks: parseStoredList(profile.playbooks),
        updatedAt: profile.updatedAt,
      },
      storage: "database",
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ profile: getFallbackModelLabProfile(user.id), storage: "fallback_memory" });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = updateModelLabSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model lab payload" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(modelLabProfile)
      .set({
        systemPrompt: parsed.data.systemPrompt,
        engine: parsed.data.engine,
        styleProfileEnabled: parsed.data.styleProfileEnabled,
        knowledgeFiles: JSON.stringify(parsed.data.knowledgeFiles),
        playbooks: JSON.stringify(parsed.data.playbooks),
        updatedAt: new Date(),
      })
      .where(eq(modelLabProfile.userId, user.id))
      .returning({
        id: modelLabProfile.id,
        systemPrompt: modelLabProfile.systemPrompt,
        engine: modelLabProfile.engine,
        styleProfileEnabled: modelLabProfile.styleProfileEnabled,
        knowledgeFiles: modelLabProfile.knowledgeFiles,
        playbooks: modelLabProfile.playbooks,
        updatedAt: modelLabProfile.updatedAt,
      });

    if (!updated) {
      const profile = await getOrCreateProfile(user.id);
      const [createdOrUpdated] = await db
        .update(modelLabProfile)
        .set({
          systemPrompt: parsed.data.systemPrompt,
          engine: parsed.data.engine,
          styleProfileEnabled: parsed.data.styleProfileEnabled,
          knowledgeFiles: JSON.stringify(parsed.data.knowledgeFiles),
          playbooks: JSON.stringify(parsed.data.playbooks),
          updatedAt: new Date(),
        })
        .where(and(eq(modelLabProfile.id, profile.id), eq(modelLabProfile.userId, user.id)))
        .returning({
          id: modelLabProfile.id,
          systemPrompt: modelLabProfile.systemPrompt,
          engine: modelLabProfile.engine,
          styleProfileEnabled: modelLabProfile.styleProfileEnabled,
          knowledgeFiles: modelLabProfile.knowledgeFiles,
          playbooks: modelLabProfile.playbooks,
          updatedAt: modelLabProfile.updatedAt,
        });

      return NextResponse.json({
        profile: {
          ...createdOrUpdated,
          knowledgeFiles: parseStoredList(createdOrUpdated.knowledgeFiles),
          playbooks: parseStoredList(createdOrUpdated.playbooks),
        },
        storage: "database",
      });
    }

    return NextResponse.json({
      profile: {
        ...updated,
        knowledgeFiles: parseStoredList(updated.knowledgeFiles),
        playbooks: parseStoredList(updated.playbooks),
      },
      storage: "database",
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const profile = saveFallbackModelLabProfile(user.id, parsed.data);
    return NextResponse.json({ profile, storage: "fallback_memory" });
  }
}
