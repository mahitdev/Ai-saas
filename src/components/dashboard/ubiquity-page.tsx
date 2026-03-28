"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type McpSource = "google_drive" | "github" | "local_files" | "postgres";
type BotPlatform = "slack" | "teams";

export function UbiquityPage() {
  const [mcpSource, setMcpSource] = useState<McpSource>("github");
  const [mcpTarget, setMcpTarget] = useState("");
  const [mcpResult, setMcpResult] = useState<string>("");
  const [botPlatform, setBotPlatform] = useState<BotPlatform>("slack");
  const [botMessage, setBotMessage] = useState("@MyAI summarize this sprint thread");
  const [botReply, setBotReply] = useState("");
  const [command, setCommand] = useState("");
  const [commandOutput, setCommandOutput] = useState("");
  const [pageTitle, setPageTitle] = useState("LinkedIn - Product Manager Profile");
  const [pageUrl, setPageUrl] = useState("https://www.linkedin.com/in/example-profile");
  const [highlightedText, setHighlightedText] = useState("Growth-focused PM with 7 years of SaaS experience.");
  const [contextHelp, setContextHelp] = useState("");

  const quickCommands = useMemo(
    () => ["/summarize-last-meeting", "/draft-followup-email", "/extract-action-items", "/status-report"],
    [],
  );

  async function connectMcp() {
    const response = await fetch("/api/mcp/context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: mcpSource, target: mcpTarget || "default" }),
    });
    const payload = (await response.json()) as {
      connected?: boolean;
      secureSessionToken?: string;
      discoveredResources?: string[];
      note?: string;
    };
    if (!response.ok || !payload.connected) {
      setMcpResult("MCP connection failed.");
      return;
    }
    setMcpResult(
      `Connected.\nSession: ${payload.secureSessionToken}\nResources:\n- ${(payload.discoveredResources ?? []).join("\n- ")}\n${payload.note ?? ""}`,
    );
  }

  async function testBot() {
    const response = await fetch("/api/integrations/chat-bot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform: botPlatform, message: botMessage, channel: "product-updates" }),
    });
    const payload = (await response.json()) as { reply?: string };
    setBotReply(payload.reply ?? "No bot reply.");
  }

  function runCommandBar() {
    if (!command.trim()) return;
    if (command.startsWith("/summarize-last-meeting")) {
      setCommandOutput("Meeting summary: top blockers, decisions made, and next owners generated.");
      return;
    }
    if (command.startsWith("/draft-followup-email")) {
      setCommandOutput("Drafted follow-up email in your library assets.");
      return;
    }
    if (command.startsWith("/extract-action-items")) {
      setCommandOutput("Extracted 7 action items and assigned tentative owners.");
      return;
    }
    setCommandOutput(`Command executed: ${command}`);
  }

  async function analyzeBrowserContext() {
    const response = await fetch("/api/extensions/contextual-help", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pageTitle,
        pageUrl,
        highlightedText,
      }),
    });
    const payload = (await response.json()) as { suggestion?: string; error?: string };
    setContextHelp(payload.suggestion ?? payload.error ?? "No contextual suggestion.");
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>The Ubiquity Layer</CardTitle>
            <CardDescription className="text-slate-400">
              Entry points across browser, desktop, IDE, and team chat so users can trigger AI anywhere.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Chrome/Edge Extension</CardTitle>
              <CardDescription className="text-slate-400">
                Highlight text on any site and send it to your app for analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>Extension files added under `extensions/chrome-extension`.</p>
              <p>
                Load via <code>chrome://extensions</code> {"->"} Developer Mode {"->"} Load unpacked.
              </p>
              <p>Context-menu action: &quot;Send to MyAI&quot;.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Model Context Protocol (MCP)</CardTitle>
              <CardDescription className="text-slate-400">
                Securely read connected tools (GitHub, Drive, local files, DB) without manual upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={mcpSource}
                  onChange={(event) => setMcpSource(event.target.value as McpSource)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200"
                >
                  <option value="github">GitHub</option>
                  <option value="google_drive">Google Drive</option>
                  <option value="local_files">Local Files</option>
                  <option value="postgres">Postgres</option>
                </select>
                <Input
                  value={mcpTarget}
                  onChange={(event) => setMcpTarget(event.target.value)}
                  placeholder="repo/path or connector id"
                  className="border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void connectMcp()}>
                Connect MCP Source
              </Button>
              <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                {mcpResult || "No MCP connection yet."}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Native Desktop Global Command Bar</CardTitle>
              <CardDescription className="text-slate-400">
                Simulated `Cmd/Ctrl + K` quick commands (desktop app target: Electron/Tauri).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                    onClick={() => setCommand(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <Input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="/command"
                className="border-slate-700 bg-slate-900 text-slate-100"
              />
              <Button className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25" onClick={runCommandBar}>
                Execute Command
              </Button>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                {commandOutput || "No command executed."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>IDE Plugin + Slack/Teams Bot</CardTitle>
              <CardDescription className="text-slate-400">
                VS Code/IntelliJ entrypoint and team chat bot assistant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
                IDE plugin scaffold created in `integrations/vscode-extension`.
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={botPlatform}
                  onChange={(event) => setBotPlatform(event.target.value as BotPlatform)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200"
                >
                  <option value="slack">Slack Bot</option>
                  <option value="teams">Microsoft Teams Bot</option>
                </select>
                <Input
                  value={botMessage}
                  onChange={(event) => setBotMessage(event.target.value)}
                  className="border-slate-700 bg-slate-900 text-slate-100"
                />
              </div>
              <Button className="bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25" onClick={() => void testBot()}>
                Test Bot Mention
              </Button>
              <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                {botReply || "No bot reply yet."}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-slate-700/70 bg-slate-950/80">
            <CardHeader>
              <CardTitle>Agentic Browser Extension + Side Panel</CardTitle>
              <CardDescription className="text-slate-400">
                Context-aware assistance from active website content in a browser side panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" />
              <Input value={highlightedText} onChange={(event) => setHighlightedText(event.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" />
              <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void analyzeBrowserContext()}>
                Analyze Current Page Context
              </Button>
              <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                {contextHelp || "No context help yet."}
              </pre>
              <p className="text-xs text-slate-400">
                Side-panel mode: available. The extension can slide out while users browse other websites.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
