import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, BarChart3, BookOpen, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

import { getServerSession } from "@/lib/server/session";

const navigation = [
  { href: "/dashboard/chat", label: "Chat", icon: Bot },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/reports", label: "Reports", icon: BookOpen },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
  { href: "/dashboard/developer", label: "Developer", icon: WandSparkles },
  { href: "/dashboard/model-lab", label: "Model Lab", icon: Sparkles },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const displayName = session.user.name || session.user.email;

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">MyAI Workspace</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span>Organized AI tools</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-500 md:inline-block" />
              <span>Signed in as {displayName}</span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-50"
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
