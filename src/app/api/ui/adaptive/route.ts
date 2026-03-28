import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const adaptiveSchema = z.object({
  prompt: z.string().trim().max(3000).optional(),
});

function detectIntent(prompt: string) {
  const lower = prompt.toLowerCase();
  if (/budget|profit|revenue|expense|forecast|roi|cost/.test(lower)) return "budget_analysis";
  if (/debug|error|stack|api|code|build|deploy/.test(lower)) return "developer_ops";
  if (/team|roadmap|quarter|strategy|kpi|report/.test(lower)) return "manager_overview";
  return "general_chat";
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = adaptiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid adaptive payload" }, { status: 400 });
  }

  const role = /dev|engineer|tech|code/i.test(user.email) ? "developer" : "manager";
  const intent = detectIntent(parsed.data.prompt ?? "");

  return NextResponse.json({
    role,
    intent,
    components:
      intent === "budget_analysis"
        ? ["budget_grid", "roi_widget", "topic_summary"]
        : role === "developer"
          ? ["log_stream", "code_block", "api_health"]
          : ["kpi_cards", "roi_widget", "team_summary"],
  });
}
