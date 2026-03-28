import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { scrubSensitiveText, unmaskSensitiveText } from "@/lib/server/data-scrubbing";

const scrubSchema = z.object({
  text: z.string().trim().min(1).max(12000),
  unmaskPreview: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = scrubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scrub payload" }, { status: 400 });
  }

  const scrubbed = scrubSensitiveText(parsed.data.text);
  const preview = parsed.data.unmaskPreview
    ? unmaskSensitiveText(scrubbed.scrubbed, scrubbed.tokens)
    : undefined;

  return NextResponse.json({
    scrubbedText: scrubbed.scrubbed,
    tokenCount: Object.keys(scrubbed.tokens).length,
    preview,
  });
}
