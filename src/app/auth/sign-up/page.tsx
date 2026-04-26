"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
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
    if (session) {
      router.replace("/dashboard");
    }
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
      }
    );

    setIsLoading(false);
  };

  if (isSessionPending) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Checking your session...
        </CardContent>
      </Card>
    );
  }

  if (session) {
    return null;
  }

  return (
    <Card className="group relative overflow-hidden border border-border/60 bg-background/90 shadow-lg backdrop-blur">
      <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-500/15 blur-2xl transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute -right-12 top-1/4 h-40 w-40 rounded-full bg-cyan-500/15 blur-2xl transition-transform duration-500 group-hover:scale-110" />
      <CardHeader>
        <div className="mb-2 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          <Image
            src="/hero-memory-orb.svg"
            alt="AI sign up visual"
            width={1200}
            height={700}
            className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Secure account setup
        </div>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Use your email to start with chat, memory, tasks, voice, and a quick onboarding wizard.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sign-up-name">Name</Label>
            <Input
              id="sign-up-name"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-up-email">Email</Label>
            <Input
              id="sign-up-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-up-password">Password</Label>
            <Input
              id="sign-up-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            After sign-up, you’ll be guided to a wizard to set preferences, invite teammates, or create your first project/chat.
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-center text-xs text-muted-foreground">
              <Bot className="mx-auto mb-1 size-3.5 text-cyan-500" />
              AI chat
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-center text-xs text-muted-foreground">
              <Sparkles className="mx-auto mb-1 size-3.5 text-fuchsia-500" />
              Memory
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-center text-xs text-muted-foreground">
              <ShieldCheck className="mx-auto mb-1 size-3.5 text-emerald-500" />
              Secure
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <div className="space-y-2 text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-foreground underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Want to explore first?{" "}
            <Link href="/" className="text-foreground underline underline-offset-4">
              Go to home
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Page;

