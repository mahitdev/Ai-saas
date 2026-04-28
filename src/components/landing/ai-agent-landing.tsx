"use client";

import Link from "next/link";
import type { ComponentProps, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Cpu,
  Lock,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

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

function usePointerGlow(ref: RefObject<HTMLElement | null>) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--mx", `${clamp(x, 0, 100)}%`);
      node.style.setProperty("--my", `${clamp(y, 0, 100)}%`);
    };

    node.addEventListener("pointermove", onMove);
    return () => node.removeEventListener("pointermove", onMove);
  }, [reducedMotion, ref]);
}

function NeonButton({ className, children, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(
        "group relative isolate rounded-full border border-[#62ff3f]/45 bg-[#43ff2f] px-7 py-6 text-sm font-semibold text-black shadow-[0_20px_50px_rgba(67,255,47,0.35)] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#52ff3f] active:translate-y-0.5 active:scale-[0.99]",
        "before:absolute before:inset-0 before:-z-10 before:translate-y-2 before:rounded-full before:bg-[#1dff00]/25 before:blur-xl before:content-['']",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {children}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Button>
  );
}

function GlassCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#62ff3f]/20 bg-[#43ff2f]/10 text-[#6dff50]">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-sm leading-6 text-white/60">{description}</p>
        </div>
      </div>
    </div>
  );
}

function HeroCanvas({ pointer }: { pointer: PointerState }) {
  const reducedMotion = useReducedMotion();
  const glowX = pointer.active ? `${pointer.x}%` : "50%";
  const glowY = pointer.active ? `${pointer.y}%` : "45%";

  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(67,255,47,0.18),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(67,255,47,0.12),transparent_32%)]" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(67,255,47,0.18), transparent 16%), radial-gradient(circle at ${glowX} ${glowY}, rgba(255,255,255,0.08), transparent 10%)`,
          opacity: pointer.active ? 1 : 0.75,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] uppercase tracking-[0.32em] text-white/55">
            <span className="size-1.5 rounded-full bg-[#43ff2f] shadow-[0_0_18px_rgba(67,255,47,0.95)]" />
            Now available
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/30">AI Agent Interactive Landing</p>
            <h1 className="max-w-3xl text-balance text-[clamp(3.1rem,8vw,6.9rem)] font-semibold tracking-[-0.08em] text-white leading-[0.92]">
              AI infrastructure that
              <span className="block text-[#43ff2f]">developers love.</span>
            </h1>
            <p className="max-w-2xl text-pretty text-sm leading-7 text-white/56 sm:text-base">
              Scale your workflows, automate repetitive work, and keep every action visible through a premium control surface that feels fast, trusted, and ready for teams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <NeonButton onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              Get Started Free
            </NeonButton>
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.04] px-7 py-6 text-sm font-semibold text-white/85 shadow-none hover:bg-white/[0.07] hover:text-white"
            >
              Contact Sales
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {["Autonomous agents", "MCP live context", "Desktop bridge", "Zero-trust defaults"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] text-white/55"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex items-end justify-center">
          <div className="absolute inset-x-0 bottom-4 top-0 mx-auto w-[78%] rounded-full bg-[#43ff2f]/20 blur-[110px]" />
          <div className="absolute bottom-12 left-1/2 h-[310px] w-[310px] -translate-x-1/2 rounded-full border border-[#43ff2f]/15 bg-[radial-gradient(circle,rgba(67,255,47,0.22),rgba(67,255,47,0.02)_60%,transparent_72%)] blur-[2px]" />
          <div className="relative w-full max-w-[420px]">
            <div className="absolute -left-8 top-8 size-24 rounded-full border border-[#43ff2f]/25 bg-[#43ff2f]/10 blur-sm" />
            <div className="absolute -right-3 bottom-8 size-20 rounded-full border border-white/10 bg-white/5 blur-sm" />
            <div
              className={cn(
                "relative mx-auto aspect-[4/5] w-full max-w-[380px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 shadow-[0_35px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl",
                reducedMotion ? "" : "animate-[float_7s_ease-in-out_infinite]",
              )}
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom,rgba(67,255,47,0.14),transparent_46%)]" />
              <div className="relative flex h-full flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-black/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-[#43ff2f] text-black shadow-[0_0_20px_rgba(67,255,47,0.6)] grid place-items-center">
                      <Bot className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/40">AI Agent</p>
                      <p className="text-sm font-semibold text-white">Live control panel</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#43ff2f]/30 bg-[#43ff2f]/10 px-3 py-1 text-[11px] font-medium text-[#8bff72]">
                    Online
                  </span>
                </div>

                <div className="grid flex-1 gap-3">
                  <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.28em] text-white/30">Inference</p>
                      <p className="text-xs text-white/55">Sub-second</p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        ["Chat", "128"],
                        ["Tasks", "42"],
                        ["Trust", "94%"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[1rem] border border-white/8 bg-black/40 p-3">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">{label}</p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 rounded-[1.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(67,255,47,0.12),rgba(67,255,47,0.02))] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.28em] text-white/30">Autonomous mode</p>
                      <Sparkles className="size-4 text-[#8bff72]" />
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      {[
                        "Researcher collects context",
                        "Strategist plans the sequence",
                        "Writer drafts the result",
                        "System agent hands off to the next step",
                      ].map((step, index) => (
                        <div key={step} className="flex items-center gap-3 rounded-[0.95rem] border border-white/8 bg-black/35 px-3 py-2.5 text-sm text-white/72">
                          <span className="grid size-6 place-items-center rounded-full bg-[#43ff2f] text-[11px] font-semibold text-black">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-[11px] text-white/65 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#43ff2f] shadow-[0_0_12px_rgba(67,255,47,0.95)]" />
                    Interactive BG
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundScene({ pointer, scrollProgress }: { pointer: PointerState; scrollProgress: number }) {
  const sceneX = pointer.active ? (pointer.x - 50) * 0.28 : 0;
  const sceneY = pointer.active ? (pointer.y - 50) * 0.22 : 0;
  const horizonShift = (scrollProgress - 0.5) * 14;
  const glowShift = 20 + scrollProgress * 12;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-90 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${sceneX}px, ${sceneY}px, 0)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(67,255,47,0.08),transparent_26%),radial-gradient(circle_at_12%_74%,rgba(255,255,255,0.04),transparent_18%),radial-gradient(circle_at_88%_76%,rgba(67,255,47,0.06),transparent_18%)]" />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% ${15 + scrollProgress * 8}%, rgba(67, 255, 47, 0.26), transparent ${glowShift}%), radial-gradient(circle at 18% 18%, rgba(67, 255, 47, 0.14), transparent 18%), radial-gradient(circle at 82% 24%, rgba(255, 255, 255, 0.05), transparent 18%), linear-gradient(180deg, rgba(2, 6, 23, 0.02), rgba(2, 6, 23, 0.4) 56%, rgba(0, 0, 0, 0.95))`,
          }}
        />

        <div
          className="absolute inset-x-[-18%] top-[8%] h-[72vh] opacity-80"
          style={{
            transform: `perspective(1600px) translateY(${horizonShift}px) rotateX(74deg) rotateZ(-8deg) scale(1.08)`,
          }}
        >
          <div className="absolute inset-0 rounded-[50%] border border-[#43ff2f]/20 bg-[radial-gradient(circle,rgba(67,255,47,0.12),transparent_54%)] shadow-[0_0_180px_rgba(67,255,47,0.12)]" />
          <div className="absolute inset-4 rounded-[50%] border border-white/10 opacity-60" />
          <div
            className="absolute inset-8 rounded-[50%] opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(circle, rgba(0,0,0,0.96), transparent 70%)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#43ff2f]/14 bg-[radial-gradient(circle,rgba(67,255,47,0.24),rgba(67,255,47,0.06)_38%,transparent_72%)] blur-[24px] animate-[softPulse_10s_ease-in-out_infinite]" />
        </div>

        <div className="absolute left-[6%] top-[18%] size-32 rounded-full border border-[#43ff2f]/26 bg-[radial-gradient(circle,rgba(67,255,47,0.3),rgba(67,255,47,0.08)_52%,transparent_76%)] blur-[3px] animate-[orbitSlow_28s_linear_infinite]" />
        <div className="absolute right-[10%] top-[14%] size-40 rounded-full border border-white/12 bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_56%,transparent_74%)] blur-[1px] animate-[orbitSlow_36s_linear_infinite_reverse]" />
        <div className="absolute left-[48%] top-[9%] h-44 w-44 -translate-x-1/2 rounded-full border border-[#43ff2f]/18 bg-[conic-gradient(from_0deg,rgba(67,255,47,0.04),rgba(67,255,47,0.38),rgba(255,255,255,0.05),rgba(67,255,47,0.2),rgba(67,255,47,0.04))] blur-[44px] animate-[softPulse_10s_ease-in-out_infinite]" />
        <div className="absolute left-[12%] top-[62%] h-[24rem] w-[24rem] rounded-full border border-[#43ff2f]/12 bg-[radial-gradient(circle,rgba(67,255,47,0.2),rgba(67,255,47,0.04)_42%,transparent_74%)] blur-[14px] animate-[hoverDrift_16s_ease-in-out_infinite]" />
        <div className="absolute right-[14%] top-[58%] h-[22rem] w-[22rem] rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_42%,transparent_74%)] blur-[18px] animate-[hoverDrift_20s_ease-in-out_infinite]" />

        <div className="absolute inset-x-0 bottom-[-8vh] h-[44vh] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.12)_18%,rgba(0,0,0,0.9)_78%)]" />
      </div>
    </div>
  );
}

export function AiAgentLanding() {
  const [pointer, setPointer] = useState<PointerState>({ x: 50, y: 45, active: false });
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  usePointerGlow(heroRef);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      setPointer({
        x: clamp((event.clientX / window.innerWidth) * 100, 0, 100),
        y: clamp((event.clientY / window.innerHeight) * 100, 0, 100),
        active: true,
      });
    };
    const onLeave = () => setPointer((current) => ({ ...current, active: false }));
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(clamp(window.scrollY / max, 0, 1));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { label: "Product", href: "#features" },
      { label: "Solutions", href: "#stack" },
      { label: "Pricing", href: "#pricing" },
      { label: "Docs", href: "/dashboard/chat" },
    ],
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020203] text-white">
      <BackgroundScene pointer={pointer} scrollProgress={scrollProgress} />

      <div className="fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 lg:flex">
        <div className="flex flex-col gap-2 rounded-[1.75rem] border border-white/10 bg-black/70 p-2 backdrop-blur-xl">
          {[Bot, Workflow, Cpu, Lock, Sparkles].map((Icon, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "grid size-10 place-items-center rounded-2xl border transition-colors",
                index === 0
                  ? "border-[#43ff2f]/35 bg-[#43ff2f]/12 text-[#8bff72]"
                  : "border-white/8 bg-white/[0.03] text-white/55 hover:border-[#43ff2f]/25 hover:bg-[#43ff2f]/10 hover:text-[#a9ff93]",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 animate-[sceneShift_24s_ease-in-out_infinite] bg-[radial-gradient(circle_at_50%_0%,rgba(67,255,47,0.16),transparent_18%),radial-gradient(circle_at_15%_22%,rgba(67,255,47,0.11),transparent_22%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.05),transparent_18%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.035)_1px),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.035)_1px)] bg-[size:22px_22px] opacity-28" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent_0%,rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.84)_100%)]" />

      <div className="relative mx-auto max-w-[1480px] px-3 py-3 sm:px-4 lg:px-6">
        <header className="sticky top-3 z-40 rounded-[1.25rem] border border-white/8 bg-black/65 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
              <div className="grid size-8 place-items-center rounded-xl bg-[#43ff2f] text-black shadow-[0_0_18px_rgba(67,255,47,0.55)]">
                <Bot className="size-4" />
              </div>
              <span>AI Agent</span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-8 text-sm text-white/55 md:flex">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" className="hidden rounded-full px-4 text-white/70 hover:bg-white/5 hover:text-white sm:inline-flex" asChild>
                <Link href="/auth/sign-in">Log in</Link>
              </Button>
              <Button className="rounded-full bg-[#43ff2f] px-5 font-semibold text-black shadow-[0_12px_30px_rgba(67,255,47,0.3)] hover:bg-[#50ff3c]" asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          </div>
        </header>

        <section
          ref={heroRef}
          className="relative mx-auto mt-4 overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:px-6 lg:px-8"
        >
          <div className="flex items-start justify-between gap-3 pb-5 text-xs text-white/45">
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#43ff2f] shadow-[0_0_10px_rgba(67,255,47,0.95)]" />
              AI Agent Interactive Landing
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/55">
              {scrollProgress > 0.75 ? "3.5" : "Live"}
            </span>
          </div>

          <HeroCanvas pointer={pointer} />
        </section>

        <section id="features" className="mt-8 grid gap-4 md:grid-cols-3">
          <GlassCard
            icon={Workflow}
            title="Autonomous orchestration"
            description="Agents coordinate research, writing, and execution with visible handoffs and checkpointed approvals."
          />
          <GlassCard
            icon={Cpu}
            title="Generative UI"
            description="The interface adapts to the task, surfacing analytics, context, and actions only when they matter."
          />
          <GlassCard
            icon={Lock}
            title="Zero-trust by default"
            description="MCP access, safety checks, and desktop bridges stay scoped and observable across the workspace."
          />
        </section>

        <section id="stack" className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/35">Live stack</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Built for agents, context, and control.</h2>
              </div>
              <div className="rounded-full border border-[#43ff2f]/20 bg-[#43ff2f]/10 px-3 py-1 text-xs text-[#8bff72]">
                Connected
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/8 bg-black/35 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/30">Telemetry</p>
                <div className="mt-3 flex items-end gap-2">
                  {[34, 58, 44, 72, 84, 66, 92].map((value, index) => (
                    <div key={index} className="flex-1">
                      <div
                        className="rounded-t-xl bg-[#43ff2f]/80 shadow-[0_0_18px_rgba(67,255,47,0.25)]"
                        style={{ height: `${value}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/8 bg-black/35 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/30">Agent mode</p>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">Researcher to Strategist</div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">Strategist to Writer</div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">Writer to Approval</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(67,255,47,0.14),rgba(67,255,47,0.03))] p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.32em] text-[#a9ff93]">Outcome</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">A premium surface for real work, not just demos.</h2>
            <p className="mt-4 text-sm leading-7 text-white/66">
              AI Agent blends orchestration, MCP context, analytics, and desktop bridges into one calm system that feels fast on desktop and focused on mobile.
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-[1.1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/72">Live analysis stream</div>
              <div className="rounded-[1.1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/72">Desktop agent runbooks</div>
              <div className="rounded-[1.1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/72">MCP-native workspace context</div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-8 rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/35">Pricing</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Outcome-based, team-friendly, and built to scale.</h2>
            </div>
            <Link href="/dashboard/chat" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8bff72]">
              Open workspace <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["$0 platform", "Start free and see value immediately."],
              ["Pay per success", "Bill only when the system finishes the task."],
              ["Enterprise trust", "Security and audit trails remain visible."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.25rem] border border-white/8 bg-black/35 p-4">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes orbitSlow {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(24px, -18px, 0) scale(1.08);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes softPulse {
          0%,
          100% {
            opacity: 0.42;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.76;
            transform: translateX(-50%) scale(1.07);
          }
        }

        @keyframes hoverDrift {
          0%,
          100% {
            transform: translateX(-50%) translateY(0px);
          }
          50% {
            transform: translateX(-50%) translateY(-14px);
          }
        }

        @keyframes sceneShift {
          0%,
          100% {
            background-position:
              0% 0%,
              100% 0%,
              50% 100%;
          }
          50% {
            background-position:
              12% 8%,
              88% 12%,
              52% 100%;
          }
        }
      `}</style>
    </main>
  );
}
