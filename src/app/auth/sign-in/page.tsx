"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const Page = () => {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordScore = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const passwordStrength = password.length === 0 ? 0 : Math.round((passwordScore / 4) * 100);
  const passwordStrengthLabel =
    passwordStrength < 40 ? "Weak" : passwordStrength < 80 ? "Good" : "Strong";
  const passwordStrengthColor =
    passwordStrength < 40
      ? "text-orange-600"
      : passwordStrength < 80
        ? "text-amber-600"
        : "text-emerald-600";

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/dashboard",
      },
      {
        onSuccess: () => {
          toast.success("Signed in successfully.");
          router.push("/dashboard");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Unable to sign in.");
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
    <Card className="group relative overflow-hidden border border-border/60 bg-background/90 shadow-lg backdrop-blur transition-transform duration-300 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-cyan-500/15 blur-2xl transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-52 w-52 rounded-full bg-indigo-500/15 blur-3xl transition-transform duration-500 group-hover:scale-110" />

      <CardHeader className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          <Image
            src="/hero-neon-chat.svg"
            alt="AI sign in visual"
            width={1200}
            height={800}
            className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Protected sign in
        </div>
        <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
        <CardDescription>Sign in to continue chats, memory, tasks, and voice workflows.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sign-in-email">Email</Label>
            <Input
              id="sign-in-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="transition-shadow focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-in-password">Password</Label>
            <div className="relative">
              <Input
                id="sign-in-password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyUp={(event) => {
                  setCapsLockOn(event.getModifierState("CapsLock"));
                }}
                className="pr-12 transition-shadow focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password strength</span>
                <span className={passwordStrengthColor}>{passwordStrengthLabel}</span>
              </div>
              <Progress value={passwordStrength} />
            </div>
            {capsLockOn ? (
              <p className="text-xs text-orange-600">Caps Lock appears to be on.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              Remember this device
            </label>
            <span className="text-xs text-muted-foreground">Secure, encrypted access</span>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md transition-transform duration-200 hover:scale-[1.01]"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="size-3.5 text-cyan-500" />
                Conversation Memory
              </p>
              Continue where you left off.
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <Zap className="size-3.5 text-fuchsia-500" />
                Voice + Chat
              </p>
              Talk naturally with AI Agent.
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <div className="space-y-2 text-center">
          <p className="text-muted-foreground transition-colors hover:text-foreground">
            New here?{" "}
            <Link
              href="/auth/sign-up"
              className="text-foreground underline decoration-cyan-500 underline-offset-4"
            >
              Create an account
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

