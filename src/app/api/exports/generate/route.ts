import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const exportSchema = z.object({
  format: z.enum(["pdf", "markdown", "csv"]),
  content: z.string().trim().min(1).max(15000),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export payload" }, { status: 400 });
  }

  const watermark = "Powered by AI Agent Platform - https://myai-phi.vercel.app?promo=SAVE20";
  return NextResponse.json({
    format: parsed.data.format,
    content: `${parsed.data.content}\n\n---\n${watermark}`,
    watermark,
  });
}
