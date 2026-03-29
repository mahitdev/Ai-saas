import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { billingProfile } from "@/db/schema";
import { getFallbackBillingProfile } from "@/lib/server/fallback-persistence";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

function buildEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  let profile: { proCallsUsed: number; proCallsIncluded: number; creditsRemaining: number };
  try {
    const [row] = await db
      .select({ proCallsUsed: billingProfile.proCallsUsed, proCallsIncluded: billingProfile.proCallsIncluded, creditsRemaining: billingProfile.creditsRemaining })
      .from(billingProfile)
      .where(eq(billingProfile.userId, user.id))
      .limit(1);
    profile = row ?? { proCallsUsed: 0, proCallsIncluded: 100, creditsRemaining: 100 };
  } catch {
    const fallback = getFallbackBillingProfile(user.id);
    profile = {
      proCallsUsed: fallback.proCallsUsed,
      proCallsIncluded: fallback.proCallsIncluded,
      creditsRemaining: fallback.creditsRemaining,
    };
  }

  const atRisk = profile.proCallsIncluded > 0 && profile.proCallsUsed / profile.proCallsIncluded >= 0.9;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(buildEvent({ atRisk, message: atRisk ? "You're almost out of power! Add 50 credits for $5." : "Usage healthy" })));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}
