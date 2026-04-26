import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { addIntegration, listIntegrations } from "@/lib/server/chat-realtime";

const integrationSchema = z.object({
  provider: z.enum(["slack", "discord", "github", "calendar"]),
  target: z.string().trim().min(1).max(300),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ integrations: listIntegrations(user.id) });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = integrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid integration payload" }, { status: 400 });
  }

  return NextResponse.json({
    integration: addIntegration(user.id, parsed.data.provider, parsed.data.target),
    note: "Integration connected for workflow notifications.",
  });
}
