"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModelLabPage() {
  const [systemPrompt, setSystemPrompt] = useState("Always respond in a structured, practical format.");
  const [engine, setEngine] = useState<"flash" | "pro">("flash");
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([]);
  const [styleProfileEnabled, setStyleProfileEnabled] = useState(false);

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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

