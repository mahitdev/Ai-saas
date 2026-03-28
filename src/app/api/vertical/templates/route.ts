import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const templateSchema = z.object({
  industry: z.enum(["hr", "legal", "finance", "general"]),
  input: z.string().trim().min(1).max(6000),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template payload" }, { status: 400 });
  }

  if (parsed.data.industry === "hr") {
    return NextResponse.json({
      template: "Bias Detection",
      output:
        "Potential bias indicators: gendered phrasing, seniority assumptions, exclusionary requirements. Suggested neutral rewrite generated.",
    });
  }
  if (parsed.data.industry === "legal") {
    return NextResponse.json({
      template: "Contract Redlining",
      output:
        "Redline summary: indemnity clause broadened, payment terms tightened, termination notice clarified. High-risk clauses highlighted.",
    });
  }
  if (parsed.data.industry === "finance") {
    return NextResponse.json({
      template: "Finance Control Review",
      output:
        "Control review: expense policy exceptions detected, missing approval checkpoints, and forecast variance hotspots identified.",
    });
  }

  return NextResponse.json({
    template: "General Assistant Template",
    output: `Processed input with standard workflow:\n${parsed.data.input.slice(0, 220)}...`,
  });
}
