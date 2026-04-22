"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const weeklyHours = [2, 3, 4, 5, 6, 7, 8];
const tokenUsage = [900, 1200, 1400, 3900, 1800, 1700, 1600];
const sentimentHeat = [
  [0.8, 0.7, 0.6, 0.5],
  [0.65, 0.72, 0.78, 0.81],
  [0.44, 0.51, 0.58, 0.68],
  [0.9, 0.82, 0.76, 0.7],
  [0.55, 0.62, 0.74, 0.84],
  [0.42, 0.58, 0.63, 0.71],
  [0.61, 0.67, 0.72, 0.79],
];

export function AnalyticsPage() {
  const totalHoursSaved = useMemo(() => weeklyHours.reduce((sum, value) => sum + value, 0), []);
  const anomalyDays = tokenUsage
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value > 3000);
  const [hourlyRate, setHourlyRate] = useState("35");
  const [subscriptionCost, setSubscriptionCost] = useState("49");
  const [taskPrice, setTaskPrice] = useState("1");
  const [roiData, setRoiData] = useState<{
    monthly?: {
      successfulTasks: number;
      outcomeBill: number;
      hoursSaved: number;
      totalSavings: number;
    };
    esg?: { carbonFootprintKgCo2e: number; badge: string };
  }>({});

  const loadRoi = useCallback(async () => {
    const response = await fetch("/api/business/roi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        hourlyRate: Number(hourlyRate),
        subscriptionCost: Number(subscriptionCost),
        successfulTaskPrice: Number(taskPrice),
      }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      monthly: {
        successfulTasks: number;
        outcomeBill: number;
        hoursSaved: number;
        totalSavings: number;
      };
      esg: { carbonFootprintKgCo2e: number; badge: string };
    };
    setRoiData(payload);
  }, [hourlyRate, subscriptionCost, taskPrice]);

  useEffect(() => {
    void loadRoi();
  }, [loadRoi]);

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Analytics & Insights</CardTitle>
            <CardDescription className="text-slate-400">Chat activity, workflow efficiency, and usage trends.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-cyan-300">Hours Saved</p>
              <p className="mt-1 text-3xl font-semibold text-cyan-100">{totalHoursSaved}h</p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-fuchsia-300">Workflow Score</p>
              <p className="mt-1 text-3xl font-semibold text-fuchsia-100">{Math.min(98, totalHoursSaved * 3)}%</p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-300">Usage Alerts</p>
              <p className="mt-1 text-3xl font-semibold text-amber-100">{anomalyDays.length}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Efficiency Score (Hours Saved)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-end gap-2">
                {weeklyHours.map((value, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t-md bg-cyan-500/40" style={{ height: `${value * 16}px` }} />
                    <p className="text-[11px] text-slate-400">D{index + 1}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
            <CardTitle>Usage Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {anomalyDays.length === 0 ? (
                <p className="text-sm text-slate-400">No unusual usage spikes detected.</p>
              ) : (
                anomalyDays.map((item) => (
                  <div key={item.index} className="rounded-md border border-amber-500/35 bg-amber-500/10 p-2 text-sm text-amber-100">
                    Day {item.index + 1}: unusual token spike ({item.value.toLocaleString()} tokens)
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Conversation Trends Heat Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sentimentHeat.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-2">
                {row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="h-10 rounded-md border border-slate-700"
                    style={{ background: `rgba(34,197,94,${Math.max(0.15, value)})` }}
                    title={`Week ${rowIndex + 1}, Segment ${colIndex + 1}: ${Math.round(value * 100)}% engagement`}
                  />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Outcome Pricing + ROI</CardTitle>
            <CardDescription className="text-slate-400">
              Measure value from hours saved, task completion, and plan cost.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3">
              <Input value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} placeholder="Hourly rate" className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={subscriptionCost} onChange={(event) => setSubscriptionCost(event.target.value)} placeholder="Subscription cost" className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={taskPrice} onChange={(event) => setTaskPrice(event.target.value)} placeholder="Task success price" className="border-slate-700 bg-slate-900 text-slate-100" />
            </div>
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void loadRoi()}>
              Recalculate ROI
            </Button>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Successful Tasks</p>
                <p className="text-xl font-semibold text-cyan-100">{roiData.monthly?.successfulTasks ?? 0}</p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Total Savings</p>
                <p className="text-xl font-semibold text-fuchsia-100">${roiData.monthly?.totalSavings ?? 0}</p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Impact Badge</p>
                <p className="text-xl font-semibold text-emerald-100">{roiData.esg?.badge ?? "N/A"}</p>
                <p className="text-xs text-slate-500">{roiData.esg?.carbonFootprintKgCo2e ?? 0} kg CO2e</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
