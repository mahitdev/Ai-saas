import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { createCallSession, listCallSessions, updateCallSession } from "@/lib/server/chat-realtime";

const callSchema = z.object({
  roomName: z.string().trim().min(1).max(120),
  mode: z.enum(["one_to_one", "group"]).default("one_to_one"),
  screenSharing: z.boolean().optional().default(false),
  recording: z.boolean().optional().default(false),
  participants: z.array(z.string().trim().min(1).max(120)).optional().default([]),
  status: z.enum(["idle", "ringing", "active", "ended"]).optional().default("ringing"),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ calls: await listCallSessions(user.id) });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = callSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid call payload" }, { status: 400 });
  }

  return NextResponse.json({
    call: await createCallSession(user.id, {
      roomName: parsed.data.roomName,
      mode: parsed.data.mode,
      status: parsed.data.status,
      screenSharing: parsed.data.screenSharing,
      recording: parsed.data.recording,
      participants: parsed.data.participants,
    }),
  });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      callId: z.string().trim().min(1),
      status: z.enum(["idle", "ringing", "active", "ended"]).optional(),
      screenSharing: z.boolean().optional(),
      recording: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid call update payload" }, { status: 400 });
  }

  const call = await updateCallSession(user.id, parsed.data.callId, {
    status: parsed.data.status,
    screenSharing: parsed.data.screenSharing,
    recording: parsed.data.recording,
  });
  if (!call) {
    return NextResponse.json({ error: "Call session not found" }, { status: 404 });
  }

  return NextResponse.json({ call });
}
