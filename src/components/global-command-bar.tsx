"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommandItem = {
  label: string;
  action: () => void;
};

export function GlobalCommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function openCommandBar() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-global-command-bar", openCommandBar);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-global-command-bar", openCommandBar);
    };
  }, []);

  async function executeQuery() {
    if (!query.trim()) return;
    const response = await fetch("/api/ui/adaptive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: query }),
    });
    const payload = (await response.json()) as { intent?: string; error?: string };
    if (!response.ok) {
      setResult(payload.error ?? "Command failed.");
      return;
    }
    setResult(`Detected intent: ${payload.intent ?? "general_chat"}`);

    const lower = query.toLowerCase();
    if (lower.includes("ticket") || lower.includes("summary")) router.push("/dashboard/reports");
    else if (lower.includes("roi") || lower.includes("profit")) router.push("/dashboard/analytics");
    else if (lower.includes("security") || lower.includes("pii")) router.push("/dashboard/security");
    else router.push("/dashboard");
    setOpen(false);
  }

  const commands: CommandItem[] = [
    { label: "Summarize recent chats", action: () => setQuery("Summarize recent chats") },
    { label: "Analyze ROI", action: () => setQuery("Analyze budget and ROI") },
    { label: "Show security alerts", action: () => setQuery("Show security alerts and pii checks") },
    { label: "Open dashboard", action: () => router.push("/dashboard") },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 p-4 pt-24">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
        <p className="mb-2 text-xs uppercase tracking-wide text-cyan-300">AI Agent Command Bar</p>
        <div className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Try "Summarize recent chats"'
            className="border-slate-700 bg-slate-900 text-slate-100"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void executeQuery();
              }
            }}
          />
          <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void executeQuery()}>
            Run
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {commands.map((command) => (
            <button
              key={command.label}
              type="button"
              onClick={command.action}
              className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            >
              {command.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">{result || "Press Cmd/Ctrl + K on any page."}</p>
      </div>
    </div>
  );
}
