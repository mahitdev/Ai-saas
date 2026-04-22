"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ComparisonPage() {
  const [prompt, setPrompt] = useState("");
  const [leftModel, setLeftModel] = useState<"auto" | "chatgpt" | "gemini">("chatgpt");
  const [rightModel, setRightModel] = useState<"auto" | "chatgpt" | "gemini">("gemini");
  const [leftResult, setLeftResult] = useState("");
  const [rightResult, setRightResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function runComparison() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setLeftResult("");
    setRightResult("");
    try {
      const response = await fetch("/api/chat/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          leftModel,
          rightModel,
        }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { leftResult: string; rightResult: string };
      setLeftResult(payload.leftResult);
      setRightResult(payload.rightResult);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Side-by-Side Model Comparison</CardTitle>
            <CardDescription className="text-slate-400">
              Run one prompt across two models and compare the responses side by side.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Enter prompt to compare..."
              className="border-slate-700 bg-slate-900 text-slate-100"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <select
                value={leftModel}
                onChange={(event) => setLeftModel(event.target.value as "auto" | "chatgpt" | "gemini")}
                className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
              >
                <option value="chatgpt">Left: ChatGPT</option>
                <option value="gemini">Left: Gemini</option>
                <option value="auto">Left: Auto</option>
              </select>
              <select
                value={rightModel}
                onChange={(event) => setRightModel(event.target.value as "auto" | "chatgpt" | "gemini")}
                className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
              >
                <option value="gemini">Right: Gemini</option>
                <option value="chatgpt">Right: ChatGPT</option>
                <option value="auto">Right: Auto</option>
              </select>
            </div>
            <Button className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25" onClick={() => void runComparison()} disabled={loading}>
              {loading ? "Comparing..." : "Run Comparison"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Model A Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="min-h-56 overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">
                {leftResult || "No output yet."}
              </pre>
            </CardContent>
          </Card>
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Model B Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="min-h-56 overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">
                {rightResult || "No output yet."}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
