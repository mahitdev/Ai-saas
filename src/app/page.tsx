"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Camera,
  Cpu,
  Mail,
  History,
  Command,
  Lock,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  Palette,
  Zap,
} from "lucide-react";

import { authClient } from "@/lib/auth.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [agentStep, setAgentStep] = useState(0);
  const [teamSize, setTeamSize] = useState(8);
  const [manualHours, setManualHours] = useState(120);
  const [displayHoursSaved, setDisplayHoursSaved] = useState(0);
  const [displayDollarsSaved, setDisplayDollarsSaved] = useState(0);
  const [selectedIntegration, setSelectedIntegration] = useState("Slack");

  const integrationRecipes: Record<string, string> = {
    Slack: "When a task completes, MyAI posts summary + next steps into #ops in under 15 seconds.",
    GitHub: "MyAI reads PR context, drafts review notes, and pushes issue-ready action lists.",
    Notion: "MyAI converts chat outputs into structured docs and updates team playbooks automatically.",
    Gmail: "MyAI drafts follow-up emails from meeting context with editable tone presets.",
    Linear: "MyAI creates tickets from conversations and assigns owners by workload hints.",
    HubSpot: "MyAI summarizes account threads and drafts personalized outreach sequences.",
  };

  const targetHoursSaved = useMemo(() => Math.round(teamSize * manualHours * 0.38), [teamSize, manualHours]);
  const targetDollarsSaved = useMemo(() => Math.round(targetHoursSaved * 42), [targetHoursSaved]);

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAgentStep((current) => (current + 1) % 4);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const durationMs = 700;
    const tickMs = 20;
    const totalTicks = Math.max(1, Math.floor(durationMs / tickMs));
    const startHours = 0;
    const startDollars = 0;
    let tick = 0;

    const timer = setInterval(() => {
      tick += 1;
      const progress = Math.min(1, tick / totalTicks);
      setDisplayHoursSaved(Math.round(startHours + (targetHoursSaved - startHours) * progress));
      setDisplayDollarsSaved(Math.round(startDollars + (targetDollarsSaved - startDollars) * progress));
      if (progress >= 1) clearInterval(timer);
    }, tickMs);

    return () => clearInterval(timer);
  }, [targetHoursSaved, targetDollarsSaved]);

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#05060a] text-slate-200">
        <p className="text-sm text-slate-400">Opening your AI space...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-[130svh] overflow-hidden bg-[#05060a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.20),transparent_32%),radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.20),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.03)_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute -left-12 top-24 h-48 w-48 rounded-full bg-cyan-400/30 animate-glow-pulse" />
      <div className="pointer-events-none absolute right-8 top-40 h-40 w-40 rounded-full bg-indigo-400/30 animate-glow-pulse [animation-delay:0.8s]" />
      <div className="pointer-events-none absolute bottom-20 left-[35%] h-36 w-36 rounded-full bg-fuchsia-400/20 animate-glow-pulse [animation-delay:1.6s]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[90rem] flex-col justify-center gap-14 px-6 py-16 md:px-10 md:py-24">
        <section className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div className="space-y-6">
            <Badge className="border-cyan-400/40 bg-cyan-500/10 text-cyan-200 [text-shadow:0_0_10px_rgba(34,211,238,0.6)]">
              AI Voice + Memory Chat
            </Badge>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-100 [text-shadow:0_0_22px_rgba(148,163,184,0.35)] md:text-7xl">
              Your personal AI that
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent [filter:drop-shadow(0_0_16px_rgba(34,211,238,0.45))]">
                remembers every conversation
              </span>
            </h1>

            <p className="max-w-2xl text-base text-slate-300 [text-shadow:0_0_10px_rgba(15,23,42,0.7)] md:text-xl">
              Chat naturally, talk with voice, and keep long-term context. Built with secure auth and memory-backed conversations.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="border border-cyan-300/40 bg-cyan-500/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:bg-cyan-500/20 hover:text-cyan-50">
                <Link href="/auth/sign-up">
                  Start chatting
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20">
                <Link href="/contact">
                  Contact
                  <Mail className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 animate-drift-x">
            <Card className="overflow-hidden border-cyan-500/30 bg-slate-950/80 shadow-[0_0_35px_rgba(34,211,238,0.2)] transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
              <CardContent className="p-0">
                <Image
                  src="/hero-neon-chat.svg"
                  alt="Neon AI chat illustration"
                  width={1200}
                  height={800}
                  className="h-auto w-full animate-float-slow"
                  priority
                />
              </CardContent>
            </Card>
            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="border-indigo-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.02]">
                <CardContent className="space-y-2 p-4">
                  <Brain className="size-5 text-indigo-300 animate-float-mid" />
                  <p className="text-sm font-medium text-indigo-100">Memory Graph</p>
                  <p className="text-xs text-slate-400">Every session keeps useful context alive for better responses.</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.02]">
                <CardContent className="space-y-2 p-4">
                  <ShieldCheck className="size-5 text-emerald-300 animate-float-mid [animation-delay:0.3s]" />
                  <p className="text-sm font-medium text-emerald-100">Secure Access</p>
                  <p className="text-xs text-slate-400">Authenticated workspace with protected APIs and user-owned chats.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Bot className="size-5 text-cyan-300" />
              <p className="font-medium text-cyan-100 [text-shadow:0_0_12px_rgba(34,211,238,0.5)]">Conversational AI</p>
              <p className="text-sm text-slate-400">Ask anything and keep context across chats.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Mic className="size-5 text-blue-300" />
              <p className="font-medium text-blue-100 [text-shadow:0_0_12px_rgba(96,165,250,0.55)]">Talk Naturally</p>
              <p className="text-sm text-slate-400">Voice input and spoken AI responses.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Sparkles className="size-5 text-fuchsia-300" />
              <p className="font-medium text-fuchsia-100 [text-shadow:0_0_12px_rgba(217,70,239,0.55)]">Smart Memory</p>
              <p className="text-sm text-slate-400">Important details are remembered over time.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Lock className="size-5 text-emerald-300" />
              <p className="font-medium text-emerald-100 [text-shadow:0_0_12px_rgba(52,211,153,0.55)]">Secure by default</p>
              <p className="text-sm text-slate-400">Protected auth and hardened API layer.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="overflow-hidden border-slate-800 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
            <CardContent className="p-0">
              <Image
                src="/hero-memory-orb.svg"
                alt="AI memory orb visual"
                width={1200}
                height={700}
                className="h-auto w-full animate-float-slow [animation-delay:0.6s]"
              />
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-4 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Why users love it</p>
              <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">
                A bigger, richer front page with image-led storytelling.
              </h2>
              <p className="text-slate-300">
                This UI is now larger, more visual, and designed to immediately show what your AI product does. The neon dark style keeps the brand feeling premium and interactive.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300 sm:text-sm">
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-lg font-semibold text-cyan-300">24/7</p>
                  AI replies
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-lg font-semibold text-indigo-300">Voice</p>
                  input/output
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-lg font-semibold text-fuchsia-300">Memory</p>
                  persistent
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="overflow-hidden border-cyan-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
            <CardContent className="p-0">
              <Image
                src="/hero-voice-wave.svg"
                alt="Voice waveform visual"
                width={900}
                height={600}
                className="h-auto w-full animate-float-mid"
              />
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-indigo-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
            <CardContent className="p-0">
              <Image
                src="/hero-security-grid.svg"
                alt="Security shield visual"
                width={900}
                height={600}
                className="h-auto w-full animate-float-mid [animation-delay:0.4s]"
              />
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-fuchsia-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
            <CardContent className="p-0">
              <Image
                src="/hero-neon-chat.svg"
                alt="AI interaction visual"
                width={900}
                height={600}
                className="h-auto w-full animate-float-mid [animation-delay:0.8s]"
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">What this app does</p>
              <h3 className="text-2xl font-semibold text-slate-100 md:text-3xl">An AI assistant with memory, voice, and secure accounts.</h3>
              <p className="text-slate-300">
                Users can create multiple chats, talk with voice input, get spoken responses, and continue conversations with saved memory context.
                Every account has its own protected workspace, conversation history, and API-based chat backend.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-cyan-200">
                    <MessagesSquare className="size-4" />
                    <p className="text-sm font-medium">Multi-Chat Workspace</p>
                  </div>
                  <p className="text-xs text-slate-400">Create, switch, and manage separate conversation threads instantly.</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-indigo-200">
                    <History className="size-4" />
                    <p className="text-sm font-medium">Context Memory</p>
                  </div>
                  <p className="text-xs text-slate-400">The assistant remembers important details to reduce repeated prompts.</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-fuchsia-200">
                    <Mic className="size-4" />
                    <p className="text-sm font-medium">Voice Interaction</p>
                  </div>
                  <p className="text-xs text-slate-400">Speak naturally with mic input and hear AI output via text-to-speech.</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-emerald-200">
                    <Lock className="size-4" />
                    <p className="text-sm font-medium">Secure Access</p>
                  </div>
                  <p className="text-xs text-slate-400">Auth-protected dashboard and user-scoped conversation data.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="overflow-hidden border-cyan-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BarChart3 className="size-4" />
                  <p className="text-sm font-medium">Engagement Graph</p>
                </div>
                <Image src="/hero-graph-line.svg" alt="Line graph showing rising engagement" width={1200} height={600} className="h-auto w-full rounded-md" />
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-indigo-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Zap className="size-4" />
                  <p className="text-sm font-medium">Feature Usage Graph</p>
                </div>
                <Image src="/hero-graph-bars.svg" alt="Bar graph for feature usage metrics" width={1200} height={600} className="h-auto w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden border-fuchsia-500/25 bg-slate-950/70 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
            <CardContent className="p-0">
              <Image
                src="/hero-hologram-network.svg"
                alt="Animated style AI hologram network visual"
                width={1200}
                height={700}
                className="h-auto w-full animate-float-slow"
              />
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-4 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300">Brilliant Experience</p>
              <h3 className="text-2xl font-semibold text-slate-100 md:text-3xl">
                Visual, intelligent, and designed to keep users engaged.
              </h3>
              <p className="text-slate-300">
                The front page now blends motion, neon gradients, and rich storytelling blocks to explain exactly what your AI platform offers: memory chat, voice conversation, secure sessions, and productivity-focused assistance.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 sm:text-sm">
                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="font-semibold text-cyan-300">Interactive visuals</p>
                  Floating art cards + dynamic glow layers.
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="font-semibold text-indigo-300">Guided flow</p>
                  Clear path from landing to sign-up and dashboard.
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="font-semibold text-fuchsia-300">Feature explainers</p>
                  Multi-chat, memory, voice, and security sections.
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="font-semibold text-emerald-300">User trust</p>
                  Auth-protected accounts with scoped conversation history.
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Mic className="size-5 text-cyan-300" />
              <p className="font-medium text-cyan-100">One-to-One Live Talk</p>
              <p className="text-xs text-slate-400">Hands-free mode keeps listening after each AI reply.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Camera className="size-5 text-emerald-300" />
              <p className="font-medium text-emerald-100">Face-to-Face Camera</p>
              <p className="text-xs text-slate-400">Send live or captured frames with your prompts to AI.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Cpu className="size-5 text-fuchsia-300" />
              <p className="font-medium text-fuchsia-100">Model Switcher</p>
              <p className="text-xs text-slate-400">Pick ChatGPT, Gemini, or Auto fallback mode anytime.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/60 transition-transform duration-500 hover:-translate-y-1">
            <CardContent className="space-y-2 p-5">
              <Palette className="size-5 text-amber-300" />
              <p className="font-medium text-amber-100">Theme Controls</p>
              <p className="text-xs text-slate-400">Light, dark, and system theme options in dashboard sidebar.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className="border-cyan-500/25 bg-slate-900/60">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Real-Time Agent Showcase</p>
              <h3 className="text-2xl font-semibold text-slate-100">Our AI doesn&apos;t just chat; it executes.</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="text-cyan-200">Task</p>
                  <p className="mt-1">&quot;Analyze Q2 budget, summarize risks, draft stakeholder update.&quot;</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3 text-xs">
                  <p className={`${agentStep >= 1 ? "text-emerald-300" : "text-slate-500"}`}>Thinking</p>
                  <p className={`${agentStep >= 2 ? "text-emerald-300" : "text-slate-500"}`}>Searching</p>
                  <p className={`${agentStep >= 3 ? "text-emerald-300" : "text-slate-500"}`}>Executing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/25 bg-slate-900/60">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Cost vs Savings Calculator</p>
              <div className="space-y-3 text-sm text-slate-300">
                <label className="block">
                  Team size: <span className="text-indigo-200">{teamSize}</span>
                  <input type="range" min={1} max={120} value={teamSize} onChange={(event) => setTeamSize(Number(event.target.value))} className="mt-1 w-full" />
                </label>
                <label className="block">
                  Manual task hours/month: <span className="text-indigo-200">{manualHours}</span>
                  <input type="range" min={10} max={600} value={manualHours} onChange={(event) => setManualHours(Number(event.target.value))} className="mt-1 w-full" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-400">Hours saved / month</p>
                  <p className="text-2xl font-semibold text-cyan-200">{displayHoursSaved}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-400">Dollars saved / month</p>
                  <p className="text-2xl font-semibold text-emerald-200">${displayDollarsSaved.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-emerald-500/25 bg-slate-900/60">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Privacy Shield</p>
              <h3 className="text-2xl font-semibold text-slate-100">Built with trust from the ground up.</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-2 text-emerald-200">SOC2 Ready</div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-2 text-cyan-200">GDPR Aligned</div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-2 text-indigo-200">Zero-Trust</div>
              </div>
              <p className="text-sm text-slate-300">
                Zero-Trust Data Scrubbing masks sensitive data before model calls, and your data is never used for model training.
              </p>
            </CardContent>
          </Card>

          <Card className="border-fuchsia-500/25 bg-slate-900/60">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300">Power Users</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-400">Last week impact</p>
                  <p className="text-xl font-semibold text-fuchsia-200">4.5M lines generated</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-400">Ops savings</p>
                  <p className="text-xl font-semibold text-fuchsia-200">$200k saved</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">Used by startup CTOs, RevOps teams, legal ops leads, and product managers shipping daily.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Integrations Wall</p>
              <div className="overflow-hidden rounded-md border border-slate-700 bg-slate-950/60 py-2">
                <div className="flex min-w-max gap-8 px-4 text-sm text-slate-300 animate-marquee">
                  {Object.keys(integrationRecipes).map((name) => (
                    <button key={`m1-${name}`} type="button" onClick={() => setSelectedIntegration(name)} className="hover:text-cyan-200">
                      {name}
                    </button>
                  ))}
                  {Object.keys(integrationRecipes).map((name) => (
                    <button key={`m2-${name}`} type="button" onClick={() => setSelectedIntegration(name)} className="hover:text-cyan-200">
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-300">
                <p className="text-cyan-200">{selectedIntegration} recipe (15s):</p>
                <p className="mt-1">{integrationRecipes[selectedIntegration]}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/25 bg-slate-900/60">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Global Cmd+K Preview</p>
              <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3 font-mono text-xs text-slate-200">
                <p className="text-indigo-200">
                  <Command className="mr-1 inline size-3" />
                  K {"->"} /summarize-last-week-tickets --team=eng --priority=high
                </p>
                <p className="mt-1 text-slate-400">Navigating your business at the speed of thought...</p>
              </div>
              <p className="text-sm text-slate-300">Navigate your entire business at the speed of thought.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
