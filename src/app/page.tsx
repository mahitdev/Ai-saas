import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  Cpu,
  Lock,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSession } from "@/lib/server/session";

const featurePillars = [
  {
    icon: MessagesSquare,
    title: "Structured chat",
    description: "Keep conversations grouped, searchable, and easy to resume.",
  },
  {
    icon: Mic,
    title: "Voice workflows",
    description: "Speak naturally, capture tasks, and move between voice and text.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted by default",
    description: "Auth, security controls, and scoped data access are built in.",
  },
  {
    icon: Brain,
    title: "Long-term memory",
    description: "Important context is retained so answers feel continuous.",
  },
  {
    icon: BarChart3,
    title: "Operational clarity",
    description: "Analytics and weekly summaries turn usage into decisions.",
  },
  {
    icon: Sparkles,
    title: "Automated execution",
    description: "Workflow helpers turn prompts into actions instead of noise.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Capture the request",
    description: "Start in chat, voice, or a task-focused screen.",
  },
  {
    step: "02",
    title: "Organize the context",
    description: "The workspace stores memory, tasks, and source material together.",
  },
  {
    step: "03",
    title: "Ship the output",
    description: "Export summaries, track progress, and continue without starting over.",
  },
];

const stats = [
  { value: "24/7", label: "always-on assistance" },
  { value: "Memory", label: "persistent context" },
  { value: "Secure", label: "authenticated workspace" },
];

const trustCards = [
  {
    icon: Lock,
    title: "Private sessions",
    description: "User-scoped conversations and protected APIs keep data separated.",
  },
  {
    icon: Calendar,
    title: "Weekly digest",
    description: "Summaries and insights keep the team aligned without extra admin work.",
  },
  {
    icon: Cpu,
    title: "Model routing",
    description: "Choose the right model path for speed, depth, or fallback behavior.",
  },
  {
    icon: CheckCircle2,
    title: "Cleaner handoffs",
    description: "Clear modules and reusable cards make the interface easier to scan.",
  },
];

export default async function Home() {
  const session = await getServerSession();

  if (session?.user) {
    redirect("/dashboard/chat");
  }

  return (
    <main className="relative overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.025)_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.025)_1px)] bg-[size:40px_40px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-8 md:px-6 md:py-12">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Badge className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100">MyAI workspace</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-50 md:text-7xl">
                An organized AI home for chat, tasks, memory, and automation.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                The product now presents a simpler front door and a cleaner internal structure. Start with one conversation,
                keep the context, and move into reports, security, and workflow tools without feeling lost.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                <Link href="/auth/sign-up">
                  Get started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
                <Link href="/contact">Contact</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <Card key={stat.label} className="app-surface border-white/10 bg-slate-950/60">
                  <CardContent className="space-y-1 p-4">
                    <p className="text-2xl font-semibold text-slate-50">{stat.value}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="app-surface overflow-hidden border-cyan-500/20">
              <CardContent className="p-0">
                <Image
                  src="/hero-neon-chat.svg"
                  alt="MyAI chat preview"
                  width={1200}
                  height={800}
                  priority
                  className="h-auto w-full"
                />
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="app-surface border-white/10">
                <CardContent className="space-y-2 p-4">
                  <Brain className="size-5 text-cyan-300" />
                  <p className="font-medium text-slate-50">Memory first</p>
                  <p className="text-sm text-slate-400">Keep useful context available without repeating yourself.</p>
                </CardContent>
              </Card>
              <Card className="app-surface border-white/10">
                <CardContent className="space-y-2 p-4">
                  <ShieldCheck className="size-5 text-emerald-300" />
                  <p className="font-medium text-slate-50">Safer by default</p>
                  <p className="text-sm text-slate-400">Protected routes, auth checks, and clean API boundaries.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Core modules</p>
            <h2 className="text-3xl font-semibold text-slate-50">Everything is grouped into clear, reusable sections.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featurePillars.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="app-surface border-white/10">
                  <CardContent className="space-y-3 p-5">
                    <Icon className="size-5 text-cyan-300" />
                    <h3 className="text-lg font-medium text-slate-50">{feature.title}</h3>
                    <p className="text-sm leading-6 text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="app-surface border-white/10">
            <CardContent className="space-y-4 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">How it flows</p>
              <h2 className="text-3xl font-semibold text-slate-50">A cleaner path from request to result.</h2>
              <div className="space-y-3">
                {workflowSteps.map((item) => (
                  <div key={item.step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-cyan-300">{item.step}</div>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-50">{item.title}</p>
                      <p className="text-sm leading-6 text-slate-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="app-surface overflow-hidden border-indigo-500/20">
              <CardContent className="p-0">
                <Image
                  src="/hero-graph-line.svg"
                  alt="Engagement trend illustration"
                  width={1200}
                  height={600}
                  className="h-auto w-full"
                />
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="app-surface border-white/10">
                    <CardContent className="space-y-2 p-4">
                      <Icon className="size-5 text-fuchsia-300" />
                      <p className="font-medium text-slate-50">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="app-surface border-white/10">
            <CardContent className="space-y-4 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-300">What is included</p>
              <h2 className="text-3xl font-semibold text-slate-50">Chat, voice, security, reports, and developer tools in one place.</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                The interface now keeps the main product story simple: one landing page, one dashboard shell, and focused
                sections for each major workflow. That makes the app easier to understand and easier to extend.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-slate-50">Conversation memory</p>
                  <p className="mt-1 text-sm text-slate-400">Useful context stays attached to the right chat.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-slate-50">Live voice</p>
                  <p className="mt-1 text-sm text-slate-400">Voice actions and responses remain part of the workflow.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-slate-50">Reports and analytics</p>
                  <p className="mt-1 text-sm text-slate-400">Summaries help teams review what happened last week.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-slate-50">Security and governance</p>
                  <p className="mt-1 text-sm text-slate-400">Trust features are grouped so they are easy to find.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="app-surface overflow-hidden border-cyan-500/20">
            <CardContent className="p-0">
              <Image
                src="/hero-memory-orb.svg"
                alt="Memory visualization"
                width={1200}
                height={800}
                className="h-auto w-full"
              />
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 md:flex-row md:items-center md:px-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Ready to begin</p>
            <h2 className="text-2xl font-semibold text-slate-50 md:text-3xl">Open a cleaner workspace and start with one focused task.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
              <Link href="/auth/sign-in">Return to sign in</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
