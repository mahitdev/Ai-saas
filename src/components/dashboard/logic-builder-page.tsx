"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LogicBlockType = "web_search" | "summarize" | "draft_email";

export function LogicBuilderPage() {
  const [logicBlocks, setLogicBlocks] = useState<Array<{ id: string; type: LogicBlockType }>>([
    { id: "b1", type: "web_search" },
    { id: "b2", type: "summarize" },
  ]);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [workflowOutput, setWorkflowOutput] = useState("");

  function addLogicBlock(type: LogicBlockType) {
    setLogicBlocks((previous) => [...previous, { id: crypto.randomUUID(), type }]);
  }

  function moveLogicBlock(fromId: string, toId: string) {
    setLogicBlocks((previous) => {
      const fromIndex = previous.findIndex((block) => block.id === fromId);
      const toIndex = previous.findIndex((block) => block.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return previous;
      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function runLogicWorkflow() {
    if (!workflowPrompt.trim()) return;
    let output = workflowPrompt.trim();
    for (const block of logicBlocks) {
      if (block.type === "web_search") output = `Search findings:\n- Insight 1\n- Insight 2\n- ${output}`;
      else if (block.type === "summarize") output = `Summary:\n${output.slice(0, 250)}...`;
      else if (block.type === "draft_email") output = `Subject: Update\n\nHi Team,\n\n${output}\n\nBest regards,`;
    }
    setWorkflowOutput(output);
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Workflow Builder</CardTitle>
            <CardDescription className="text-slate-400">
              Drag, reorder, and run multi-step AI workflows in a dedicated workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => addLogicBlock("web_search")}>+ Web Search</Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => addLogicBlock("summarize")}>+ Summarize</Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => addLogicBlock("draft_email")}>+ Draft Email</Button>
            </div>
            <div className="space-y-2">
              {logicBlocks.map((block, index) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => setDraggingBlockId(block.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingBlockId) moveLogicBlock(draggingBlockId, block.id);
                    setDraggingBlockId(null);
                  }}
                  className="cursor-move rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                >
                  {index + 1}. {block.type.replace("_", " ")}
                </div>
              ))}
            </div>
            <Input
              value={workflowPrompt}
              onChange={(event) => setWorkflowPrompt(event.target.value)}
              placeholder="Workflow input..."
              className="border-slate-700 bg-slate-900 text-slate-100"
            />
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={runLogicWorkflow}>
              Run Workflow
            </Button>
            <pre className="min-h-44 overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">
              {workflowOutput || "Workflow output appears here."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
