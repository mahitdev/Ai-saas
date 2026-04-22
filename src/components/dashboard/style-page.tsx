"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function StylePage() {
  const [samples, setSamples] = useState<string[]>([]);
  const [sampleInput, setSampleInput] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [band, setBand] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  async function runScore() {
    if (!generatedContent.trim() || samples.length === 0) return;
    const response = await fetch("/api/style/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: generatedContent,
        samples,
      }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      brandConsistencyScore: number;
      band: string;
      notes: string[];
    };
    setScore(payload.brandConsistencyScore);
    setBand(payload.band);
    setNotes(payload.notes);
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Style & Voice Tuner</CardTitle>
            <CardDescription className="text-slate-400">Upload writing samples and score generated text consistency.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Brand Samples (5-10)</p>
              <Input
                value={sampleInput}
                onChange={(event) => setSampleInput(event.target.value)}
                placeholder="Paste one sample and add..."
                className="border-slate-700 bg-slate-900 text-slate-100"
              />
              <Button
                className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
                onClick={() => {
                  if (!sampleInput.trim()) return;
                  setSamples((prev) => [sampleInput.trim(), ...prev].slice(0, 10));
                  setSampleInput("");
                }}
              >
                Add Sample
              </Button>
              <div className="space-y-2">
                {samples.length === 0 ? (
                  <p className="text-sm text-slate-500">No samples added yet.</p>
                ) : (
                  samples.map((sample, index) => (
                    <div key={index} className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
                      {sample.slice(0, 180)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">Generated Output to Score</p>
              <textarea
                value={generatedContent}
                onChange={(event) => setGeneratedContent(event.target.value)}
                className="min-h-40 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
                placeholder="Paste AI-generated content..."
              />
              <Button className="bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25" onClick={() => void runScore()}>
                Score Brand Consistency
              </Button>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Brand Consistency Score</p>
                <p className="mt-1 text-3xl font-semibold text-fuchsia-100">{score ?? "--"}%</p>
                <p className="text-sm text-slate-300">{band || "Run score to see alignment band."}</p>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  {notes.map((note) => (
                    <p key={note}>- {note}</p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
