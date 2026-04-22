import Link from "next/link";
import { ArrowLeft, Mail, MessageCircleHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#05060a] p-6 text-slate-100 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(217,70,239,0.22),transparent_30%),linear-gradient(180deg,#020617_0%,#111827_100%)]" />
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="mb-4">
          <Button asChild variant="outline" className="border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to home
            </Link>
          </Button>
        </div>

        <Card className="border-slate-700/70 bg-slate-950/80 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-400/35 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-200">
              <MessageCircleHeart className="size-3.5" />
              Contact & Collaboration
            </div>
            <CardTitle className="text-3xl text-slate-100 md:text-4xl">Need help with AI Agent?</CardTitle>
            <CardDescription className="text-slate-400">
              For setup help, product questions, feedback, or support, reach out directly by email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">Email</p>
              <a
                href="mailto:mahitsaxena12@gmail.com"
                className="inline-flex items-center gap-2 text-lg font-semibold text-cyan-100 underline decoration-cyan-400 underline-offset-4 transition hover:text-cyan-50"
              >
                <Mail className="size-4" />
                mahitsaxena12@gmail.com
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
                Fast response for product and account questions.
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
                Help with AI chat, voice, and workflow setup.
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
                Collaboration for custom UI and product upgrades.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
