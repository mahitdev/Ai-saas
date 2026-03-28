"use client";

import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Analytics & Insights</CardTitle>
            <CardDescription className="text-slate-400">Efficiency score, anomaly alerts, and sentiment trends.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-cyan-300">Hours Saved</p>
              <p className="mt-1 text-3xl font-semibold text-cyan-100">{totalHoursSaved}h</p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-fuchsia-300">Efficiency Score</p>
              <p className="mt-1 text-3xl font-semibold text-fuchsia-100">{Math.min(98, totalHoursSaved * 3)}%</p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-300">Anomaly Alerts</p>
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
              <CardTitle>Anomaly Alerts</CardTitle>
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
            <CardTitle>Sentiment Trends Heat Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sentimentHeat.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-2">
                {row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="h-10 rounded-md border border-slate-700"
                    style={{ background: `rgba(34,197,94,${Math.max(0.15, value)})` }}
                    title={`Week ${rowIndex + 1}, Segment ${colIndex + 1}: ${Math.round(value * 100)}% happiness`}
                  />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

