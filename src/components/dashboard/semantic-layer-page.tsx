"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Metric = {
  id: string;
  metricKey: string;
  displayName: string;
  formula: string;
  description?: string | null;
};

export function SemanticLayerPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [metricKey, setMetricKey] = useState("total_profit");
  const [displayName, setDisplayName] = useState("Total Profit");
  const [formula, setFormula] = useState("revenue - cogs");
  const [description, setDescription] = useState("Revenue minus COGS");

  const [inputJson, setInputJson] = useState('{"revenue": 150000, "cogs": 62000}');
  const [selectedMetric, setSelectedMetric] = useState("total_profit");
  const [resolveResult, setResolveResult] = useState("");

  async function loadMetrics() {
    const response = await fetch("/api/semantic/metrics", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { metrics: Metric[] };
    setMetrics(payload.metrics);
    if (payload.metrics.length > 0) setSelectedMetric(payload.metrics[0].metricKey);
  }

  useEffect(() => {
    void loadMetrics();
  }, []);

  async function saveMetric() {
    const response = await fetch("/api/semantic/metrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ metricKey, displayName, formula, description }),
    });
    if (!response.ok) return;
    setMetricKey("");
    setDisplayName("");
    setFormula("");
    setDescription("");
    await loadMetrics();
  }

  async function resolveMetric() {
    let parsedInput: Record<string, number> = {};
    try {
      parsedInput = JSON.parse(inputJson) as Record<string, number>;
    } catch {
      setResolveResult("Input must be valid JSON.");
      return;
    }

    const response = await fetch("/api/semantic/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        metricKey: selectedMetric,
        input: parsedInput,
      }),
    });
    const payload = (await response.json()) as { value?: number; formula?: string; error?: string };
    if (!response.ok) {
      setResolveResult(payload.error ?? "Semantic resolve failed.");
      return;
    }
    setResolveResult(`Formula: ${payload.formula}\nResult: ${payload.value}`);
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Semantic Layer</CardTitle>
            <CardDescription className="text-slate-400">
              Map raw values to business concepts so AI answers use your exact formulas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Input value={metricKey} onChange={(event) => setMetricKey(event.target.value)} placeholder="metric_key" className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display Name" className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={formula} onChange={(event) => setFormula(event.target.value)} placeholder="Formula, e.g. revenue - cogs" className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="border-slate-700 bg-slate-900 text-slate-100" />
              <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void saveMetric()}>
                Save Metric
              </Button>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-fuchsia-300">Active Concepts</p>
              <div className="mt-2 space-y-2 text-sm text-slate-200">
                {metrics.length === 0 ? (
                  <p className="text-slate-400">No metrics yet.</p>
                ) : (
                  metrics.map((metric) => (
                    <div key={metric.id} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-2">
                      <p className="font-semibold">{metric.displayName}</p>
                      <p className="text-xs text-slate-400">{metric.metricKey}</p>
                      <p className="text-xs text-cyan-200">{metric.formula}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Semantic Resolve</CardTitle>
            <CardDescription className="text-slate-400">Run metric evaluation with your formula definitions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
              className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
            >
              {metrics.map((metric) => (
                <option key={metric.id} value={metric.metricKey}>
                  {metric.displayName}
                </option>
              ))}
            </select>
            <textarea
              value={inputJson}
              onChange={(event) => setInputJson(event.target.value)}
              className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            />
            <Button className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25" onClick={() => void resolveMetric()}>
              Resolve Metric
            </Button>
            <pre className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
              {resolveResult || "Resolved value will appear here."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
