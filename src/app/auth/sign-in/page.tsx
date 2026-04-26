"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Fingerprint, Github, KeyRound, Mail, ShieldCheck } from "lucide-react";
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
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
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

  async function signInWithSocial(provider: "google" | "github" | "microsoft") {
    const response = await authClient.$fetch("/sign-in/social", {
      method: "POST",
      body: {
        provider,
        callbackURL: "/dashboard",
        requestSignUp: true,
        disableRedirect: true,
      },
    });
    const payload = (response as { url?: string; redirect?: boolean }) ?? {};
    if (payload.url) {
      window.location.assign(payload.url);
    }
  }

  async function signInWithPasskey() {
    const response = await authClient.signIn.passkey({ autoFill: true, email });
    if (response?.error) {
      toast.error(response.error.message || "Unable to use passkey.");
      return;
    }
    toast.success("Passkey prompt opened.");
  }

  async function sendVerificationEmail() {
    const response = await fetch("/api/auth/send-verification-email", { method: "POST" });
    if (response.ok) {
      toast.success("Verification email sent.");
      return;
    }
    toast.error("Unable to resend verification email.");
  }

  async function requestPasswordReset() {
    if (!email.trim()) return;
    const response = await fetch("/api/auth/forget-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, redirectTo: `${window.location.origin}/auth/reset-password` }),
    });
    if (response.ok) {
      toast.success("Password reset email sent.");
      return;
    }
    toast.error("Unable to request reset.");
  }

  async function verifyTwoFactor() {
    if (!twoFactorCode.trim()) return;
    const response = await fetch("/api/auth/two-factor/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: twoFactorCode.trim(), trustDevice: rememberMe }),
    });
    if (response.ok) {
      toast.success("Two-factor verified.");
      router.push("/dashboard");
      return;
    }
    toast.error("Invalid two-factor code.");
  }

  async function verifyBackupCode() {
    if (!backupCode.trim()) return;
    const response = await fetch("/api/auth/two-factor/verify-backup-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: backupCode.trim(), trustDevice: rememberMe }),
    });
    if (response.ok) {
      toast.success("Backup code accepted.");
      router.push("/dashboard");
      return;
    }
    toast.error("Invalid backup code.");
  }

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
    <Card className="group relative overflow-hidden border border-white/10 bg-zinc-950/90 text-zinc-50 shadow-2xl backdrop-blur transition-transform duration-300 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-52 w-52 rounded-full bg-white/5 blur-3xl transition-transform duration-500 group-hover:scale-110" />

      <CardHeader className="space-y-4 border-b border-white/10 bg-white/[0.02]">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          Secure sign in
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to continue chats, memory, tasks, and voice workflows.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-5 pt-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sign-in-email" className="text-zinc-200">Email</Label>
            <Input
              id="sign-in-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-in-password" className="text-zinc-200">Password</Label>
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
                className="pr-12 border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-0"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-white"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Password strength</span>
                <span className={passwordStrengthColor}>{passwordStrengthLabel}</span>
              </div>
              <Progress value={passwordStrength} />
            </div>
            {capsLockOn ? (
              <p className="text-xs text-amber-300">Caps Lock appears to be on.</p>
            ) : null}
          </div>

          <details className="rounded-xl border border-white/10 bg-white/5 p-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-200">
              More sign-in options
            </summary>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sign-in-2fa" className="text-zinc-200">2FA code</Label>
                  <Input
                    id="sign-in-2fa"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    className="border-white/10 bg-zinc-950 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-in-backup" className="text-zinc-200">Backup code</Label>
                  <Input
                    id="sign-in-backup"
                    placeholder="ABCDE-FGHIJ"
                    value={backupCode}
                    onChange={(event) => setBackupCode(event.target.value)}
                    className="border-white/10 bg-zinc-950 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="border-white/10 bg-zinc-950 text-zinc-100 hover:bg-zinc-900" onClick={() => void verifyTwoFactor()}>
                  Verify 2FA
                </Button>
                <Button type="button" variant="outline" className="border-white/10 bg-zinc-950 text-zinc-100 hover:bg-zinc-900" onClick={() => void verifyBackupCode()}>
                  Use backup code
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {(
                  [
                    ["google", "Continue with Google"],
                    ["github", "Continue with GitHub"],
                    ["microsoft", "Continue with Microsoft"],
                  ] as const
                ).map(([provider, label]) => (
                  <Button
                    key={provider}
                    type="button"
                    variant="outline"
                    className="justify-between border-white/10 bg-zinc-950 text-zinc-100 hover:bg-zinc-900"
                    onClick={() => void signInWithSocial(provider)}
                  >
                    <span className="inline-flex items-center gap-2">
                      {provider === "github" ? <Github className="size-4" /> : <Mail className="size-4" />}
                      {label}
                    </span>
                    <span className="text-xs text-zinc-400">OAuth</span>
                  </Button>
                ))}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Button type="button" variant="outline" className="justify-between border-white/10 bg-zinc-950 text-zinc-100 hover:bg-zinc-900" onClick={() => void signInWithPasskey()}>
                  <span className="inline-flex items-center gap-2">
                    <Fingerprint className="size-4" />
                    Biometric / passkey
                  </span>
                  <span className="text-xs text-zinc-400">Fast login</span>
                </Button>
                <Button type="button" variant="outline" className="justify-between border-white/10 bg-zinc-950 text-zinc-100 hover:bg-zinc-900" onClick={() => void requestPasswordReset()}>
                  <span className="inline-flex items-center gap-2">
                    <KeyRound className="size-4" />
                    Forgot password
                  </span>
                  <span className="text-xs text-zinc-400">Reset link</span>
                </Button>
              </div>
              <Button type="button" variant="ghost" className="w-full text-zinc-400 hover:text-white" onClick={() => void sendVerificationEmail()}>
                <ShieldCheck className="mr-2 size-4" />
                Resend verification email
              </Button>
            </div>
          </details>

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
            className="w-full bg-white text-zinc-950 shadow-md transition-transform duration-200 hover:scale-[1.01] hover:bg-zinc-100"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm">
        <div className="space-y-2 text-center">
          <p className="text-zinc-400 transition-colors hover:text-zinc-200">
            New here?{" "}
            <Link
              href="/auth/sign-up"
              className="text-zinc-100 underline decoration-white/40 underline-offset-4"
            >
              Create an account
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

