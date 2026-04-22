"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Flame, Shield, TimerReset, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

const stats = [
  { label: "Focus blocks", value: "12" },
  { label: "Daily streak", value: "28 days" },
  { label: "Completion", value: "94%" },
];

const highlights = [
  {
    icon: TimerReset,
    title: "Deep sessions",
    description: "Build routines around protected focus windows that actually stick.",
  },
  {
    icon: TrendingUp,
    title: "Momentum tracking",
    description: "Watch progress compounds through a calm, high-signal interface.",
  },
  {
    icon: Shield,
    title: "Distraction shield",
    description: "Keep your work lane clean with a product that feels intentional.",
  },
];

function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

function ThreeDButton({
  children,
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(
        "group relative isolate overflow-hidden rounded-full border border-cyan-300/20 bg-white/5 px-7 py-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(6,182,212,0.18)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.08] active:translate-y-0.5 active:scale-[0.98] focus-visible:ring-cyan-300/30",
        "before:absolute before:inset-0 before:translate-y-[52%] before:rounded-full before:bg-black/35 before:blur-md before:content-['']",
        "after:absolute after:inset-[1px] after:rounded-full after:border after:border-white/15 after:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))] after:content-['']",
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Button>
  );
}

export function GrindLockLanding() {
  const heroRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pointer, setPointer] = useState<PointerState>({ x: 50, y: 50, active: false });
  const reducedMotion = useReducedMotion();
  const [seconds, setSeconds] = useState(27 * 60 + 14);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((current) => (current + 1) % (45 * 60));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setPointer({
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          active: true,
        });
      });
    };

    const onLeave = () => setPointer((current) => ({ ...current, active: false }));

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);

    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || reducedMotion) return;

    const tiltX = ((pointer.y - 50) / 50) * -7;
    const tiltY = ((pointer.x - 50) / 50) * 10;
    panel.style.setProperty("--tilt-x", `${tiltX}deg`);
    panel.style.setProperty("--tilt-y", `${tiltY}deg`);
    panel.style.setProperty("--parallax-x", `${(pointer.x - 50) / 10}px`);
    panel.style.setProperty("--parallax-y", `${(pointer.y - 50) / 10}px`);
    panel.style.setProperty("--glow-opacity", pointer.active ? "0.85" : "0.55");
  }, [pointer, reducedMotion]);

  const timerMinutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const timerSeconds = String(seconds % 60).padStart(2, "0");
  const progress = 78;

  return (
    <main ref={heroRef} className="relative min-h-[100svh] overflow-hidden bg-[#02040c] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90 transition-[background-position] duration-500"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(139, 92, 246, 0.22), transparent 20%), radial-gradient(circle at 78% 20%, rgba(59, 130, 246, 0.18), transparent 24%), radial-gradient(circle at 50% 88%, rgba(6, 182, 212, 0.12), transparent 32%), linear-gradient(180deg, #02040c 0%, #040814 48%, #02040c 100%)",
          backgroundPosition: `${pointer.x}% ${pointer.y}%`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,12,0.08)_58%,rgba(2,4,12,0.38)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.16] mix-blend-screen" />

      <div className="glow-orb glow-orb-left animate-glow-pulse" />
      <div className="glow-orb glow-orb-right animate-glow-pulse" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent opacity-20" />

      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] shadow-[0_0_30px_rgba(59,130,246,0.2)] backdrop-blur-xl">
              <Flame className="size-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-white/85">GrindLock</p>
              <p className="text-xs text-white/50">Discipline-first productivity</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/auth/sign-in" className="text-sm text-white/65 transition hover:text-white">
              Sign in
            </Link>
            <ThreeDButton asChild className="px-5 py-3">
              <Link href="/auth/sign-up">
                Start Tracking
                <ArrowRight className="size-4" />
              </Link>
            </ThreeDButton>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_0.95fr] lg:py-4">
          <div className="relative z-10 max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur-xl">
              <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.8)]" />
              Premium focus system
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                Discipline your time. Own your future.
              </h1>
              <p className="max-w-xl text-pretty text-base leading-7 text-white/70 sm:text-lg">
                Focus deeper. Stay consistent. Win daily.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ThreeDButton asChild className="min-w-[180px] bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/20">
                <Link href="/auth/sign-up">
                  Start Tracking
                  <ArrowRight className="size-4" />
                </Link>
              </ThreeDButton>
              <Button
                asChild
                variant="outline"
                className="h-14 rounded-full border-white/12 bg-white/5 px-6 text-white/80 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                <a href="#features">See the flow</a>
              </Button>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                >
                  <p className="text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              ref={panelRef}
              className="landing-panel relative w-full max-w-[560px] rounded-[2rem] border border-white/14 bg-white/[0.06] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-3xl sm:p-6"
            >
              <div className="panel-reflection pointer-events-none absolute inset-0 rounded-[2rem]" />
              <div className="relative z-10 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/50">Current session</p>
                        <p className="mt-3 text-5xl font-semibold tracking-[-0.08em] text-white">
                          {timerMinutes}:{timerSeconds}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-right">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">Streak</p>
                        <p className="text-lg font-semibold text-cyan-50">28</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#67e8f9_0%,#8b5cf6_100%)] shadow-[0_0_18px_rgba(103,232,249,0.45)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/50">{progress}%</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.26em] text-white/50">Progress ring</p>
                        <BarChart3 className="size-4 text-cyan-200/80" />
                      </div>
                      <div className="relative mx-auto mt-4 grid size-36 place-items-center">
                        <svg viewBox="0 0 120 120" className="-rotate-90 drop-shadow-[0_0_18px_rgba(103,232,249,0.25)]">
                          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                          <circle
                            cx="60"
                            cy="60"
                            r="46"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeLinecap="round"
                            strokeWidth="10"
                            strokeDasharray="289"
                            strokeDashoffset={289 - (289 * progress) / 100}
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#67e8f9" />
                              <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute text-center">
                          <p className="text-3xl font-semibold text-white">{progress}%</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">done</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]" />
                        <p className="text-sm font-medium text-white/90">Live focus mode</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        A calm command center for focus sessions, streaks, and momentum.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Current goal", value: "Finish deep work block" },
                    { label: "Next action", value: "Take a 10 minute reset" },
                    { label: "Momentum", value: "High consistency" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/80">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -left-8 top-10 hidden w-44 animate-float-slow rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:block">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Focus score</p>
              <p className="mt-3 text-3xl font-semibold text-white">92</p>
              <p className="mt-1 text-sm text-white/55">strong start today</p>
            </div>

            <div className="pointer-events-none absolute -right-6 bottom-12 hidden w-40 animate-float-mid rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:block">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Consistency</p>
              <p className="mt-3 text-3xl font-semibold text-white">14d</p>
              <p className="mt-1 text-sm text-white/55">steady streak locked</p>
            </div>
          </div>
        </div>

        <section id="features" className="relative z-10 grid gap-4 pb-8 pt-6 sm:grid-cols-3">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/[0.05]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Icon className="size-5 text-cyan-200" />
                <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p>
              </Card>
            );
          })}
        </section>
      </section>

      <div
        className="pointer-events-none fixed inset-0 opacity-25 mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%, transparent)",
          backgroundSize: "100% 100%, 10px 10px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.95), transparent 110%)",
        }}
      />
    </main>
  );
}
