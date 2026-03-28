import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiMemory, libraryAsset, voiceAction } from "@/db/schema";

type VoiceSource = "phone_call" | "mobile_widget";

export function parseVoiceAction(transcript: string) {
  const cleaned = transcript.trim();
  const addToLibraryMatch =
    cleaned.match(/add (.+?) to my library/i) ||
    cleaned.match(/save (.+?) to (?:the )?library/i) ||
    cleaned.match(/note (.+?) in my library/i);

  if (addToLibraryMatch?.[1]) {
    return {
      actionType: "add_library_note" as const,
      content: addToLibraryMatch[1].trim(),
      title: "Voice Note",
    };
  }

  return {
    actionType: "log_voice_note" as const,
    content: cleaned,
    title: "Voice Capture",
  };
}

export async function runVoiceAction(params: {
  userId: string;
  transcript: string;
  source: VoiceSource;
}) {
  const parsed = parseVoiceAction(params.transcript);

  const [asset] = await db
    .insert(libraryAsset)
    .values({
      id: crypto.randomUUID(),
      userId: params.userId,
      title: parsed.title,
      content: parsed.content,
      source: params.source,
      tags: parsed.actionType === "add_library_note" ? "voice,library" : "voice,capture",
    })
    .returning({
      id: libraryAsset.id,
      title: libraryAsset.title,
      content: libraryAsset.content,
      createdAt: libraryAsset.createdAt,
    });

  const [existingMemory] = await db
    .select({ id: aiMemory.id, summary: aiMemory.summary })
    .from(aiMemory)
    .where(eq(aiMemory.userId, params.userId))
    .limit(1);

  const memoryLine = `Voice (${new Date().toISOString().slice(0, 10)}): ${parsed.content}`;
  if (!existingMemory) {
    await db.insert(aiMemory).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      summary: memoryLine,
    });
  } else {
    const merged = [existingMemory.summary, memoryLine].filter(Boolean).join("\n").slice(-4000);
    await db
      .update(aiMemory)
      .set({ summary: merged, updatedAt: new Date() })
      .where(and(eq(aiMemory.id, existingMemory.id), eq(aiMemory.userId, params.userId)));
  }

  await db.insert(voiceAction).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    source: params.source,
    transcript: params.transcript,
    actionType: parsed.actionType,
    actionPayload: JSON.stringify({ assetId: asset.id, title: asset.title }),
    status: "completed",
  });

  return {
    actionType: parsed.actionType,
    message:
      parsed.actionType === "add_library_note"
        ? "Added to Library from voice command."
        : "Voice note captured and saved.",
    asset,
  };
}
