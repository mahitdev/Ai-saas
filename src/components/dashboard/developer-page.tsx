"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ApiKey = { id: string; label: string; key: string; limit: number; active: boolean };
type WebhookLog = { id: string; event: string; statusCode: number; detail: string | null; createdAt: string };

export function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [sandboxRequest, setSandboxRequest] = useState('{ "prompt": "Hello API" }');
  const [sandboxResponse, setSandboxResponse] = useState("");
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [status, setStatus] = useState("Loading developer tools...");
  const [burnForecast, setBurnForecast] = useState<{
    daysUntilExhausted: number;
    dailyRate: number;
    creditsRemaining: number;
    suggestion: string;
  } | null>(null);

  useEffect(() => {
    async function loadInitial() {
      const [keysResponse, logsResponse, forecastResponse] = await Promise.all([
        fetch("/api/developer/keys", { cache: "no-store" }),
        fetch("/api/developer/webhooks", { cache: "no-store" }),
        fetch("/api/usage/predict", { cache: "no-store" }),
      ]);

      if (keysResponse.ok) {
        const payload = (await keysResponse.json()) as { keys: ApiKey[] };
        setKeys(payload.keys);
      }

      if (logsResponse.ok) {
        const payload = (await logsResponse.json()) as { logs: WebhookLog[] };
        setLogs(payload.logs);
      }

      if (forecastResponse.ok) {
        const payload = (await forecastResponse.json()) as {
          forecast: {
            daysUntilExhausted: number;
            dailyRate: number;
            creditsRemaining: number;
            suggestion: string;
          };
        };
        setBurnForecast(payload.forecast);
      }

      setStatus("Developer tools synced.");
    }

    void loadInitial();

    const interval = setInterval(() => {
      void (async () => {
        const logResponse = await fetch("/api/developer/webhooks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event: "task-finished", statusCode: 200, detail: "POST /webhooks/task-finished -> 200 OK" }),
        });

        if (!logResponse.ok) return;

        const refresh = await fetch("/api/developer/webhooks", { cache: "no-store" });
        if (!refresh.ok) return;
        const payload = (await refresh.json()) as { logs: WebhookLog[] };
        setLogs(payload.logs);
      })();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const totalLimit = useMemo(() => keys.reduce((sum, key) => sum + key.limit, 0), [keys]);

  async function handleCreateKey() {
    const response = await fetch("/api/developer/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "Primary", limit: 5000 }),
    });

    const payload = (await response.json().catch(() => null)) as { key?: ApiKey; error?: string } | null;
    if (!response.ok || !payload?.key) {
      setStatus(payload?.error ?? "Failed to generate API key.");
      return;
    }

    setKeys((prev) => [payload.key as ApiKey, ...prev]);
    setStatus("API key generated.");
  }

  async function handleRotate(id: string) {
    const response = await fetch(`/api/developer/keys/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rotate: true }),
    });

    const payload = (await response.json().catch(() => null)) as { key?: ApiKey; error?: string } | null;
    if (!response.ok || !payload?.key) {
      setStatus(payload?.error ?? "Failed to rotate API key.");
      return;
    }

    setKeys((prev) => prev.map((item) => (item.id === id ? (payload.key as ApiKey) : item)));
    setStatus("API key rotated.");
  }

  async function handleLimitChange(id: string, limit: number) {
    setKeys((prev) => prev.map((key) => (key.id === id ? { ...key, limit } : key)));

    await fetch(`/api/developer/keys/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ limit }),
    });
  }

  async function handleDeleteKey(id: string) {
    const response = await fetch(`/api/developer/keys/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Failed to revoke API key.");
      return;
    }

    setKeys((prev) => prev.filter((item) => item.id !== id));
    setStatus("API key revoked.");
  }

  async function handleSandbox() {
    const response = await fetch("/api/developer/sandbox", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ request: sandboxRequest }),
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    setSandboxResponse(JSON.stringify(payload ?? { error: "No response" }, null, 2));
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>API & Developer</CardTitle>
            <CardDescription className="text-slate-400">Keys, webhooks, sandbox testing, and usage forecasting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">Total usage limit: {totalLimit.toLocaleString()} credits</p>
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void handleCreateKey()}>
              Generate API Key
            </Button>
            <p className="text-xs text-slate-400">{status}</p>
            <div className="space-y-2">
              {keys.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-md border border-slate-700 bg-slate-900/70 p-2 md:grid-cols-[1fr_120px_180px]">
                  <Input value={item.key} readOnly className="border-slate-700 bg-slate-950 text-slate-100" />
                  <Input
                    type="number"
                    value={item.limit}
                    onChange={(event) => void handleLimitChange(item.id, Number(event.target.value) || 0)}
                    className="border-slate-700 bg-slate-950 text-slate-100"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 bg-slate-900 text-slate-200"
                      onClick={() => void handleRotate(item.id)}
                    >
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-rose-700/60 bg-rose-900/20 text-rose-200"
                      onClick={() => void handleDeleteKey(item.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Webhook Logs</CardTitle>
              <CardDescription className="text-slate-400">Live ping stream for integrations.</CardDescription>
            </CardHeader>
            <CardContent className="rounded-md border border-slate-700 bg-slate-900/70 p-3 font-mono text-xs text-emerald-300">
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <p>Waiting for webhook pings...</p>
                ) : (
                  logs.map((log) => (
                    <p key={log.id}>{`[${new Date(log.createdAt).toLocaleTimeString()}] ${log.event} -> ${log.statusCode} ${log.detail ?? ""}`}</p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Sandbox Mode</CardTitle>
              <CardDescription className="text-slate-400">Test request payloads without burning real credits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={sandboxRequest}
                onChange={(event) => setSandboxRequest(event.target.value)}
                className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
              />
              <Button className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25" onClick={() => void handleSandbox()}>
                Run Sandbox Call
              </Button>
              <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">{sandboxResponse || "No sandbox call yet."}</pre>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
            <CardTitle>Smart Routing + Usage Forecast</CardTitle>
              <CardDescription className="text-slate-400">
                Simple tasks route to fast models, complex tasks to deep reasoning models.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-slate-200">
                Token caching and batching are active in the AI pipeline for repeated prompts.
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-slate-200">
                Credits remaining: {burnForecast?.creditsRemaining ?? 0}
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-slate-200">
                Daily burn rate: {burnForecast?.dailyRate ?? 0} tokens/day
              </div>
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-amber-100">
                {burnForecast
                  ? `Predictive burn rate: you may run out in ${burnForecast.daysUntilExhausted} days. ${burnForecast.suggestion}`
                  : "Forecast unavailable."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
