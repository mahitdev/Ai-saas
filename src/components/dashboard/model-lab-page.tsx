"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModelLabProfile = {
  id: string;
  systemPrompt: string;
  engine: "flash" | "pro";
  styleProfileEnabled: boolean;
  knowledgeFiles: string[];
  playbooks: string[];
  updatedAt: string;
};

export function ModelLabPage() {
  const [systemPrompt, setSystemPrompt] = useState("Always respond in a structured, practical format.");
  const [engine, setEngine] = useState<"flash" | "pro">("flash");
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([]);
  const [styleProfileEnabled, setStyleProfileEnabled] = useState(false);
  const [industry, setIndustry] = useState<"hr" | "legal" | "finance" | "general">("general");
  const [domainInput, setDomainInput] = useState("Review this policy document for risk and required actions.");
  const [domainOutput, setDomainOutput] = useState("");
  const [playbooks, setPlaybooks] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<"auto" | "spreadsheet" | "code" | "docs" | "chat">("auto");
  const [status, setStatus] = useState("Loading Model Lab profile...");

  const predictedLayout = useMemo<"spreadsheet" | "code" | "docs" | "chat">(() => {
    const input = `${domainInput} ${systemPrompt} ${playbooks.join(" ")}`.toLowerCase();
    if (layoutMode !== "auto") return layoutMode;
    if (/spreadsheet|table|invoice|budget|csv|finance/.test(input)) return "spreadsheet";
    if (/code|api|bug|pull request|typescript|javascript|deploy/.test(input)) return "code";
    if (/doc|policy|contract|brief|report|pdf/.test(input)) return "docs";
    return "chat";
  }, [domainInput, layoutMode, playbooks, systemPrompt]);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/model-lab", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { profile?: ModelLabProfile; error?: string } | null;

      if (!response.ok || !payload?.profile) {
        setStatus(payload?.error ?? "Failed to load profile.");
        return;
      }

      setSystemPrompt(payload.profile.systemPrompt);
      setEngine(payload.profile.engine);
      setStyleProfileEnabled(payload.profile.styleProfileEnabled);
      setKnowledgeFiles(payload.profile.knowledgeFiles);
      setPlaybooks(payload.profile.playbooks);
      setStatus("Model Lab synced.");
    }

    void loadProfile();
  }, []);

  async function persistProfile(next: {
    systemPrompt?: string;
    engine?: "flash" | "pro";
    styleProfileEnabled?: boolean;
    knowledgeFiles?: string[];
    playbooks?: string[];
  }) {
    const payload = {
      systemPrompt: next.systemPrompt ?? systemPrompt,
      engine: next.engine ?? engine,
      styleProfileEnabled: next.styleProfileEnabled ?? styleProfileEnabled,
      knowledgeFiles: next.knowledgeFiles ?? knowledgeFiles,
      playbooks: next.playbooks ?? playbooks,
    };

    const response = await fetch("/api/model-lab", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => null)) as { profile?: ModelLabProfile; error?: string } | null;

    if (!response.ok || !body?.profile) {
      setStatus(body?.error ?? "Failed to save model lab changes.");
      return;
    }

    setSystemPrompt(body.profile.systemPrompt);
    setEngine(body.profile.engine);
    setStyleProfileEnabled(body.profile.styleProfileEnabled);
    setKnowledgeFiles(body.profile.knowledgeFiles);
    setPlaybooks(body.profile.playbooks);
    setStatus(`Saved at ${new Date(body.profile.updatedAt).toLocaleTimeString()}`);
  }

  async function runIndustryTemplate() {
    const response = await fetch("/api/vertical/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ industry, input: domainInput }),
    });
    const payload = (await response.json()) as { template?: string; output?: string; error?: string };
    setDomainOutput(payload.error ? payload.error : `${payload.template}\n${payload.output}`);
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Model Lab</CardTitle>
            <CardDescription className="text-slate-400">Tune behavior, upload knowledge, and let the interface adapt to the task.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">System Prompt Editor</p>
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                className="min-h-40 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
              />
              <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void persistProfile({ systemPrompt })}>
                Save Global Rules
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Model Switching</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={engine === "flash" ? "default" : "outline"}
                  className={engine === "flash" ? "bg-indigo-500/20 text-indigo-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => {
                    setEngine("flash");
                    void persistProfile({ engine: "flash" });
                  }}
                >
                  Flash (Speed)
                </Button>
                <Button
                  variant={engine === "pro" ? "default" : "outline"}
                  className={engine === "pro" ? "bg-fuchsia-500/20 text-fuchsia-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => {
                    setEngine("pro");
                    void persistProfile({ engine: "pro" });
                  }}
                >
                  Pro (Deep Logic)
                </Button>
              </div>
              <Button
                variant={styleProfileEnabled ? "default" : "outline"}
                className={styleProfileEnabled ? "bg-emerald-500/20 text-emerald-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                onClick={() => {
                  const next = !styleProfileEnabled;
                  setStyleProfileEnabled(next);
                  void persistProfile({ styleProfileEnabled: next });
                }}
              >
                {styleProfileEnabled ? "Style Profile: ON" : "Style Profile: OFF"}
              </Button>
              <p className="text-xs text-slate-400">{status}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Knowledge Base Upload (RAG)</CardTitle>
            <CardDescription className="text-slate-400">Drop docs so AI can use them as primary sources.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex min-h-32 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.txt,.doc,.docx,.md"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length === 0) return;
                  const names = files.map((file) => file.name);
                  const nextFiles = [...names, ...knowledgeFiles];
                  const nextPlaybooks = [...names.map((name) => `Playbook: ${name}`), ...playbooks];
                  setKnowledgeFiles(nextFiles);
                  setPlaybooks(nextPlaybooks);
                  void persistProfile({ knowledgeFiles: nextFiles, playbooks: nextPlaybooks });
                }}
              />
              Drag/drop docs here or click to upload
            </label>
            <div className="space-y-2">
              {knowledgeFiles.length === 0 ? (
                <p className="text-sm text-slate-500">No files uploaded yet.</p>
              ) : (
                knowledgeFiles.map((file) => (
                  <div key={file} className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm text-slate-200">
                    {file}
                  </div>
                ))
              )}
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
              Domain-trained RAG playbooks loaded: {playbooks.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Vertical Deep Logic Templates</CardTitle>
            <CardDescription className="text-slate-400">
              Industry-specific logic: HR bias detection, legal redlining, finance control review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={industry}
              onChange={(event) => setIndustry(event.target.value as "hr" | "legal" | "finance" | "general")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
            >
              <option value="general">General</option>
              <option value="hr">HR: Bias Detection</option>
              <option value="legal">Legal: Contract Redlining</option>
              <option value="finance">Finance: Control Review</option>
            </select>
            <textarea
              value={domainInput}
              onChange={(event) => setDomainInput(event.target.value)}
              className="min-h-28 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            />
            <Button className="bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25" onClick={() => void runIndustryTemplate()}>
              Run Industry Template
            </Button>
            <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
              {domainOutput || "Template output will appear here."}
            </pre>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Generative UI Preview</CardTitle>
            <CardDescription className="text-slate-400">The layout shifts by intent, so users see the most useful widget first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-5">
              {(["auto", "spreadsheet", "code", "docs", "chat"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={layoutMode === mode ? "default" : "outline"}
                  className={layoutMode === mode ? "bg-cyan-500/20 text-cyan-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setLayoutMode(mode)}
                >
                  {mode === "auto" ? "Auto intent" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Predicted layout</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{predictedLayout}</p>
                <p className="mt-1 text-sm text-slate-400">
                  This panel would morph into the best-fit widget for the current task.
                </p>

                {predictedLayout === "spreadsheet" ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-700">
                    <div className="grid grid-cols-4 bg-slate-950 text-xs text-slate-300">
                      <div className="border-r border-slate-700 p-2">Item</div>
                      <div className="border-r border-slate-700 p-2">Owner</div>
                      <div className="border-r border-slate-700 p-2">Status</div>
                      <div className="p-2">Value</div>
                    </div>
                    {["Invoice 1482", "Budget Review", "Forecast Check"].map((row, index) => (
                      <div key={row} className="grid grid-cols-4 bg-slate-900/60 text-sm text-slate-200">
                        <div className="border-t border-r border-slate-700 p-2">{row}</div>
                        <div className="border-t border-r border-slate-700 p-2">AI Agent</div>
                        <div className="border-t border-r border-slate-700 p-2">{index === 0 ? "Ready" : "Queued"}</div>
                        <div className="border-t border-slate-700 p-2">{index + 1}x</div>
                      </div>
                    ))}
                  </div>
                ) : predictedLayout === "code" ? (
                  <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                    <p className="text-cyan-300">{`// IDE mode`}</p>
                    <p className="mt-2">{`const workflow = await agent.run({ intent: "build" });`}</p>
                    <p>{`workflow.on("checkpoint", approve);`}</p>
                    <p>{`workflow.on("handoff", traceStep);`}</p>
                  </div>
                ) : predictedLayout === "docs" ? (
                  <div className="mt-4 space-y-2 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
                    <p className="font-semibold text-cyan-200">Document Review</p>
                    <p>&bull; Extract policy requirements</p>
                    <p>&bull; Flag gaps and exceptions</p>
                    <p>&bull; Produce a clean summary and action list</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
                    <p className="font-semibold text-cyan-200">Conversation Console</p>
                    <p>Assistant memory active.</p>
                    <p>Live context, next actions, and follow-ups pinned to the top.</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">Intent-driven widgets</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Spreadsheet tasks open a grid, code tasks open an editor, and document work opens a reading view.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">MCP-ready context</p>
                  <p className="mt-2 text-sm text-slate-300">
                    The same layout can pull in local files, Drive content, and workspace context without manual upload.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
