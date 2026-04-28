import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";

import { VerifyEmailCard } from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border/60 bg-background/90 shadow-lg backdrop-blur">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Preparing verification...
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailCard />
    </Suspense>
  );
}
