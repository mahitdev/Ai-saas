import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { runSystemAgent } from "@/lib/server/live-analysis";

const systemAgentSchema = z.object({
  goal: z.string().trim().min(3).max(4000),
  execute: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = systemAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid system agent payload" }, { status: 400 });
  }

  const run = await runSystemAgent(user.id, parsed.data.goal, parsed.data.execute);

  return NextResponse.json({
    systemAgent: {
      identity: `agent:${user.id.slice(0, 8)}`,
      scope: "workspace analysis and follow-up task generation",
      goal: parsed.data.goal,
    },
    ...run,
    executed: Boolean(run.executedTask),
  });
}
