"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AgentType = "researcher" | "writer" | "compliance";

const AGENT_LABELS: Record<AgentType, string> = {
  researcher: "Researcher",
  writer: "Writer",
  compliance: "Compliance",
};

export function OrchestratorPage() {
  const [task, setTask] = useState("");
  const [agents, setAgents] = useState<Array<{ id: string; type: AgentType }>>([
    { id: "a1", type: "researcher" },
    { id: "a2", type: "writer" },
    { id: "a3", type: "compliance" },
  ]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<Array<{ agent: string; startedAt: string; finishedAt: string; output: string }>>([]);
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);
  const [hitlEnabled, setHitlEnabled] = useState(true);
  const [checkpoints, setCheckpoints] = useState<number[]>([1]);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pendingAgent, setPendingAgent] = useState<string | null>(null);

  function addAgent(type: AgentType) {
    setAgents((prev) => [...prev, { id: crypto.randomUUID(), type }]);
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
      setPendingAgent(null);
    }
    try {
      const response = await fetch("/api/agents/orchestrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task: task.trim() || "Continue workflow",
          agents: agents.map((a) => a.type),
          checkpoints: hitlEnabled ? checkpoints : [],
          executionId: executionId ?? undefined,
          approved: approve,
        }),
      });
      if (!response.ok) throw new Error("Failed to run orchestrator");
      const payload = (await response.json()) as {
        result: string;
        handoffs: Array<{ agent: string; startedAt: string; finishedAt: string; output: string }>;
        paused?: boolean;
        reason?: string;
        executionId?: string;
        pendingAgent?: string;
      };
      if (payload.paused) {
        setExecutionId(payload.executionId ?? null);
        setPendingAgent(payload.pendingAgent ?? "unknown");
        setHandoffs(payload.handoffs ?? []);
        setResult("Execution paused for human approval checkpoint.");
        return;
      }
      setExecutionId(null);
      setPendingAgent(null);
      setResult(payload.result);
      setHandoffs(payload.handoffs);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Agent Orchestrator</h1>
          <p className="text-sm text-slate-400">Create a clean workflow, run it, and review each handoff with the final output.</p>
        </div>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Workflow Setup</CardTitle>
            <CardDescription className="text-slate-400">Start with a task, then drag blocks to reorder the agent sequence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="What should the squad accomplish?"
              className="h-11 border-slate-700 bg-slate-900 text-slate-100"
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => addAgent("researcher")}>
                + Researcher
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

            <Button
              type="button"
              variant={hitlEnabled ? "default" : "outline"}
              className={hitlEnabled ? "bg-amber-500/20 text-amber-100" : "border-slate-700 bg-slate-900 text-slate-200"}
              onClick={() => setHitlEnabled((current) => !current)}
            >
              {hitlEnabled ? "HITL: ON" : "HITL: OFF"}
            </Button>

            <Button className="h-11 w-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void runWorkflow()} disabled={running}>
              {running ? "Running..." : "Run Agent Squad"}
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
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-300">{handoff.output}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-base">Final Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="min-h-52 overflow-auto rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">{result || "Run the workflow to see result."}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
