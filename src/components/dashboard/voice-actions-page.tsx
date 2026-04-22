"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function VoiceActionsPage() {
  const [transcript, setTranscript] = useState("");
  const [source, setSource] = useState<"mobile_widget" | "phone_call">("mobile_widget");
  const [result, setResult] = useState<string>("");
  const [email, setEmail] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [phoneWebhookResult, setPhoneWebhookResult] = useState("");

  async function runVoiceAction() {
    const response = await fetch("/api/voice/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript, source }),
    });
    const payload = (await response.json()) as {
      message?: string;
      actionType?: string;
      asset?: { title: string; content: string };
      error?: string;
    };
    if (!response.ok) {
      setResult(payload.error ?? "Voice action failed.");
      return;
    }
    setResult(
      [
        payload.message ?? "Action completed.",
        `Type: ${payload.actionType ?? "unknown"}`,
        `Saved: ${payload.asset?.title ?? "N/A"} - ${payload.asset?.content ?? ""}`,
      ].join("\n"),
    );
  }

  async function simulatePhoneWebhook() {
    const response = await fetch("/api/voice/phone-webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: webhookSecret ? `Bearer ${webhookSecret}` : "",
      },
      body: JSON.stringify({ userEmail: email, transcript }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setPhoneWebhookResult(response.ok ? payload.message ?? "Phone webhook accepted." : payload.error ?? "Webhook failed.");
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Voice Actions</CardTitle>
            <CardDescription className="text-slate-400">
              Use the mobile widget or phone integration to send spoken commands to your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as "mobile_widget" | "phone_call")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
            >
              <option value="mobile_widget">Mobile Widget</option>
              <option value="phone_call">Phone Call</option>
            </select>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder='Try: "add that thought about the new marketing budget to my library"'
              className="min-h-28 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            />
            <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void runVoiceAction()}>
              Run Voice Action
            </Button>
            <pre className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
              {result || "Voice action output will appear here."}
            </pre>
          </CardContent>
        </Card>

        <Card className="border-slate-700/70 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Dedicated Number Webhook</CardTitle>
            <CardDescription className="text-slate-400">
              Connect Twilio or any phone provider to `/api/voice/phone-webhook` with webhook bearer secret.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="User email for routing"
              className="border-slate-700 bg-slate-900 text-slate-100"
            />
            <Input
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
              placeholder="VOICE_WEBHOOK_SECRET"
              className="border-slate-700 bg-slate-900 text-slate-100"
            />
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-200"
              onClick={() => void simulatePhoneWebhook()}
            >
              Simulate Phone Webhook
            </Button>
            <p className="text-xs text-slate-400">{phoneWebhookResult || "No webhook test yet."}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
