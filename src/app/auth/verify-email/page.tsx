"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState("Waiting for verification token...");

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent("/dashboard")}`);
      if (!response.ok) {
        setStatus("Unable to verify email.");
        toast.error("Unable to verify email.");
        return;
      }
      setStatus("Email verified. Redirecting...");
      toast.success("Email verified.");
      router.push("/dashboard");
    })();
  }, [router, token]);

  return (
    <Card className="border-border/60 bg-background/90 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle>Verify email</CardTitle>
        <CardDescription>Confirm your email address to unlock the full account experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{status}</p>
        <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/auth/sign-in")}>
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  );
}
