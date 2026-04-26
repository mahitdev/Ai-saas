import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

export async function GET() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) return unauthorized();

  const sessions = await auth.api.listSessions({
    headers: await headers(),
  });

  return NextResponse.json({
    sessions,
  });
}

export async function DELETE(request: Request) {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = z.object({ token: z.string().trim().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
  }

  const result = await auth.api.revokeSession({
    headers: await headers(),
    body: { token: parsed.data.token },
  });

  return NextResponse.json({ result });
}

export async function POST(request: Request) {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = z.object({ revokeOthers: z.boolean().optional().default(true) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
  }

  const result = parsed.data.revokeOthers
    ? await auth.api.revokeOtherSessions({
        headers: await headers(),
      })
    : await auth.api.revokeSessions({
        headers: await headers(),
      });

  return NextResponse.json({ result });
}
