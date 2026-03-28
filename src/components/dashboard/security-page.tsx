"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SecurityPage() {
  const [piiMasking, setPiiMasking] = useState(true);
  const [inputText, setInputText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [enclaveEnabled, setEnclaveEnabled] = useState(true);
  const [enclaveResult, setEnclaveResult] = useState("");
  const [alerts, setAlerts] = useState<Array<{ id: string; createdAt: string; excerpt: string; severity: string }>>([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [governanceLogs, setGovernanceLogs] = useState<
    Array<{
      id: string;
      timestamp: string;
      direction: string;
      model: string;
      policyFlags: string[];
      rationale: string;
      aiBom: { model: string; datasets: string[]; apis: string[] };
    }>
  >([]);

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
    void refreshGovernance();
  }, []);

  async function refreshGovernance() {
    const response = await fetch("/api/security/governance", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      logs: Array<{
        id: string;
        timestamp: string;
        direction: string;
        model: string;
        policyFlags: string[];
        rationale: string;
        aiBom: { model: string; datasets: string[]; apis: string[] };
      }>;
    };
    setGovernanceLogs(payload.logs);
  }

  async function runMasking() {
    const response = await fetch("/api/security/scrub", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: inputText, unmaskPreview: !piiMasking }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { scrubbedText: string };
    setMaskedText(payload.scrubbedText);
  }

  async function runEnclaveTask() {
    const response = await fetch("/api/security/enclave", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task: inputText || "Security analysis", enabled: enclaveEnabled }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { attestationId: string; note: string; enclave: string };
    setEnclaveResult(`Mode: ${payload.enclave}\nAttestation: ${payload.attestationId}\n${payload.note}`);
  }

  async function runGatewayInspection() {
    const response = await fetch("/api/security/governance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: inputText || "Default governance test",
        model: "auto-router",
        direction: "input",
        routeContext: "security_dashboard_gateway",
      }),
    });
    if (!response.ok) return;
    await refreshGovernance();
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
            <Button
              variant={enclaveEnabled ? "default" : "outline"}
              className={enclaveEnabled ? "bg-fuchsia-500/20 text-fuchsia-100" : "border-slate-700 bg-slate-900 text-slate-200"}
              onClick={() => setEnclaveEnabled((current) => !current)}
            >
              {enclaveEnabled ? "Confidential Enclave: ON" : "Confidential Enclave: OFF"}
            </Button>
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void runEnclaveTask()}>
              Process in Enclave
            </Button>
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void runGatewayInspection()}>
              Inspect via AI Gateway Control Plane
            </Button>
            <pre className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">{maskedText || "Masked output will appear here."}</pre>
            {enclaveResult ? (
              <pre className="rounded-md border border-fuchsia-500/35 bg-slate-900/70 p-2 text-xs text-fuchsia-100">{enclaveResult}</pre>
            ) : null}
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

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Model Lineage, Audit Trails & AI-BOM</CardTitle>
            <CardDescription className="text-slate-400">Transparent records for regulated workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {governanceLogs.length === 0 ? (
              <p className="text-sm text-slate-400">No governance logs yet.</p>
            ) : (
              governanceLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                  <p className="text-cyan-200">{new Date(log.timestamp).toLocaleString()} | {log.direction} | {log.model}</p>
                  <p className="mt-1 text-slate-300">{log.rationale}</p>
                  <p className="mt-1 text-slate-400">Flags: {log.policyFlags.length > 0 ? log.policyFlags.join(", ") : "none"}</p>
                  <p className="mt-1 text-emerald-300">AI-BOM model: {log.aiBom.model}</p>
                  <p className="text-slate-500">Datasets: {log.aiBom.datasets.join(", ")}</p>
                  <p className="text-slate-500">APIs: {log.aiBom.apis.join(", ")}</p>
                </div>
              ))
            )}
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void refreshGovernance()}>
              Refresh Governance Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
