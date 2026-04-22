"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DigestRow = {
  id: string;
  weekStartIso: string;
  weekEndIso: string;
  hoursSaved: string;
  topTopics: string;
  prediction: string;
  deliveryMode: string;
  deliveredTo?: string | null;
  createdAt: string;
  digestBody: string;
};

export function WeeklyDigestPage() {
  const [digests, setDigests] = useState<DigestRow[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<"email" | "pdf" | "in_app">("in_app");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [result, setResult] = useState("");

  async function loadDigests() {
    const response = await fetch("/api/reports/weekly-digest", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { digests: DigestRow[] };
    setDigests(payload.digests);
  }

  useEffect(() => {
    void loadDigests();
  }, []);

  async function generateDigest() {
    const response = await fetch("/api/reports/weekly-digest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deliveryMode, deliveredTo: deliveredTo || undefined }),
    });

    if (deliveryMode === "pdf") {
      if (!response.ok) {
        setResult("PDF generation failed.");
        return;
      }
      const text = await response.text();
      setResult(`PDF-like report created.\n\n${text.slice(0, 220)}...`);
      await loadDigests();
      return;
    }

    const payload = (await response.json()) as {
      digest?: { digestBody?: string };
      delivered?: boolean;
      channel?: string;
      deliveredTo?: string;
      error?: string;
    };
    if (!response.ok) {
      setResult(payload.error ?? "Digest generation failed.");
      return;
    }
    setResult(
      [
        `Digest generated and delivered via ${payload.channel ?? "in_app"}.`,
        payload.deliveredTo ? `Delivered to: ${payload.deliveredTo}` : "",
        payload.digest?.digestBody ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    await loadDigests();
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Weekly Digest</CardTitle>
            <CardDescription className="text-slate-400">
              Every Sunday, AI summarizes activity, hours saved, top topics, and next-week predictions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3">
              <select
                value={deliveryMode}
                onChange={(event) => setDeliveryMode(event.target.value as "email" | "pdf" | "in_app")}
                className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
              >
                <option value="in_app">In-App</option>
                <option value="email">Email</option>
                <option value="pdf">PDF</option>
              </select>
              <Input
                value={deliveredTo}
                onChange={(event) => setDeliveredTo(event.target.value)}
                placeholder="email (optional)"
                className="border-slate-700 bg-slate-900 text-slate-100 md:col-span-2"
              />
            </div>
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void generateDigest()}>
              Generate Weekly Digest
            </Button>
            <pre className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
              {result || "Digest output will appear here."}
            </pre>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Recent Digest History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {digests.length === 0 ? (
              <p className="text-sm text-slate-400">No digests generated yet.</p>
            ) : (
              digests.map((digest) => (
                <div key={digest.id} className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-sm font-semibold text-cyan-100">
                    {digest.weekStartIso.slice(0, 10)} to {digest.weekEndIso.slice(0, 10)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {digest.deliveryMode} | saved {digest.hoursSaved}h | topics: {digest.topTopics}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{digest.prediction}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
