"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  if (isSessionPending) {
    return (
      <main className="container mx-auto flex min-h-svh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading your workspace...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (session) {
    const initials = session.user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <main className="container mx-auto flex min-h-svh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>You are logged in with Better Auth.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name} />
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium">{session.user.name}</p>
                <p className="text-muted-foreground text-sm">{session.user.email}</p>
              </div>
            </div>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Sign out</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out now?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            toast.success("Signed out.");
                            window.location.assign("/");
                          },
                        },
                      })
                    }
                  >
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl overflow-hidden">
        <CardContent className="grid gap-6 p-0 md:grid-cols-2">
          <AspectRatio ratio={16 / 10} className="bg-muted">
            <div className="from-primary/20 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
              <Image
                src="/globe.svg"
                alt="Auth illustration"
                width={80}
                height={80}
                className="h-20 w-20 opacity-80"
              />
            </div>
          </AspectRatio>

          <div className="flex flex-col justify-center gap-4 p-6">
            <CardTitle>AI Agent Platform</CardTitle>
            <CardDescription>
              Sign in to continue, or create an account to get started.
            </CardDescription>

            <div className="flex gap-3">
              <Button asChild>
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
