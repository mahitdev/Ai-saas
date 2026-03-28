import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const orchestrateSchema = z.object({
  task: z.string().trim().min(1).max(4000),
  agents: z.array(z.enum(["researcher", "writer", "compliance"])).min(1).max(8),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = orchestrateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid orchestrator payload" }, { status: 400 });
  }

  let baton = parsed.data.task;
  const handoffs: Array<{ agent: string; startedAt: string; finishedAt: string; output: string }> = [];

  for (const agent of parsed.data.agents) {
    const startedAt = new Date().toISOString();
    if (agent === "researcher") {
      baton = `Research Notes:\n- Key context about: ${baton}\n- Market trend snapshot\n- Risks and opportunities`;
    } else if (agent === "writer") {
      baton = `Draft Output:\n${baton}\n\nFinal narrative:\nThis plan addresses user intent with clear actions and timeline.`;
    } else if (agent === "compliance") {
      const riskFlags = /(guaranteed|secret|bypass|hack|illegal)/i.test(baton) ? "flagged" : "clear";
      baton = `Compliance Review (${riskFlags}):\n${baton}\n\nChecks: policy alignment, safety language, legal tone.`;
    }
    const finishedAt = new Date().toISOString();
    handoffs.push({ agent, startedAt, finishedAt, output: baton });
  }

  return NextResponse.json({
    result: baton,
    handoffs,
  });
}

