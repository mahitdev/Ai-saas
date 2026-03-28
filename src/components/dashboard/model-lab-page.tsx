"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModelLabPage() {
  const [systemPrompt, setSystemPrompt] = useState("Always respond in a structured, practical format.");
  const [engine, setEngine] = useState<"flash" | "pro">("flash");
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([]);
  const [styleProfileEnabled, setStyleProfileEnabled] = useState(false);
  const [industry, setIndustry] = useState<"hr" | "legal" | "finance" | "general">("general");
  const [domainInput, setDomainInput] = useState("Review this policy document for risk and required actions.");
  const [domainOutput, setDomainOutput] = useState("");
  const [playbooks, setPlaybooks] = useState<string[]>([]);

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
            <CardDescription className="text-slate-400">Fine-tune behavior, upload knowledge, and choose engine profile.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">System Prompt Editor</p>
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                className="min-h-40 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
              />
              <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25">Save Global Rules</Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Model Switching</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={engine === "flash" ? "default" : "outline"}
                  className={engine === "flash" ? "bg-indigo-500/20 text-indigo-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setEngine("flash")}
                >
                  Flash (Speed)
                </Button>
                <Button
                  variant={engine === "pro" ? "default" : "outline"}
                  className={engine === "pro" ? "bg-fuchsia-500/20 text-fuchsia-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setEngine("pro")}
                >
                  Pro (Deep Logic)
                </Button>
              </div>
              <Button
                variant={styleProfileEnabled ? "default" : "outline"}
                className={styleProfileEnabled ? "bg-emerald-500/20 text-emerald-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                onClick={() => setStyleProfileEnabled((current) => !current)}
              >
                {styleProfileEnabled ? "Style Profile: ON" : "Style Profile: OFF"}
              </Button>
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
                  setKnowledgeFiles((prev) => [...files.map((file) => file.name), ...prev]);
                  setPlaybooks((prev) => [...files.map((file) => `Playbook: ${file.name}`), ...prev]);
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
      </div>
    </main>
  );
}
