"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ApiKey = { id: string; key: string; limit: number };

function createApiKey() {
  return `sk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKey[]>([{ id: crypto.randomUUID(), key: createApiKey(), limit: 5000 }]);
  const [sandboxRequest, setSandboxRequest] = useState('{ "prompt": "Hello API" }');
  const [sandboxResponse, setSandboxResponse] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => [`[${new Date().toLocaleTimeString()}] POST /webhooks/task-finished -> 200 OK`, ...prev].slice(0, 12));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalLimit = useMemo(() => keys.reduce((sum, key) => sum + key.limit, 0), [keys]);

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>API & Developer</CardTitle>
            <CardDescription className="text-slate-400">Keys, webhooks, and sandbox testing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">Total usage limit: {totalLimit.toLocaleString()} credits</p>
            <Button
              className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
              onClick={() => setKeys((prev) => [{ id: crypto.randomUUID(), key: createApiKey(), limit: 5000 }, ...prev])}
            >
              Generate API Key
            </Button>
            <div className="space-y-2">
              {keys.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-md border border-slate-700 bg-slate-900/70 p-2 md:grid-cols-[1fr_120px_180px]">
                  <Input value={item.key} readOnly className="border-slate-700 bg-slate-950 text-slate-100" />
                  <Input
                    type="number"
                    value={item.limit}
                    onChange={(event) =>
                      setKeys((prev) =>
                        prev.map((key) => (key.id === item.id ? { ...key, limit: Number(event.target.value) || 0 } : key)),
                      )
                    }
                    className="border-slate-700 bg-slate-950 text-slate-100"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 bg-slate-900 text-slate-200"
                      onClick={() =>
                        setKeys((prev) =>
                          prev.map((key) => (key.id === item.id ? { ...key, key: createApiKey() } : key)),
                        )
                      }
                    >
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-rose-700/60 bg-rose-900/20 text-rose-200"
                      onClick={() => setKeys((prev) => prev.filter((key) => key.id !== item.id))}
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
                {logs.length === 0 ? <p>Waiting for webhook pings...</p> : logs.map((log) => <p key={log}>{log}</p>)}
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
              <Button
                className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25"
                onClick={() =>
                  setSandboxResponse(
                    JSON.stringify(
                      {
                        sandbox: true,
                        status: "ok",
                        latencyMs: Math.round(120 + Math.random() * 230),
                        preview: "Sample response from sandbox model execution.",
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                Run Sandbox Call
              </Button>
              <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">{sandboxResponse || "No sandbox call yet."}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

