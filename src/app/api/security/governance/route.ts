import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { getGovernanceLogs, inspectForGovernance } from "@/lib/server/governance";

const inspectSchema = z.object({
  text: z.string().trim().min(1).max(12000),
  model: z.string().trim().min(1).max(120),
  direction: z.enum(["input", "output"]).default("input"),
  routeContext: z.string().trim().max(200).default("manual_inspection"),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  return NextResponse.json({
    logs: getGovernanceLogs(user.id),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = inspectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid governance payload" }, { status: 400 });
  }

  const log = inspectForGovernance({
    userId: user.id,
    direction: parsed.data.direction,
    text: parsed.data.text,
    model: parsed.data.model,
    routeContext: parsed.data.routeContext,
  });

  return NextResponse.json({
    log,
  });
}
