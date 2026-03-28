import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiMessage } from "@/db/schema";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

function toCsv(rows: Array<{ id: string; role: string; createdAt: Date; content: string }>) {
  const header = "id,role,created_at,content\n";
  const body = rows
    .map((row) => {
      const escaped = `"${row.content.replace(/"/g, '""').replace(/\n/g, "\\n")}"`;
      return `${row.id},${row.role},${row.createdAt.toISOString()},${escaped}`;
    })
    .join("\n");
  return header + body;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  const rows = await db
    .select({
      id: aiMessage.id,
      role: aiMessage.role,
      createdAt: aiMessage.createdAt,
      content: aiMessage.content,
    })
    .from(aiMessage)
    .where(and(eq(aiMessage.userId, user.id), eq(aiMessage.role, "assistant")))
    .orderBy(desc(aiMessage.createdAt))
    .limit(300);

  const estimatedTokens = rows.reduce((sum, row) => sum + Math.ceil(row.content.length / 4), 0);
  const carbonKg = Number((estimatedTokens * 0.00000035).toFixed(6));

  if (format === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="ai-audit-trail-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    entries: rows,
    summary: {
      totalEntries: rows.length,
      estimatedTokens,
      energyImpactBadge: `${carbonKg} kg CO2e`,
    },
  });
}

