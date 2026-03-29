import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { xaiLog } from "@/db/schema";
import { getErrorMessage, isMissingTableError } from "@/lib/server/db-resilience";
import { getFallbackXaiLogs } from "@/lib/server/fallback-persistence";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const rows = await db
      .select({ taskId: xaiLog.taskId, modelVersion: xaiLog.modelVersion, createdAt: xaiLog.createdAt })
      .from(xaiLog)
      .where(eq(xaiLog.userId, user.id))
      .orderBy(desc(xaiLog.createdAt))
      .limit(40);

    return NextResponse.json({ lineage: rows, storage: "database" });
  } catch (error) {
    if (!isMissingTableError(error)) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    const rows = getFallbackXaiLogs(user.id).map((item) => ({
      taskId: item.taskId,
      modelVersion: item.modelVersion,
      createdAt: item.createdAt,
    }));
    return NextResponse.json({ lineage: rows, storage: "fallback_memory" });
  }
}
