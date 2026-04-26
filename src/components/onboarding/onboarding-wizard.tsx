"use client";

import { useState } from "react";
import { CheckCircle2, FolderPlus, MailPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  async function finishOnboarding() {
    setBusy(true);
    const response = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboardingCompleted: true }),
    });
    setBusy(false);
    if (!response.ok) {
      toast.error("Unable to finish onboarding.");
      return;
    }
    toast.success("Onboarding completed.");
    window.location.assign("/dashboard/chat");
  }

  return (
    <main className="min-h-svh bg-neutral-50 p-4 text-zinc-950 md:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Card className="border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle>Welcome to AI Agent</CardTitle>
            <CardDescription>Pick one path to get value fast. You can always change these later in Account.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              { title: "Set preferences", icon: Sparkles, body: "Choose theme, notifications, and privacy defaults." },
              { title: "Invite teammates", icon: MailPlus, body: "Bring collaborators into the same workspace." },
              { title: "Create first project", icon: FolderPlus, body: "Start a project or open your first chat." },
            ].map((item, index) => {
              const Icon = item.icon;
              const active = step === index;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="size-5" />
                  <p className="mt-3 font-medium">{item.title}</p>
                  <p className={`mt-1 text-sm ${active ? "text-zinc-300" : "text-zinc-500"}`}>{item.body}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-zinc-200 bg-white">
            <CardHeader>
              <CardTitle>Quick start</CardTitle>
              <CardDescription>Pick the shortest path to your first win.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <p>Step {step + 1} of 3 is selected.</p>
              <p>
                {step === 0
                  ? "We’ll apply sensible defaults for accessibility, notifications, and privacy."
                  : step === 1
                    ? "Send the team a link and keep everyone in the same workspace."
                    : "Create a project or open chat to get your first milestone."
                }
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => setStep((value) => Math.max(0, value - 1))}>
                  Back
                </Button>
                <Button type="button" className="bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => setStep((value) => Math.min(2, value + 1))}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                Finish setup
              </CardTitle>
              <CardDescription>Mark onboarding complete once you’ve seen your first value milestone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" className="w-full bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => void finishOnboarding()} disabled={busy}>
                {busy ? "Saving..." : "Complete onboarding"}
              </Button>
              <Link href="/dashboard/chat" className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm text-zinc-700 hover:bg-zinc-50">
                Skip to chat workspace
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
