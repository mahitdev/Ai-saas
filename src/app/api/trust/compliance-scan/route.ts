import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const scanSchema = z.object({
  text: z.string().trim().min(2).max(10000),
});

const biasPatterns = [/guys\b/i, /crazy\b/i, /normal people\b/i, /chairman\b/i];
const gdprPatterns = [/passport/i, /national id/i, /personal data/i, /eu resident/i];
const hipaaPatterns = [/patient/i, /diagnosis/i, /medical record/i, /hipaa/i];

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid compliance scan payload" }, { status: 400 });
  }

  const text = parsed.data.text;
  const flags: string[] = [];
  if (biasPatterns.some((regex) => regex.test(text))) flags.push("bias_language_risk");
  if (gdprPatterns.some((regex) => regex.test(text))) flags.push("gdpr_sensitive_data");
  if (hipaaPatterns.some((regex) => regex.test(text))) flags.push("hipaa_sensitive_context");

  return NextResponse.json({
    pass: flags.length === 0,
    flags,
    message: flags.length === 0 ? "No major compliance issues found." : "Potential compliance concerns detected.",
  });
}
