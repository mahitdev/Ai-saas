import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const orchestrateSchema = z.object({
  task: z.string().trim().min(1).max(4000),
  agents: z.array(z.enum(["researcher", "strategist", "writer", "compliance"])).min(1).max(8),
  agentProfiles: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(64),
        type: z.enum(["researcher", "strategist", "writer", "compliance"]),
        canDraft: z.boolean().default(true),
        canSend: z.boolean().default(false),
        canUseMcp: z.boolean().default(false),
        canUseGithub: z.boolean().default(false),
      }),
    )
    .optional(),
  checkpoints: z.array(z.number().int().min(0).max(7)).optional().default([]),
  executionId: z.string().optional(),
  approved: z.boolean().optional().default(false),
});

type AgentProfile = {
  id: string;
  type: "researcher" | "strategist" | "writer" | "compliance";
  canDraft: boolean;
  canSend: boolean;
  canUseMcp: boolean;
  canUseGithub: boolean;
};

type ExecutionState = {
  id: string;
  userId: string;
  task: string;
  agents: Array<"researcher" | "strategist" | "writer" | "compliance">;
  agentProfiles: AgentProfile[];
  handoffs: Array<{ agent: string; startedAt: string; finishedAt: string; output: string; trace: string }>;
  baton: string;
  cursor: number;
  checkpoints: number[];
  gatewayEvents: Array<{ agentId: string; tool: string; target: string; status: "allowed" | "blocked" }>;
  shadowWarnings: string[];
};

const executionStore = new Map<string, ExecutionState>();

function runAgent(agent: "researcher" | "strategist" | "writer" | "compliance", baton: string) {
  if (agent === "researcher") {
    return `Research Notes:\n- Key context about: ${baton}\n- Market trend snapshot\n- Risks and opportunities`;
  }
  if (agent === "strategist") {
    return `Strategy Map:\n- Objective: ${baton}\n- Priority sequence: research, decision, execution\n- Risks: scope drift, approvals, timing\n- Next handoff: turn the brief into a clear execution plan`;
  }
  if (agent === "writer") {
    return `Draft Output:\n${baton}\n\nFinal narrative:\nThis plan addresses user intent with clear actions and timeline.`;
  }
  const riskFlags = /(guaranteed|secret|bypass|hack|illegal)/i.test(baton) ? "flagged" : "clear";
  return `Compliance Review (${riskFlags}):\n${baton}\n\nChecks: policy alignment, safety language, legal tone.`;
}

function traceSummary(agent: "researcher" | "strategist" | "writer" | "compliance", baton: string) {
  if (agent === "researcher") {
    return `Researched the goal and surfaced the most relevant context for the next agent.`;
  }
  if (agent === "strategist") {
    return `Converted research into an execution plan with priorities, sequence, and risks.`;
  }
  if (agent === "writer") {
    return `Turned the plan into a user-facing draft or deliverable.`;
  }
  return /flagged/i.test(baton)
    ? `Reviewed the output, flagged potential policy risks, and prepared a safe version.`
    : `Validated the output against policy and safety rules before the final handoff.`;
}

function defaultProfile(type: AgentProfile["type"], index: number): AgentProfile {
  return {
    id: `${type}-${index}`,
    type,
    canDraft: true,
    canSend: type === "compliance",
    canUseMcp: type !== "compliance",
    canUseGithub: type === "researcher" || type === "strategist" || type === "writer",
  };
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = orchestrateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid orchestrator payload" }, { status: 400 });
  }

  let state: ExecutionState;
  if (parsed.data.executionId) {
    const existing = executionStore.get(parsed.data.executionId);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }
    state = existing;
  } else {
    const id = `exec_${crypto.randomUUID().slice(0, 8)}`;
    const agentProfiles = parsed.data.agentProfiles ?? parsed.data.agents.map((type, index) => defaultProfile(type, index));
    state = {
      id,
      userId: user.id,
      task: parsed.data.task,
      agents: parsed.data.agents,
      agentProfiles,
      handoffs: [],
      baton: parsed.data.task,
      cursor: 0,
      checkpoints: parsed.data.checkpoints,
      gatewayEvents: [],
      shadowWarnings: [],
    };
    if (agentProfiles.some((profile) => profile.canSend && !profile.canUseMcp)) {
      state.shadowWarnings.push("Shadow AI protection: one or more agents can send output without external context access.");
    }
    executionStore.set(id, state);
  }

  for (let index = state.cursor; index < state.agents.length; index += 1) {
    if (state.checkpoints.includes(index) && !parsed.data.approved) {
      state.cursor = index;
      executionStore.set(state.id, state);
      return NextResponse.json({
        paused: true,
        reason: "human_approval_required",
        executionId: state.id,
        pendingAgent: state.agents[index],
        handoffs: state.handoffs,
      });
    }

    if (state.checkpoints.includes(index) && parsed.data.approved) {
      parsed.data.approved = false;
    }

    const agent = state.agents[index];
    const profile = state.agentProfiles[index] ?? defaultProfile(agent, index);
    const startedAt = new Date().toISOString();
    state.gatewayEvents.push(
      ...(profile.canUseMcp
        ? [{ agentId: profile.id, tool: "MCP", target: "workspace context", status: "allowed" as const }]
        : [{ agentId: profile.id, tool: "MCP", target: "workspace context", status: "blocked" as const }]),
    );
    state.gatewayEvents.push(
      ...(profile.canUseGithub
        ? [{ agentId: profile.id, tool: "GitHub", target: "repository", status: "allowed" as const }]
        : [{ agentId: profile.id, tool: "GitHub", target: "repository", status: "blocked" as const }]),
    );
    state.baton = runAgent(agent, state.baton);
    const finishedAt = new Date().toISOString();
    state.handoffs.push({ agent, startedAt, finishedAt, output: state.baton, trace: traceSummary(agent, state.baton) });
    state.cursor = index + 1;
  }

  executionStore.delete(state.id);

  return NextResponse.json({
    result: state.baton,
    handoffs: state.handoffs,
    agentProfiles: state.agentProfiles,
    gatewayEvents: state.gatewayEvents.slice(-12),
    shadowWarnings: state.shadowWarnings,
    traces: state.handoffs.map((handoff, index) => ({
      step: index + 1,
      agent: handoff.agent,
      summary: handoff.trace,
    })),
    executionId: state.id,
    paused: false,
  });
}
