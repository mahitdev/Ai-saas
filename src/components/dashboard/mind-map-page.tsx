"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function extractKeywords(text: string) {
  const skip = new Set(["about", "there", "which", "would", "could", "their", "while", "where"]);
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
    if (word.length <= 4 || skip.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([word, count]) => ({ word, count }));
}

export function MindMapPage() {
  const [sourceText, setSourceText] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const keywords = useMemo(() => extractKeywords(sourceText), [sourceText]);
  const lines = useMemo(() => sourceText.split("\n").filter((line) => line.trim()), [sourceText]);

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Context Explorer</CardTitle>
            <CardDescription className="text-slate-400">
              Paste conversation text, notes, or transcripts and explore topic clusters interactively.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste transcript, notes, or message history..."
              className="min-h-36 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            />
            <div className="flex flex-wrap gap-2">
              {keywords.length === 0 ? (
                <p className="text-xs text-slate-500">Add text to generate map nodes.</p>
              ) : (
                keywords.map((item) => (
                  <button
                    key={item.word}
                    type="button"
                    onClick={() => setActiveTopic(item.word)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      activeTopic === item.word
                        ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-100"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/40"
                    }`}
                  >
                    {item.word} ({item.count})
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Related Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            {!activeTopic ? (
              <p className="text-sm text-slate-400">Select a node to view related lines.</p>
            ) : (
              <div className="space-y-2">
                {lines
                  .filter((line) => line.toLowerCase().includes(activeTopic.toLowerCase()))
                  .slice(0, 8)
                  .map((line, index) => (
                    <div key={`${line}-${index}`} className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                      {line}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
