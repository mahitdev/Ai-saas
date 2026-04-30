import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { mcpContext } from "@/db/schema";

type McpSource = "google_drive" | "github" | "local_files" | "postgres";

type StoredMcpContext = {
  id: string;
  userId: string;
  source: McpSource;
  target: string;
  secureSessionToken: string;
  capabilities: string[];
  discoveredResources: string[];
  contextSummary: string;
  liveSignals: string[];
  connectedAt: string;
  lastUsedAt: string;
};

function parseJsonList(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mapContext(row: typeof mcpContext.$inferSelect): StoredMcpContext {
  return {
    id: row.id,
    userId: row.userId,
    source: row.source as McpSource,
    target: row.target,
    secureSessionToken: row.secureSessionToken,
    capabilities: parseJsonList(row.capabilities),
    discoveredResources: parseJsonList(row.discoveredResources),
    contextSummary: row.contextSummary,
    liveSignals: parseJsonList(row.liveSignals),
    connectedAt: row.connectedAt.toISOString(),
    lastUsedAt: row.lastUsedAt.toISOString(),
  };
}

export async function saveMcpContext(
  userId: string,
  context: Omit<StoredMcpContext, "id" | "userId" | "connectedAt" | "lastUsedAt">,
) {
  const [row] = await db
    .insert(mcpContext)
    .values({
      id: crypto.randomUUID(),
      userId,
      source: context.source,
      target: context.target,
      secureSessionToken: context.secureSessionToken,
      capabilities: JSON.stringify(context.capabilities),
      discoveredResources: JSON.stringify(context.discoveredResources),
      contextSummary: context.contextSummary,
      liveSignals: JSON.stringify(context.liveSignals),
      connectedAt: new Date(),
      lastUsedAt: new Date(),
    })
    .returning();
  return mapContext(row);
}

export async function getMcpContext(userId: string) {
  const [row] = await db.select().from(mcpContext).where(eq(mcpContext.userId, userId)).orderBy(desc(mcpContext.lastUsedAt)).limit(1);
  return row ? mapContext(row) : null;
}

export async function touchMcpContext(userId: string) {
  const existing = await getMcpContext(userId);
  if (!existing) return null;
  const [row] = await db.update(mcpContext).set({ lastUsedAt: new Date() }).where(eq(mcpContext.id, existing.id)).returning();
  return row ? mapContext(row) : null;
}

export type { StoredMcpContext, McpSource };
