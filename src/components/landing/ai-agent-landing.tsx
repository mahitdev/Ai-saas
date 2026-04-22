"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChartSpline,
  Flame,
  Shield,
  Sparkles,
  TimerReset,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

type SectionSnapshot = {
  title: string;
  eyebrow: string;
  description: string;
};

const sections: SectionSnapshot[] = [
  {
    eyebrow: "Cinematic control",
    title: "A calm command center for chat, memory, tasks, and automation.",
    description:
      "AI Agent keeps conversations, context, actions, and safeguards together in one immersive workspace that feels premium without getting noisy.",
  },
  {
    eyebrow: "Interactive depth",
    title: "Floating cards that react to every move.",
    description:
      "Hover states tilt, lift, and glow to make each panel feel physically layered without adding visual noise.",
  },
  {
    eyebrow: "Live intelligence",
    title: "Analytics that emerge as you scroll.",
    description:
      "Trend lines, bars, and metrics animate into view so the product story unfolds naturally with the camera.",
  },
  {
    eyebrow: "Ready to launch",
    title: "Always-on assistant, ready when you are.",
    description:
      "Everything stays lightweight, responsive, and cinematic across desktop and mobile screens.",
  },
];

const heroStats = [
  { label: "Conversations", value: "128" },
  { label: "Actions taken", value: "42" },
  { label: "Trust score", value: "94%" },
];

const featureCards = [
  {
    icon: TimerReset,
    title: "Chat continuity",
    description: "Keep long conversations attached to the right thread with memory-first navigation.",
  },
  {
    icon: TrendingUp,
    title: "Workflow automation",
    description: "Watch tasks, requests, and follow-ups progress through the workspace.",
  },
  {
    icon: Shield,
    title: "Trusted by default",
    description: "Auth, security, and governance stay visible without overwhelming the interface.",
  },
];

const analyticsBars = [42, 58, 69, 73, 86, 62, 91, 84, 96];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useViewportHeight() {
  const [height, setHeight] = useState(1);

  useEffect(() => {
    const update = () => setHeight(window.innerHeight || 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return height;
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

function TiltCard({
  children,
  className,
  glowClassName,
}: {
  children: ReactNode;
  className?: string;
  glowClassName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;

    const reset = () => {
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
      node.style.setProperty("--lift", "0px");
      node.style.setProperty("--glow", "0.18");
    };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const ry = clamp((px - 0.5) * 16, -8, 8);
      const rx = clamp((0.5 - py) * 12, -6, 6);
      node.style.setProperty("--rx", `${rx}deg`);
      node.style.setProperty("--ry", `${ry}deg`);
      node.style.setProperty("--lift", "8px");
      node.style.setProperty("--glow", "0.42");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", reset);
    reset();

    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", reset);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative transform-gpu rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:border-cyan-300/25",
        className,
      )}
      style={{
        transform:
          "perspective(1100px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(var(--lift, 0px))",
        boxShadow:
          "0 20px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.05), 0 0 50px rgba(103,232,249,var(--glow, 0.18))",
      }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-80 transition-opacity duration-300",
          "bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_30%,rgba(103,232,249,0.14)_70%,transparent)]",
          glowClassName,
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SectionFrame({
  eyebrow,
  title,
  description,
  progress,
  children,
  index,
  total,
}: SectionSnapshot & {
  progress: number;
  children: ReactNode;
  index: number;
  total: number;
}) {
  const depth = (1 - progress) * 64;
  const fade = clamp(0.35 + progress * 0.65, 0.35, 1);
  const scale = clamp(0.94 + progress * 0.06, 0.94, 1);

  return (
    <section
      className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8"
      style={{
        opacity: fade,
        transform: `translateY(${(1 - progress) * 24}px) scale(${scale})`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.12),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(129,140,248,0.14),transparent_22%),radial-gradient(circle_at_50%_85%,rgba(168,85,247,0.1),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.025)_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.025)_1px)] bg-[size:42px_42px] opacity-40" />

      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(59,130,246,0.16),transparent_70%)] opacity-60" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,rgba(139,92,246,0.16),transparent_70%)] opacity-60" />

      <div
        className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]"
        style={{
          transform: `translateZ(${-depth}px)`,
        }}
      >
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur-xl">
            <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.8)]" />
            {eyebrow}
          </div>
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              Scene 0{index + 1} / 0{total}
            </p>
            <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
              {title}
            </h2>
            <p className="max-w-2xl text-pretty text-base leading-7 text-white/68 sm:text-lg">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ThreeDButton asChild className="min-w-[180px] bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/20">
              <Link href="/auth/sign-up">
                Start Chatting
                <ArrowRight className="size-4" />
              </Link>
            </ThreeDButton>
            <Button
              asChild
              variant="outline"
              className="h-14 rounded-full border-white/12 bg-white/5 px-6 text-white/80 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <a href="#next-scene">Explore the journey</a>
            </Button>
          </div>
        </div>

        <div>{children}</div>
      </div>
    </section>
  );
}

export function AiAgentLanding() {
  const mainRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const viewportHeight = useViewportHeight();
  const [scrollY, setScrollY] = useState(0);
  const [cursor, setCursor] = useState<PointerState>({ x: 50, y: 50, active: false });
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const update = () => {
      setScrollY(window.scrollY);
      const sceneIndex = Math.round(window.scrollY / Math.max(viewportHeight, 1));
      setActiveScene(clamp(sceneIndex, 0, sections.length - 1));
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [viewportHeight]);

  useEffect(() => {
    const root = mainRef.current;
    if (!root || reducedMotion) return;

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setCursor({
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100),
        active: true,
      });
    };

    const onLeave = () => setCursor((current) => ({ ...current, active: false }));

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [reducedMotion]);

  const sceneProgress = useMemo(() => {
    return sections.map((_, index) => {
      const center = index * viewportHeight;
      const distance = Math.abs(scrollY - center);
      return clamp(1 - distance / Math.max(viewportHeight, 1), 0, 1);
    });
  }, [scrollY, viewportHeight]);

  return (
    <main
      ref={mainRef}
      className="relative min-h-[100svh] overflow-hidden bg-[#02040c] text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(59,130,246,0.16), transparent 22%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.18), transparent 24%), radial-gradient(circle at 50% 92%, rgba(6,182,212,0.1), transparent 28%), linear-gradient(180deg, #02040c 0%, #040814 54%, #02040c 100%)",
        backgroundPosition: `${cursor.x}% ${cursor.y}%`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,12,0.08)_58%,rgba(2,4,12,0.38)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.14] mix-blend-screen" />
      <div className="pointer-events-none fixed inset-0 opacity-25 mix-blend-soft-light">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%,transparent)] bg-[length:12px_12px]" />
      </div>

      <div className="glow-orb glow-orb-left animate-glow-pulse" />
      <div className="glow-orb glow-orb-right animate-glow-pulse" />

      <header className="pointer-events-none fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/12 bg-black/20 px-4 py-2 backdrop-blur-xl">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06]">
              <Flame className="size-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-white/85">AI Agent</p>
              <p className="text-xs text-white/50">Cinematic AI workspace</p>
            </div>
          </div>
          <div className="pointer-events-auto hidden items-center gap-3 sm:flex">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/55">
              Scene {activeScene + 1}/{sections.length}
            </div>
            <Link href="/auth/sign-in" className="text-sm text-white/65 transition hover:text-white">
              Sign in
            </Link>
            <ThreeDButton asChild className="px-5 py-3">
              <Link href="/auth/sign-up">
                Start Chatting
                <ArrowRight className="size-4" />
              </Link>
            </ThreeDButton>
          </div>
        </div>
      </header>

      <div className="relative pt-24">
        <SectionFrame index={0} total={sections.length} progress={sceneProgress[0] ?? 0} {...sections[0]}>
          <div className="relative">
            <div className="absolute inset-0 -z-10 translate-y-10 rounded-full bg-cyan-400/20 blur-3xl" />
            <div
              className="landing-panel relative mx-auto w-full max-w-[620px] rounded-[2rem] border border-white/14 bg-white/[0.06] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-3xl sm:p-6"
              style={{
                transform:
                  "perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(var(--lift, 0px))",
              }}
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(135deg,rgba(103,232,249,0.15),transparent_42%,rgba(129,140,248,0.12))] opacity-80" />
              <div className="relative z-10 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                  <TiltCard className="min-h-[210px] border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Active chat</p>
                        <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-white">AI Agent</p>
                      </div>
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-right">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">Memory</p>
                        <p className="text-lg font-semibold text-cyan-50">Live</p>
                      </div>
                    </div>
                    <div className="mt-7 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#67e8f9_0%,#8b5cf6_100%)] shadow-[0_0_18px_rgba(103,232,249,0.45)]" />
                      </div>
                      <p className="text-xs text-white/50">Context ready</p>
                    </div>
                  </TiltCard>

                  <div className="grid gap-4">
                    <TiltCard className="border-white/12 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.26em] text-white/50">Activity ring</p>
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
                            stroke="url(#heroProgressGradient)"
                            strokeLinecap="round"
                            strokeWidth="10"
                            strokeDasharray="289"
                            strokeDashoffset={289 - (289 * 0.78)}
                          />
                          <defs>
                            <linearGradient id="heroProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#67e8f9" />
                              <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute text-center">
                          <p className="text-3xl font-semibold text-white">78%</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">synced</p>
                        </div>
                      </div>
                    </TiltCard>

                    <TiltCard className="border-white/12 bg-white/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]" />
                        <p className="text-sm font-medium text-white/90">Live agent mode</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        A cinematic workspace with the right level of structure for conversation, memory, and action.
                      </p>
                    </TiltCard>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {heroStats.map((item) => (
                    <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/80">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -left-8 top-10 hidden w-44 animate-float-slow rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:block">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Memory depth</p>
              <p className="mt-3 text-3xl font-semibold text-white">92</p>
              <p className="mt-1 text-sm text-white/55">strong recall across chats</p>
            </div>

            <div className="pointer-events-none absolute -right-6 bottom-12 hidden w-40 animate-float-mid rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:block">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Task flow</p>
              <p className="mt-3 text-3xl font-semibold text-white">14d</p>
              <p className="mt-1 text-sm text-white/55">steady action pipeline</p>
            </div>
          </div>
        </SectionFrame>

        <section id="next-scene" className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,rgba(2,4,12,0.98),rgba(4,8,20,0.98))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur-xl">
                <Sparkles className="size-3.5 text-cyan-300" />
                Floating cards
              </div>
              <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                Cards, panels, and controls layered like a real 3D scene.
              </h2>
              <p className="max-w-2xl text-pretty text-base leading-7 text-white/68 sm:text-lg">
                Every hover adds lift and glow, giving the interface the physical presence of a premium AI workspace.
              </p>
              <div className="flex flex-wrap gap-3">
                <ThreeDButton asChild className="min-w-[180px] bg-indigo-400/15 text-indigo-50 hover:bg-indigo-400/20">
                  <Link href="/auth/sign-up">
                    Open workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </ThreeDButton>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 rounded-full border-white/12 bg-white/5 px-6 text-white/80 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <a href="#analytics-scene">See analytics</a>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <TiltCard key={card.title}>
                    <Icon className="size-5 text-cyan-200" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{card.description}</p>
                  </TiltCard>
                );
              })}
              <TiltCard className="sm:col-span-2" glowClassName="opacity-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Device panel</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Immersive UI stack</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-right">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Depth</p>
                    <p className="text-sm text-white/80">Foreground / Mid / Back</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {["Chat", "Tasks", "Memory"].map((item, index) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{item}</p>
                      <p className="mt-2 text-sm text-white/75">
                        {index === 0 ? "Conversation context" : index === 1 ? "Open tasks" : "Adaptive routing"}
                      </p>
                    </div>
                  ))}
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        <section id="analytics-scene" className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(103,232,249,0.12),transparent_24%),radial-gradient(circle_at_80%_72%,rgba(129,140,248,0.12),transparent_20%),linear-gradient(180deg,rgba(4,8,20,0.98),rgba(2,4,12,0.98))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur-xl">
                <ChartSpline className="size-3.5 text-cyan-300" />
                Analytics
              </div>
              <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                Data that appears as the camera moves forward.
              </h2>
              <p className="max-w-2xl text-pretty text-base leading-7 text-white/68 sm:text-lg">
                The charts are layered, soft, and readable so the visual language stays premium without becoming busy.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Hours saved", value: "41.2", tone: "text-cyan-100" },
                  { label: "Tasks completed", value: "128", tone: "text-indigo-100" },
                  { label: "Consistency", value: "94%", tone: "text-emerald-100" },
                  { label: "Signal quality", value: "A+", tone: "text-fuchsia-100" },
                ].map((item) => (
                  <TiltCard key={item.label}>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">{item.label}</p>
                    <p className={cn("mt-3 text-3xl font-semibold tracking-tight", item.tone)}>{item.value}</p>
                    <p className="mt-2 text-sm text-white/55">Live insights updated in real time.</p>
                  </TiltCard>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <TiltCard className="overflow-hidden" glowClassName="opacity-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Performance chart</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Usage trend</p>
                  </div>
                  <BarChart3 className="size-5 text-cyan-200" />
                </div>
                <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
                  {analyticsBars.map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      className="relative flex-1 rounded-t-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_20px_rgba(103,232,249,0.08)]"
                      style={{
                        height: `${value}%`,
                        transform: "translateZ(0)",
                        background:
                          "linear-gradient(180deg, rgba(103,232,249,0.34) 0%, rgba(129,140,248,0.2) 100%)",
                      }}
                    >
                      <div className="absolute inset-x-0 -top-8 text-center text-[11px] uppercase tracking-[0.22em] text-white/35">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </TiltCard>

              <TiltCard className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Line motion</p>
                  <p className="mt-2 text-lg font-semibold text-white">Smooth trend emergence</p>
                  <svg viewBox="0 0 520 180" className="mt-4 h-44 w-full">
                    <defs>
                      <linearGradient id="analyticsLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#67e8f9" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 140 C 80 130, 90 70, 150 72 S 250 145, 310 110 S 400 40, 510 58"
                      fill="none"
                      stroke="rgba(255,255,255,0.09)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 140 C 80 130, 90 70, 150 72 S 250 145, 310 110 S 400 40, 510 58"
                      fill="none"
                      stroke="url(#analyticsLine)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="900"
                      strokeDashoffset="0"
                    />
                  </svg>
                </div>
                <div className="grid gap-3">
                  {[
                    "Forecast confidence rises as activity becomes more consistent.",
                    "Activity bars compress and expand with each weekly cycle.",
                    "Soft overlays keep the data readable in a dark cinematic frame.",
                  ].map((line) => (
                    <div key={line} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/65">
                      {line}
                    </div>
                  ))}
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(103,232,249,0.11),transparent_26%),radial-gradient(circle_at_75%_30%,rgba(168,85,247,0.11),transparent_24%),linear-gradient(180deg,rgba(4,8,20,0.98),rgba(2,4,12,0.98))]" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur-xl">
                <Shield className="size-3.5 text-cyan-300" />
                Product pillars
              </div>
              <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                Built for autonomous work, trusted delivery, and measurable outcomes.
              </h2>
              <p className="max-w-2xl text-pretty text-base leading-7 text-white/68 sm:text-lg">
                AI Agent combines orchestration, generative UI, MCP connections, zero-trust security, and outcome-based pricing in one workspace.
              </p>
              <TiltCard className="max-w-md">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">ROI dashboard</p>
                <p className="mt-3 text-4xl font-semibold text-white">$1 / task</p>
                <p className="mt-2 text-sm leading-6 text-white/60">Estimate savings from successful outcomes instead of just seats and usage.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Hours saved</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-100">41h</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Task outcome</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-100">Tracked</p>
                  </div>
                </div>
              </TiltCard>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Bot,
                  title: "Autonomous orchestration",
                  description: "Spawn researcher, strategist, writer, and compliance agents from one goal.",
                },
                {
                  icon: Sparkles,
                  title: "Generative UI",
                  description: "Morph the dashboard into grids, editors, or chat views by intent.",
                },
                {
                  icon: TimerReset,
                  title: "MCP-native context",
                  description: "Connect local files, Drive, GitHub, and Slack without manual uploads.",
                },
                {
                  icon: Shield,
                  title: "Zero-trust gateway",
                  description: "Scrub PII, enforce policy, and log the AI audit trail automatically.",
                },
                {
                  icon: TrendingUp,
                  title: "Outcome pricing",
                  description: "Measure value per invoice, task, or bug fixed instead of per seat.",
                },
                {
                  icon: BarChart3,
                  title: "HITL checkpoints",
                  description: "Pause high-stakes actions so people can review and approve the plan.",
                },
                {
                  icon: Flame,
                  title: "Vertical deep logic",
                  description: "Use domain-specific playbooks and RAG for industry workflows.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <TiltCard key={item.title}>
                    <Icon className="size-5 text-cyan-200" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.12),transparent_24%),radial-gradient(circle_at_20%_70%,rgba(103,232,249,0.1),transparent_22%),linear-gradient(180deg,rgba(2,4,12,0.98),rgba(4,8,20,0.98))]" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70 backdrop-blur-xl">
                <Bot className="size-3.5 text-cyan-300" />
                Final scene
              </div>
              <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                A premium finish that feels like a high-end AI assistant experience.
              </h2>
              <p className="max-w-2xl text-pretty text-base leading-7 text-white/68 sm:text-lg">
                The layout stays balanced and responsive while the motion, glow, and depth make the experience feel cinematic.
              </p>
              <div className="flex flex-wrap gap-3">
                <ThreeDButton asChild className="min-w-[180px] bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/20">
                  <Link href="/auth/sign-up">
                    Create account
                    <ArrowRight className="size-4" />
                  </Link>
                </ThreeDButton>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 rounded-full border-white/12 bg-white/5 px-6 text-white/80 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <Link href="/auth/sign-in">Return to sign in</Link>
                </Button>
              </div>
            </div>

            <TiltCard className="min-h-[320px]">
              <div className="absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(103,232,249,0.14),transparent_45%,rgba(129,140,248,0.16))]" />
              <div className="relative z-10 grid h-full gap-4 sm:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.05] p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Assistant loop</p>
                    <p className="mt-3 text-4xl font-semibold text-white">Chat, summarize, execute.</p>
                    <p className="mt-3 text-sm leading-6 text-white/60">
                      A single motion-rich surface that keeps the story coherent from first scroll to final CTA.
                    </p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.05] p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Depth layers</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Foreground, midground, background</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.05] p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Performance</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Smooth and optimized</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-20 mix-blend-soft-light"
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
