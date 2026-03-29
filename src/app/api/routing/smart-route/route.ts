import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const routeSchema = z.object({
  task: z.string().trim().min(3).max(4000),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = routeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid routing payload" }, { status: 400 });
  }

  const lower = parsed.data.task.toLowerCase();
  const complex = /(reason|architecture|compliance|legal|health|finance|strategy|deep|analyze)/i.test(lower) || lower.length > 280;

  return NextResponse.json({
    model: complex ? "gemini-pro" : "gemini-flash",
    rationale: complex ? "Complex logic detected, routed to Gemini Pro." : "Simple task detected, routed to Gemini Flash.",
    estimatedCostTier: complex ? "high" : "low",
  });
}
