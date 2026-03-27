"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Lock, Mic, Sparkles } from "lucide-react";

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
    <main className="relative min-h-svh overflow-hidden bg-[#05060a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.20),transparent_32%),radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.20),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.03)_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_1px)] bg-[size:36px_36px]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 md:px-10">
        <section className="space-y-6">
          <Badge className="border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
            AI Voice + Memory Chat
          </Badge>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            Your personal AI that
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
              remembers every conversation
            </span>
          </h1>

          <p className="max-w-2xl text-base text-slate-300 md:text-lg">
            Chat naturally, talk with voice, and keep long-term context. Built with secure auth and memory-backed conversations.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-200">
              <Link href="/auth/sign-up">
                Start chatting
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Bot className="size-5 text-cyan-300" />
              <p className="font-medium">Conversational AI</p>
              <p className="text-sm text-slate-400">Ask anything and keep context across chats.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Mic className="size-5 text-blue-300" />
              <p className="font-medium">Talk Naturally</p>
              <p className="text-sm text-slate-400">Voice input and spoken AI responses.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Sparkles className="size-5 text-fuchsia-300" />
              <p className="font-medium">Smart Memory</p>
              <p className="text-sm text-slate-400">Important details are remembered over time.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="space-y-2 p-5">
              <Lock className="size-5 text-emerald-300" />
              <p className="font-medium">Secure by default</p>
              <p className="text-sm text-slate-400">Protected auth and hardened API layer.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
