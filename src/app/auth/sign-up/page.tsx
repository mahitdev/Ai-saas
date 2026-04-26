"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Page = () => {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [router, session]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: "/onboarding",
      },
      {
        onSuccess: () => {
          toast.success("Account created successfully.");
          router.push("/onboarding");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Unable to create account.");
        },
      },
    );

    setIsLoading(false);
  };

  if (isSessionPending) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-zinc-50 shadow-2xl">
        <CardContent className="py-10 text-center text-sm text-zinc-400">
          Checking your session...
        </CardContent>
      </Card>
    );
  }

  if (session) return null;

  return (
    <Card className="relative overflow-hidden border border-white/10 bg-zinc-950/90 text-zinc-50 shadow-2xl backdrop-blur">
      <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-1/4 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      <CardHeader className="space-y-4 border-b border-white/10 bg-white/[0.02]">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          Secure account setup
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl tracking-tight text-white">Create your account</CardTitle>
          <CardDescription className="text-zinc-400">
            Use your email to start with chat, memory, tasks, voice, and a quick onboarding wizard.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-4 pt-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sign-up-name" className="text-zinc-200">
              Name
            </Label>
            <Input
              id="sign-up-name"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-up-email" className="text-zinc-200">
              Email
            </Label>
            <Input
              id="sign-up-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-up-password" className="text-zinc-200">
              Password
            </Label>
            <Input
              id="sign-up-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-0"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full bg-white text-zinc-950 hover:bg-zinc-100" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
            After sign-up, you’ll be guided to a simple wizard to set preferences, invite teammates, or create your first project/chat.
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center text-xs text-zinc-400">
              <Bot className="mx-auto mb-1 size-3.5 text-white" />
              AI chat
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center text-xs text-zinc-400">
              <Sparkles className="mx-auto mb-1 size-3.5 text-white" />
              Memory
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center text-xs text-zinc-400">
              <ShieldCheck className="mx-auto mb-1 size-3.5 text-emerald-400" />
              Secure
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <div className="space-y-2 text-center">
          <p className="text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-zinc-100 underline underline-offset-4">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-zinc-500">
            Want to explore first?{" "}
            <Link href="/" className="text-zinc-100 underline underline-offset-4">
              Go to home
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Page;
