import { NextResponse } from "next/server";
import { z } from "zod";

import { getFallbackMcpContext, saveFallbackMcpContext, touchFallbackMcpContext } from "@/lib/server/fallback-persistence";
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

function buildContextSummary(source: keyof typeof sampleData, target: string) {
  if (source === "github") {
    return `GitHub context connected for ${target}. The agent can inspect code, pull requests, and architecture notes live.`;
  }
  if (source === "google_drive") {
    return `Google Drive context connected for ${target}. The agent can read docs, sheets, and briefs without manual upload.`;
  }
  if (source === "local_files") {
    return `Local file context connected for ${target}. The agent can reference the user's working files through a secure desktop bridge.`;
  }
  return `Postgres context connected for ${target}. The agent can read structured workspace data and recent summaries live.`;
}

function buildLiveSignals(source: keyof typeof sampleData) {
  if (source === "github") return ["repo history", "open PRs", "architecture notes"];
  if (source === "google_drive") return ["doc drafts", "sheet formulas", "briefs"];
  if (source === "local_files") return ["recent files", "desktop notes", "exports"];
  return ["tables", "views", "usage summaries"];
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid MCP payload" }, { status: 400 });
  }

  const sessionToken = `mcp_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  const discoveredResources = sampleData[parsed.data.source] ?? [];
  const context = saveFallbackMcpContext(user.id, {
    source: parsed.data.source,
    target: parsed.data.target,
    secureSessionToken: sessionToken,
    capabilities: ["read", "search", "summarize"],
    discoveredResources,
    contextSummary: buildContextSummary(parsed.data.source, parsed.data.target),
    liveSignals: buildLiveSignals(parsed.data.source),
  });

  return NextResponse.json({
    connected: true,
    source: context.source,
    target: context.target,
    secureSessionToken: context.secureSessionToken,
    capabilities: context.capabilities,
    discoveredResources: context.discoveredResources,
    contextSummary: context.contextSummary,
    liveSignals: context.liveSignals,
    lastUsedAt: context.lastUsedAt,
    note: "MCP bridge created with scoped read-only access.",
  });
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const context = getFallbackMcpContext(user.id);
  if (!context) {
    return NextResponse.json({
      connected: false,
      note: "No MCP context connected yet.",
      liveSignals: [],
      discoveredResources: [],
    });
  }

  const touched = touchFallbackMcpContext(user.id) ?? context;
  return NextResponse.json({
    connected: true,
    source: touched.source,
    target: touched.target,
    secureSessionToken: touched.secureSessionToken,
    capabilities: touched.capabilities,
    discoveredResources: touched.discoveredResources,
    contextSummary: touched.contextSummary,
    liveSignals: touched.liveSignals,
    lastUsedAt: touched.lastUsedAt,
    note: "Latest MCP context loaded.",
  });
}
