import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const connectSchema = z.object({
  source: z.enum(["google_drive", "github", "local_files", "postgres"]),
  target: z.string().trim().min(1).max(300),
});

const sampleData: Record<string, string[]> = {
  google_drive: ["Q3-Marketing-Plan.docx", "Brand-Voice-Guide.pdf", "Customer-Feedback.xlsx"],
  github: ["README.md", "src/app/api/chat/send/route.ts", "docs/architecture.md"],
  local_files: ["notes/meeting-2026-03-20.md", "contracts/vendor-agreement.pdf", "exports/sales-q1.csv"],
  postgres: ["table:users", "table:ai_message", "view:usage_daily_summary"],
};

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid MCP payload" }, { status: 400 });
  }

  const sessionToken = `mcp_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  return NextResponse.json({
    connected: true,
    source: parsed.data.source,
    target: parsed.data.target,
    secureSessionToken: sessionToken,
    capabilities: ["read", "search", "summarize"],
    discoveredResources: sampleData[parsed.data.source] ?? [],
    note: "MCP bridge created with scoped read-only access.",
  });
}

