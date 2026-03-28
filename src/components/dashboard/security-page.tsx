"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SecurityPage() {
  const [piiMasking, setPiiMasking] = useState(true);
  const [inputText, setInputText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [alerts, setAlerts] = useState<Array<{ id: string; createdAt: string; excerpt: string; severity: string }>>([]);
  const [totalScanned, setTotalScanned] = useState(0);

  async function refreshAudit() {
    const response = await fetch("/api/security/audit", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      alerts: Array<{ id: string; createdAt: string; excerpt: string; severity: string }>;
      totalScanned: number;
    };
    setAlerts(payload.alerts);
    setTotalScanned(payload.totalScanned);
  }

  useEffect(() => {
    void refreshAudit();
  }, []);

  async function runMasking() {
    const response = await fetch("/api/security/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: inputText, enabled: piiMasking }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { maskedText: string };
    setMaskedText(payload.maskedText);
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Shadow AI & Security Audit</CardTitle>
            <CardDescription className="text-slate-400">PII masking and prompt injection monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={piiMasking ? "default" : "outline"}
              className={piiMasking ? "bg-emerald-500/20 text-emerald-100" : "border-slate-700 bg-slate-900 text-slate-200"}
              onClick={() => setPiiMasking((current) => !current)}
            >
              {piiMasking ? "PII Masking: ON" : "PII Masking: OFF"}
            </Button>
            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Paste prompt or content to test masking..."
              className="min-h-28 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            />
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void runMasking()}>
              Run PII Masking
            </Button>
            <pre className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">{maskedText || "Masked output will appear here."}</pre>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Prompt Injection Alerts</CardTitle>
            <CardDescription className="text-slate-400">Scanned messages: {totalScanned}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400">No prompt injection alerts detected.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-md border border-rose-500/35 bg-rose-500/10 p-2 text-sm text-rose-100">
                  <p className="text-xs text-rose-200">{new Date(alert.createdAt).toLocaleString()}</p>
                  <p className="line-clamp-2">{alert.excerpt}</p>
                </div>
              ))
            )}
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void refreshAudit()}>
              Refresh Audit Log
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

