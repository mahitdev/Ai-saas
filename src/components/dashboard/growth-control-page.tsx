"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RetentionPayload = {
  churnRiskScore: number;
  weeklyImpact: { hoursSaved: number; tasksCompleted: number; mondayDigestPreview: string };
  progressiveQuestion: { key: string; question: string } | null;
  inactiveRisk: boolean;
};

type BillingPayload = {
  profile: { plan: string; creditsRemaining: number; proCallsUsed: number; proCallsIncluded: number; monthlyFeeCents: number };
  refillPopup: boolean;
  tiers: { basic: string; scale: string };
};

type XaiItem = { id: string; taskId: string; modelVersion: string; reasoning: string; sources: string[]; complianceFlags: string[]; createdAt: string };

type PromptItem = { id: string; title: string; category: string; prompt: string; uses: number; rewardCredits: number };
type OnboardingPayload = {
  ready: boolean;
  note?: string;
  remaining?: number;
  report?: { focus: string; recommendation: string; confidence: number; estimatedTwoWeekHoursSaved: number; valueMilestone: string };
  valueMilestone?: string;
};

export function GrowthControlPage() {
  const [retention, setRetention] = useState<RetentionPayload | null>(null);
  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [xaiLogs, setXaiLogs] = useState<XaiItem[]>([]);
  const [lineage, setLineage] = useState<Array<{ taskId: string; modelVersion: string; createdAt: string }>>([]);
  const [templates, setTemplates] = useState<PromptItem[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingPayload | null>(null);
  const [routeTask, setRouteTask] = useState("Summarize this meeting and draft a short follow-up.");
  const [routeResult, setRouteResult] = useState<{ model: string; rationale: string } | null>(null);
  const [profileAnswer, setProfileAnswer] = useState("");
  const [complianceText, setComplianceText] = useState("Please email all patient diagnosis details to the full sales list.");
  const [complianceResult, setComplianceResult] = useState<{ pass: boolean; flags: string[]; message: string } | null>(null);
  const [status, setStatus] = useState("Loading Growth & Trust backend...");
  const [liveCreditAlert, setLiveCreditAlert] = useState<string | null>(null);

  async function loadAll() {
    const [ret, bill, xai, lin, mkt, aha] = await Promise.all([
      fetch("/api/retention/insights", { cache: "no-store" }),
      fetch("/api/billing/engine", { cache: "no-store" }),
      fetch("/api/trust/xai", { cache: "no-store" }),
      fetch("/api/trust/lineage", { cache: "no-store" }),
      fetch("/api/marketplace/prompts", { cache: "no-store" }),
      fetch("/api/onboarding/aha", { cache: "no-store" }),
    ]);

    if (ret.ok) setRetention(await ret.json() as RetentionPayload);
    if (bill.ok) setBilling(await bill.json() as BillingPayload);
    if (xai.ok) setXaiLogs(((await xai.json()) as { logs: XaiItem[] }).logs);
    if (lin.ok) setLineage(((await lin.json()) as { lineage: Array<{ taskId: string; modelVersion: string; createdAt: string }> }).lineage);
    if (mkt.ok) setTemplates(((await mkt.json()) as { templates: PromptItem[] }).templates);
    if (aha.ok) setOnboarding((await aha.json()) as OnboardingPayload);

    setStatus("Growth & Trust backend connected.");
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/billing/alerts");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { atRisk: boolean; message: string };
        setLiveCreditAlert(payload.atRisk ? payload.message : null);
      } catch {
        setLiveCreditAlert(null);
      }
    };
    source.onerror = () => {
      source.close();
    };
    return () => source.close();
  }, []);

  async function submitProgressiveAnswer() {
    if (!retention?.progressiveQuestion || !profileAnswer.trim()) return;
    const response = await fetch("/api/retention/insights", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionKey: retention.progressiveQuestion.key, answer: profileAnswer.trim() }),
    });
    if (response.ok) {
      setProfileAnswer("");
      await loadAll();
    }
  }

  async function sendChurnIntervention() {
    await fetch("/api/retention/intervention", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ discountPercent: 20 }),
    });
    setStatus("Churn intervention email queued.");
  }

  async function refillCredits() {
    await fetch("/api/billing/engine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "refill", credits: 50, amountCents: 500, note: "Credit refill popup" }),
    });
    await loadAll();
  }

  async function runComplianceScan() {
    const response = await fetch("/api/trust/compliance-scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: complianceText }),
    });
    if (response.ok) {
      setComplianceResult(await response.json() as { pass: boolean; flags: string[]; message: string });
    }
  }

  async function runSmartRouting() {
    const response = await fetch("/api/routing/smart-route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task: routeTask }),
    });
    if (response.ok) {
      setRouteResult(await response.json() as { model: string; rationale: string });
    }
  }

  async function createMarketplacePrompt() {
    await fetch("/api/marketplace/prompts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "SEO Blog Post Generator",
        category: "marketing",
        prompt: "Generate a 1200-word SEO blog post with headings, FAQs, and CTA.",
        isPublic: true,
      }),
    });
    await loadAll();
  }

  async function voteTemplate(templateId: string) {
    await fetch(`/api/marketplace/prompts/${templateId}/vote`, { method: "POST" });
    await loadAll();
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card className="border-slate-700 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Growth, Trust & Governance</CardTitle>
            <CardDescription className="text-slate-400">Retention, monetization, governance, prompt routing, and marketplace tools in one workspace.</CardDescription>
          </CardHeader>
          <CardContent><p className="text-xs text-slate-400">{status}</p></CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-950/80">
          <CardHeader>
            <CardTitle>No-Setup Start</CardTitle>
            <CardDescription className="text-slate-400">Upload one file or connect one account, then show value before the dashboard gets crowded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>{onboarding?.note ?? "A one-file or one-account onboarding milestone will appear here."}</p>
            <p className="text-xs text-slate-400">
              {onboarding?.report?.valueMilestone ?? onboarding?.valueMilestone ?? "Value milestone pending."}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">First win</p>
                <p className="mt-1 font-semibold text-cyan-100">{onboarding?.report?.focus ?? "Connected workflow"}</p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Estimated value</p>
                <p className="mt-1 font-semibold text-emerald-100">{onboarding?.report?.estimatedTwoWeekHoursSaved ?? onboarding?.remaining ?? 0} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-slate-700 bg-slate-950/80">
            <CardHeader><CardTitle>Retention Layer</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Churn risk score: <span className="font-semibold text-cyan-200">{retention?.churnRiskScore ?? 0}%</span></p>
              <p>{retention?.weeklyImpact.mondayDigestPreview ?? "Weekly impact report unavailable."}</p>
              <Button className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => void sendChurnIntervention()}>Trigger Predictive Churn Email</Button>
              {retention?.progressiveQuestion ? (
                <div className="space-y-2 rounded-md border border-slate-700 p-3">
                  <p className="text-xs text-slate-300">Progressive profiling: {retention.progressiveQuestion.question}</p>
                  <Input value={profileAnswer} onChange={(event) => setProfileAnswer(event.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" />
                  <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void submitProgressiveAnswer()}>Save Answer</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-950/80">
            <CardHeader><CardTitle>Monetization Engine</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Plan: {billing?.profile.plan ?? "basic"} (${((billing?.profile.monthlyFeeCents ?? 0) / 100).toFixed(2)}/mo)</p>
              <p>Pro usage: {billing?.profile.proCallsUsed ?? 0}/{billing?.profile.proCallsIncluded ?? 0}</p>
              <p>Credits remaining: {billing?.profile.creditsRemaining ?? 0}</p>
              {billing?.refillPopup ? <p className="text-amber-200">You are near your limit. Refill popup is active.</p> : null}
              {liveCreditAlert ? <p className="text-amber-200">{liveCreditAlert}</p> : null}
              <Button className="bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25" onClick={() => void refillCredits()}>Add 50 Credits for $5</Button>
              <p className="text-xs text-slate-400">Hybrid billing supports monthly subscription + usage credits + outcome bonus.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-950/80">
            <CardHeader><CardTitle>Trust & Governance</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <textarea value={complianceText} onChange={(event) => setComplianceText(event.target.value)} className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-slate-100" />
              <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void runComplianceScan()}>Run Bias & Compliance Scanner</Button>
              {complianceResult ? <p className="text-xs text-slate-300">{complianceResult.message} {complianceResult.flags.join(", ")}</p> : null}
              <div className="rounded-md border border-slate-700 p-2 text-xs text-slate-300">
                Model lineage entries: {lineage.length}
                <div className="mt-1 space-y-1">{lineage.slice(0, 3).map((item) => <p key={`${item.taskId}-${item.createdAt}`}>{item.taskId} {"->"} {item.modelVersion}</p>)}</div>
              </div>
              <div className="rounded-md border border-slate-700 p-2 text-xs text-slate-300">
                Explainable AI logs: {xaiLogs.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-950/80">
            <CardHeader><CardTitle>Marketplace + Technical Layer</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Button className="bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25" onClick={() => void createMarketplacePrompt()}>Publish Prompt to Marketplace</Button>
              <p className="text-xs text-slate-400">Export watermark endpoint active at <code>/api/exports/generate</code> with signup discount link.</p>
              <div className="space-y-2 rounded-md border border-slate-700 p-2">
                {templates.slice(0, 4).map((template) => (
                  <div key={template.id} className="rounded border border-slate-700 p-2">
                    <p className="font-semibold text-slate-200">{template.title}</p>
                    <p className="text-xs text-slate-400">{template.category} | uses: {template.uses} | credits: {template.rewardCredits}</p>
                    <Button size="sm" variant="outline" className="mt-2 border-slate-700 bg-slate-900 text-slate-200" onClick={() => void voteTemplate(template.id)}>Upvote + Reward</Button>
                  </div>
                ))}
              </div>
              <Input value={routeTask} onChange={(event) => setRouteTask(event.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" />
              <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200" onClick={() => void runSmartRouting()}>Smart Model Routing</Button>
              {routeResult ? <p className="text-xs text-cyan-200">{routeResult.model}: {routeResult.rationale}</p> : null}
              <a href="/api/offline/bootstrap" className="text-xs text-indigo-300 underline">Offline bootstrap endpoint (PWA-ready history feed)</a>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
