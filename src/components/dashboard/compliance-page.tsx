"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CompliancePayload = {
  entries: Array<{ id: string; role: string; createdAt: string; content: string }>;
  summary: { totalEntries: number; estimatedTokens: number; energyImpactBadge: string };
};

export function CompliancePage() {
  const [report, setReport] = useState<CompliancePayload | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const response = await fetch("/api/compliance/report", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch report");
      const payload = (await response.json()) as CompliancePayload;
      setReport(payload);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    window.open("/api/compliance/report?format=csv", "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Compliance & Safety Reporting</CardTitle>
            <CardDescription className="text-slate-400">Audit trail export, policy review, and usage insight.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void loadReport()} disabled={loading}>
              {loading ? "Loading..." : "Generate Audit Report"}
            </Button>
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={exportCsv}>
              Export Full Audit Trail (CSV)
            </Button>
          </CardContent>
        </Card>

        {report ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-slate-700/70 bg-slate-950/80">
                <CardHeader><CardTitle className="text-base">Audit Entries</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-semibold text-cyan-100">{report.summary.totalEntries}</p></CardContent>
              </Card>
              <Card className="border-slate-700/70 bg-slate-950/80">
                <CardHeader><CardTitle className="text-base">Estimated Tokens</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-semibold text-fuchsia-100">{report.summary.estimatedTokens.toLocaleString()}</p></CardContent>
              </Card>
              <Card className="border-slate-700/70 bg-slate-950/80">
                <CardHeader><CardTitle className="text-base">Impact Badge</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-semibold text-emerald-100">{report.summary.energyImpactBadge}</p></CardContent>
              </Card>
            </div>

            <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader><CardTitle>Recent AI Decisions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.entries.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm text-slate-200">
                    <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()} | {entry.role}</p>
                    <p className="line-clamp-3">{entry.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  );
}
