import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { desktopAgentSession } from "@/db/schema";

type DesktopCommand = {
  action: "open_app" | "focus_window" | "capture_clipboard" | "run_hotkey" | "inspect_context";
  target: string;
  platform: "windows" | "macos" | "linux" | "browser";
  goal: string;
};

type DesktopAgentSession = {
  id: string;
  userId: string;
  platform: DesktopCommand["platform"];
  goal: string;
  action: DesktopCommand["action"];
  bridgeToken: string;
  instructions: string[];
  safetyNotes: string[];
  command: DesktopCommand;
  result: string | null;
  error: string | null;
  status: "pending" | "ready" | "running" | "complete";
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(value: string, fallback: T) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapSession(row: typeof desktopAgentSession.$inferSelect): DesktopAgentSession {
  return {
    id: row.id,
    userId: row.userId,
    platform: row.platform as DesktopCommand["platform"],
    goal: row.goal,
    action: row.action as DesktopCommand["action"],
    bridgeToken: row.bridgeToken,
    instructions: parseJson<string[]>(row.instructions, []),
    safetyNotes: parseJson<string[]>(row.safetyNotes, []),
    command: parseJson<DesktopCommand>(row.command, {
      action: row.action as DesktopCommand["action"],
      target: "workspace",
      platform: row.platform as DesktopCommand["platform"],
      goal: row.goal,
    }),
    result: row.result,
    error: row.error,
    status: row.status as DesktopAgentSession["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function addDesktopAgentSession(userId: string, session: Omit<DesktopAgentSession, "id" | "userId" | "createdAt" | "updatedAt">) {
  const [row] = await db
    .insert(desktopAgentSession)
    .values({
      id: crypto.randomUUID(),
      userId,
      platform: session.platform,
      goal: session.goal,
      action: session.action,
      bridgeToken: session.bridgeToken,
      instructions: JSON.stringify(session.instructions),
      safetyNotes: JSON.stringify(session.safetyNotes),
      command: JSON.stringify(session.command),
      result: session.result,
      error: session.error,
      status: session.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return mapSession(row);
}

export async function getDesktopAgentSession(userId: string, sessionId: string) {
  const [row] = await db
    .select()
    .from(desktopAgentSession)
    .where(and(eq(desktopAgentSession.id, sessionId), eq(desktopAgentSession.userId, userId)))
    .limit(1);
  return row && row.userId === userId ? mapSession(row) : null;
}

export async function listDesktopAgentSessions(userId: string) {
  const rows = await db
    .select()
    .from(desktopAgentSession)
    .where(eq(desktopAgentSession.userId, userId))
    .orderBy(desc(desktopAgentSession.updatedAt))
    .limit(20);
  return rows.map(mapSession);
}

export async function updateDesktopAgentSession(
  userId: string,
  sessionId: string,
  updates: Partial<Pick<DesktopAgentSession, "status" | "result" | "error">>,
) {
  const [row] = await db
    .update(desktopAgentSession)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(desktopAgentSession.id, sessionId), eq(desktopAgentSession.userId, userId)))
    .returning();
  return row && row.userId === userId ? mapSession(row) : null;
}

export type { DesktopAgentSession, DesktopCommand };
