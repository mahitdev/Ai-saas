import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { setPresence } from "@/lib/server/chat-realtime";

const presenceSchema = z.object({
  status: z.enum(["online", "away", "offline"]),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ presence: setPresence(user.id, "online") });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = presenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid presence payload" }, { status: 400 });
  }

  return NextResponse.json({ presence: setPresence(user.id, parsed.data.status) });
}
