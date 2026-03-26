"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Lock, Rocket, ShieldCheck } from "lucide-react";

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
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_15%_10%,_rgba(37,99,235,0.22),_transparent_30%),radial-gradient(circle_at_85%_10%,_rgba(14,165,233,0.2),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-8 p-6 md:p-10">
        <div className="space-y-4 text-center md:text-left">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            Secure AI SaaS Workspace
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            Build, track, and ship
            <span className="block text-sky-700">in one protected dashboard</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-600 md:mx-0 md:text-lg">
            A secure app foundation with authenticated APIs, task workflows, and an interactive project workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Start Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <ShieldCheck className="size-5 text-indigo-600" />
              <p className="font-semibold">Auth-Protected API</p>
              <p className="text-sm text-muted-foreground">Every data route requires a valid user session.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <Lock className="size-5 text-emerald-600" />
              <p className="font-semibold">Security Headers</p>
              <p className="text-sm text-muted-foreground">CSP and browser hardening enabled at middleware level.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <Bot className="size-5 text-sky-600" />
              <p className="font-semibold">Interactive Workspace</p>
              <p className="text-sm text-muted-foreground">Create projects, manage tasks, filter and track progress.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white/80 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <Rocket className="size-5 text-orange-600" />
              <p className="font-semibold">Production Ready</p>
              <p className="text-sm text-muted-foreground">Structured backend with clean Next.js + Drizzle architecture.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
