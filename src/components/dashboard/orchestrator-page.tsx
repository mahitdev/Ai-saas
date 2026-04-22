"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type AgentType = "researcher" | "strategist" | "writer" | "compliance";
type AgentPermission = {
  canDraft: boolean;
  canSend: boolean;
  canUseMcp: boolean;
  canUseGithub: boolean;
};
type AgentRow = { id: string; type: AgentType; permissions: AgentPermission };

const AGENT_LABELS: Record<AgentType, string> = {
  researcher: "Researcher",
  strategist: "Strategist",
  writer: "Writer",
  compliance: "Compliance",
};

function defaultPermissions(type: AgentType): AgentPermission {
  return {
    canDraft: true,
    canSend: type === "compliance",
    canUseMcp: type !== "compliance",
    canUseGithub: type === "researcher" || type === "strategist" || type === "writer",
  };
}

export function OrchestratorPage() {
  const [task, setTask] = useState("");
  const [agents, setAgents] = useState<AgentRow[]>([
    { id: "a1", type: "researcher", permissions: defaultPermissions("researcher") },
    { id: "a2", type: "strategist", permissions: defaultPermissions("strategist") },
    { id: "a3", type: "writer", permissions: defaultPermissions("writer") },
    { id: "a4", type: "compliance", permissions: defaultPermissions("compliance") },
  ]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<Array<{ agent: string; startedAt: string; finishedAt: string; output: string; trace: string }>>([]);
  const [traces, setTraces] = useState<Array<{ step: number; agent: string; summary: string }>>([]);
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);
  const [hitlEnabled, setHitlEnabled] = useState(true);
  const [checkpoints, setCheckpoints] = useState<number[]>([1]);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pendingAgent, setPendingAgent] = useState<string | null>(null);
  const [gatewayEvents, setGatewayEvents] = useState<Array<{ agentId: string; tool: string; target: string; status: "allowed" | "blocked" }>>([]);
  const [agentRegistry, setAgentRegistry] = useState<Array<{ id: string; type: AgentType; permissions: AgentPermission }>>([]);
  const [shadowWarnings, setShadowWarnings] = useState<string[]>([]);

  function addAgent(type: AgentType) {
    setAgents((prev) => [...prev, { id: crypto.randomUUID(), type, permissions: defaultPermissions(type) }]);
  }

  function applyWorkflowPreset() {
    const goal = task.toLowerCase();
    const nextAgents: AgentType[] = goal.includes("campaign") || goal.includes("marketing")
      ? ["researcher", "strategist", "writer", "compliance"]
      : goal.includes("code") || goal.includes("bug") || goal.includes("build")
        ? ["researcher", "strategist", "writer", "compliance"]
        : goal.includes("invoice") || goal.includes("finance") || goal.includes("budget")
          ? ["researcher", "strategist", "compliance"]
          : ["researcher", "strategist", "writer", "compliance"];

    setAgents(nextAgents.map((type) => ({ id: crypto.randomUUID(), type, permissions: defaultPermissions(type) })));
    setCheckpoints(goal.includes("approve") || goal.includes("spend") || goal.includes("send") ? [2] : [1]);
  }

  function togglePermission(agentId: string, permission: keyof AgentPermission) {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? { ...agent, permissions: { ...agent.permissions, [permission]: !agent.permissions[permission] } }
          : agent,
      ),
    );
  }

  function moveAgent(fromId: string, toId: string) {
    setAgents((prev) => {
      const from = prev.findIndex((a) => a.id === fromId);
      const to = prev.findIndex((a) => a.id === toId);
      if (from < 0 || to < 0 || from === to) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  async function runWorkflow(approve = false) {
    if ((!task.trim() && !executionId) || running) return;
    setRunning(true);
    if (!approve) {
      setResult("");
      setHandoffs([]);
      setTraces([]);
      setPendingAgent(null);
    }
    try {
      const response = await fetch("/api/agents/orchestrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task: task.trim() || "Continue workflow",
          agents: agents.map((a) => a.type),
          agentProfiles: agents.map((a) => ({ id: a.id, type: a.type, ...a.permissions })),
          checkpoints: hitlEnabled ? checkpoints : [],
          executionId: executionId ?? undefined,
          approved: approve,
        }),
      });
      if (!response.ok) throw new Error("Failed to run orchestrator");
      const payload = (await response.json()) as {
        result: string;
        handoffs: Array<{ agent: string; startedAt: string; finishedAt: string; output: string; trace: string }>;
        traces?: Array<{ step: number; agent: string; summary: string }>;
        gatewayEvents?: Array<{ agentId: string; tool: string; target: string; status: "allowed" | "blocked" }>;
        agentProfiles?: Array<{ id: string; type: AgentType; canDraft: boolean; canSend: boolean; canUseMcp: boolean; canUseGithub: boolean }>;
        shadowWarnings?: string[];
        paused?: boolean;
        reason?: string;
        executionId?: string;
        pendingAgent?: string;
      };
      if (payload.paused) {
        setExecutionId(payload.executionId ?? null);
        setPendingAgent(payload.pendingAgent ?? "unknown");
        setHandoffs(payload.handoffs ?? []);
        setTraces(payload.traces ?? []);
        setGatewayEvents(payload.gatewayEvents ?? []);
        setAgentRegistry(
          (payload.agentProfiles ?? []).map((agent) => ({
            id: agent.id,
            type: agent.type,
            permissions: {
              canDraft: agent.canDraft,
              canSend: agent.canSend,
              canUseMcp: agent.canUseMcp,
              canUseGithub: agent.canUseGithub,
            },
          })),
        );
        setShadowWarnings(payload.shadowWarnings ?? []);
        setResult("Execution paused for human approval checkpoint.");
        return;
      }
      setExecutionId(null);
      setPendingAgent(null);
      setResult(payload.result);
      setHandoffs(payload.handoffs);
      setTraces(payload.traces ?? []);
      setGatewayEvents(payload.gatewayEvents ?? []);
      setAgentRegistry(
        (payload.agentProfiles ?? []).map((agent) => ({
          id: agent.id,
          type: agent.type,
          permissions: {
            canDraft: agent.canDraft,
            canSend: agent.canSend,
            canUseMcp: agent.canUseMcp,
            canUseGithub: agent.canUseGithub,
          },
        })),
      );
      setShadowWarnings(payload.shadowWarnings ?? []);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Multi-Agent Orchestrator</h1>
          <p className="text-sm text-slate-400">Create a workflow, run it, and review each handoff with the final output.</p>
        </div>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Workflow Setup</CardTitle>
            <CardDescription className="text-slate-400">Start with a goal, then shape the agent identities, checkpoints, and handoffs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="What should the squad accomplish?"
              className="h-11 border-slate-700 bg-slate-900 text-slate-100"
            />

            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Agent Identity & Permissions</p>
              <div className="mt-3 space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{AGENT_LABELS[agent.type]}</p>
                        <p className="text-xs text-slate-400">Identity: {agent.id}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-slate-700 bg-slate-950 text-slate-100">
                          <DropdownMenuCheckboxItem checked={agent.permissions.canDraft} onCheckedChange={() => togglePermission(agent.id, "canDraft")}>
                            Can draft
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem checked={agent.permissions.canSend} onCheckedChange={() => togglePermission(agent.id, "canSend")}>
                            Can send
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem checked={agent.permissions.canUseMcp} onCheckedChange={() => togglePermission(agent.id, "canUseMcp")}>
                            MCP access
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem checked={agent.permissions.canUseGithub} onCheckedChange={() => togglePermission(agent.id, "canUseGithub")}>
                            GitHub access
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setTask(`Delegate scoped work to ${agent.id}`)}>
                            Delegate scoped task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">Draft: {agent.permissions.canDraft ? "allowed" : "locked"}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">Send: {agent.permissions.canSend ? "approved" : "approval required"}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">MCP: {agent.permissions.canUseMcp ? "allowed" : "locked"}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">GitHub: {agent.permissions.canUseGithub ? "allowed" : "locked"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={applyWorkflowPreset}>
                Auto-build Workflow
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => addAgent("researcher")}>
                + Researcher
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => addAgent("strategist")}>
                + Strategist
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => addAgent("writer")}>
                + Writer
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => addAgent("compliance")}>
                + Compliance
              </Button>
            </div>

            <div className="space-y-2">
              {agents.map((agent, index) => (
                <div
                  key={agent.id}
                  draggable
                  onDragStart={() => setDraggingId(agent.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId) moveAgent(draggingId, agent.id);
                    setDraggingId(null);
                  }}
                  className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm"
                >
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-cyan-200">{index + 1}</span>
                  <span className="text-slate-200">{AGENT_LABELS[agent.type]}</span>
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-[10px] ${
                      checkpoints.includes(index)
                        ? "border border-amber-500/60 bg-amber-500/15 text-amber-200"
                        : "border border-slate-700 bg-slate-900 text-slate-400"
                    }`}
                    onClick={() =>
                      setCheckpoints((previous) =>
                        previous.includes(index)
                          ? previous.filter((item) => item !== index)
                          : [...previous, index].sort((a, b) => a - b),
                      )
                    }
                  >
                    {checkpoints.includes(index) ? "HITL Checkpoint" : "Add Checkpoint"}
                  </button>
                  <span className="ml-auto text-xs text-slate-500">Drag to reorder</span>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-300">
              <p>Visual Workflow Designer</p>
              <p className="mt-1">
                {agents.map((agent) => AGENT_LABELS[agent.type]).join(" -> ")}
              </p>
            </div>

            <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Live map</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {agents.map((agent, index) => (
                  <div key={agent.id} className="rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-xs">
                    <p className="font-semibold text-slate-100">{AGENT_LABELS[agent.type]}</p>
                    <p className="mt-1 text-slate-400">Step {index + 1}</p>
                    <p className="mt-2 text-slate-300">
                      {index === 0
                        ? "Receives the goal"
                        : index === agents.length - 1
                          ? "Delivers the final result"
                          : "Receives the baton"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Agent Gateway</p>
              <div className="mt-3 space-y-2">
                {gatewayEvents.length === 0 ? (
                  <p className="text-xs text-slate-400">External tool interactions will appear here.</p>
                ) : (
                  gatewayEvents.slice(-6).map((event, index) => (
                    <div key={`${event.agentId}-${event.tool}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-100">{event.tool}</p>
                        <p className="text-slate-400">{event.agentId} · {event.target}</p>
                      </div>
                      <span className={event.status === "allowed" ? "text-emerald-300" : "text-amber-300"}>{event.status}</span>
                    </div>
                  ))
                )}
              </div>
              {shadowWarnings.length > 0 ? (
                <p className="mt-3 text-xs text-amber-200">Shadow AI protection: {shadowWarnings.join(" ")}</p>
              ) : (
                <p className="mt-3 text-xs text-slate-400">Shadow AI protection active. No unapproved plugins detected in this run.</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Agent registry: {agentRegistry.length} identities tracked across the control tower.
              </p>
            </div>

            <Button
              type="button"
              variant={hitlEnabled ? "default" : "outline"}
              className={hitlEnabled ? "bg-amber-500/20 text-amber-100" : "border-slate-700 bg-slate-900 text-slate-200"}
              onClick={() => setHitlEnabled((current) => !current)}
            >
              {hitlEnabled ? "HITL Checkpoints: ON" : "HITL Checkpoints: OFF"}
            </Button>

            <Button className="h-11 w-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void runWorkflow()} disabled={running}>
              {running ? "Running..." : "Run Agentic Workflow"}
            </Button>
            {pendingAgent ? (
              <Button
                className="h-11 w-full bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                onClick={() => void runWorkflow(true)}
                disabled={running}
              >
                Approve & Continue ({pendingAgent})
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-base">Handoff Timeline</CardTitle>
              <CardDescription className="text-slate-400">A2A handoffs stay automatic until the sequence reaches a checkpoint.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {handoffs.length === 0 ? (
                <p className="text-sm text-slate-400">No handoffs yet.</p>
              ) : (
                handoffs.map((handoff, idx) => (
                  <div key={`${handoff.agent}-${idx}`} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs">
                    <p className="font-semibold text-cyan-200">{handoff.agent}</p>
                    <p className="text-slate-400">
                      {new Date(handoff.startedAt).toLocaleTimeString()} {" -> "} {new Date(handoff.finishedAt).toLocaleTimeString()}
                    </p>
                    <p className="mt-1 text-slate-300">{handoff.trace}</p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-300">{handoff.output}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-base">Reasoning Trace</CardTitle>
              <CardDescription className="text-slate-400">High-level summaries of how the task moved from one agent to the next.</CardDescription>
            </CardHeader>
            <CardContent>
              {traces.length === 0 ? (
                <pre className="min-h-52 overflow-auto rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">{result || "Run the workflow to see result."}</pre>
              ) : (
                <div className="space-y-2">
                  {traces.map((trace) => (
                    <div key={`${trace.agent}-${trace.step}`} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">
                      <p className="font-semibold text-cyan-200">
                        Step {trace.step}: {trace.agent}
                      </p>
                      <p className="mt-1 text-slate-300">{trace.summary}</p>
                    </div>
                  ))}
                  <pre className="overflow-auto rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">{result || "Run the workflow to see result."}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
