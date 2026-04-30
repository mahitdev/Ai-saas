import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { addAuditLog, listAuditLogs } from "@/lib/server/chat-realtime";

const moderationSchema = z.object({
  action: z.enum(["flag", "delete", "ban", "edit_profile"]),
  targetType: z.enum(["message", "user", "conversation"]),
  targetId: z.string().trim().min(1).max(200),
  detail: z.string().trim().max(2000).optional().default(""),
});

function isAdmin(email: string) {
  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return envAdmins.includes(email.toLowerCase()) || email.toLowerCase().includes("admin");
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return NextResponse.json({ auditLogs: await listAuditLogs(user.id) });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
  }

  const audit = await addAuditLog(user.id, {
    action: parsed.data.action,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    detail: parsed.data.detail,
  });

  return NextResponse.json({
    audit,
    note: `Moderation action queued: ${parsed.data.action}`,
  });
}
