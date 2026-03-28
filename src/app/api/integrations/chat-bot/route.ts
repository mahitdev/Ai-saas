import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const botSchema = z.object({
  platform: z.enum(["slack", "teams"]),
  message: z.string().trim().min(1).max(3000),
  channel: z.string().trim().max(120).optional(),
});

function buildBotReply(platform: "slack" | "teams", message: string) {
  const cleaned = message.replace(/^@[\w-]+/g, "").trim();
  const intent = /summarize|summary/i.test(cleaned)
    ? "summary"
    : /action|todo|next step/i.test(cleaned)
      ? "actions"
      : "general";

  if (intent === "summary") {
    return `(${platform.toUpperCase()} BOT) Summary: ${cleaned.slice(0, 180)}...`;
  }
  if (intent === "actions") {
    return `(${platform.toUpperCase()} BOT) Next actions:\n1. Validate requirement\n2. Draft response\n3. Share update in thread`;
  }
  return `(${platform.toUpperCase()} BOT) I received: "${cleaned}". I can summarize, extract action items, or draft a follow-up reply.`;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = botSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bot payload" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    platform: parsed.data.platform,
    channel: parsed.data.channel ?? "general",
    reply: buildBotReply(parsed.data.platform, parsed.data.message),
    deliveredAt: new Date().toISOString(),
  });
}

