"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Brain, Lock, Mic, ShieldCheck, Sparkles } from "lucide-react";

import { authClient } from "@/lib/auth.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#05060a] text-slate-200">
        <p className="text-sm text-slate-400">Opening your AI space...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-[110svh] overflow-hidden bg-[#05060a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.20),transparent_32%),radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.20),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.03)_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_1px)] bg-[size:36px_36px]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col justify-center gap-10 px-6 py-12 md:px-10 md:py-16">
        <section className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
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
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="overflow-hidden border-cyan-500/30 bg-slate-950/80 shadow-[0_0_35px_rgba(34,211,238,0.2)]">
              <CardContent className="p-0">
                <Image
                  src="/hero-neon-chat.svg"
                  alt="Neon AI chat illustration"
                  width={1200}
                  height={800}
                  className="h-auto w-full"
                  priority
                />
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-indigo-500/25 bg-slate-950/70">
                <CardContent className="space-y-2 p-4">
                  <Brain className="size-5 text-indigo-300" />
                  <p className="text-sm font-medium text-indigo-100">Memory Graph</p>
                  <p className="text-xs text-slate-400">Every session keeps useful context alive for better responses.</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/25 bg-slate-950/70">
                <CardContent className="space-y-2 p-4">
                  <ShieldCheck className="size-5 text-emerald-300" />
                  <p className="text-sm font-medium text-emerald-100">Secure Access</p>
                  <p className="text-xs text-slate-400">Authenticated workspace with protected APIs and user-owned chats.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Bot className="size-5 text-cyan-300" />
              <p className="font-medium text-cyan-100 [text-shadow:0_0_12px_rgba(34,211,238,0.5)]">Conversational AI</p>
              <p className="text-sm text-slate-400">Ask anything and keep context across chats.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Mic className="size-5 text-blue-300" />
              <p className="font-medium text-blue-100 [text-shadow:0_0_12px_rgba(96,165,250,0.55)]">Talk Naturally</p>
              <p className="text-sm text-slate-400">Voice input and spoken AI responses.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Sparkles className="size-5 text-fuchsia-300" />
              <p className="font-medium text-fuchsia-100 [text-shadow:0_0_12px_rgba(217,70,239,0.55)]">Smart Memory</p>
              <p className="text-sm text-slate-400">Important details are remembered over time.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Lock className="size-5 text-emerald-300" />
              <p className="font-medium text-emerald-100 [text-shadow:0_0_12px_rgba(52,211,153,0.55)]">Secure by default</p>
              <p className="text-sm text-slate-400">Protected auth and hardened API layer.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="overflow-hidden border-slate-800 bg-slate-950/70">
            <CardContent className="p-0">
              <Image
                src="/hero-memory-orb.svg"
                alt="AI memory orb visual"
                width={1200}
                height={700}
                className="h-auto w-full"
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
      </div>
    </main>
  );
}
