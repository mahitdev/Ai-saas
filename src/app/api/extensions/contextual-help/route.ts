import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const contextualSchema = z.object({
  pageTitle: z.string().trim().min(1).max(300),
  pageUrl: z.string().trim().min(1).max(2000),
  highlightedText: z.string().trim().max(5000).optional(),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = contextualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contextual help payload" }, { status: 400 });
  }

  const url = parsed.data.pageUrl.toLowerCase();
  const title = parsed.data.pageTitle.toLowerCase();
  const highlighted = parsed.data.highlightedText ?? "";

  let suggestion = "Summarize this page and extract actions.";
  if (url.includes("linkedin.com") || /linkedin/.test(title)) {
    suggestion = "I can summarize this profile and draft a follow-up message.";
  } else if (/github|pull request|issue/.test(url + " " + title)) {
    suggestion = "I can generate a code review summary and a suggested patch plan.";
  } else if (/invoice|budget|finance|pricing/.test(url + " " + title + " " + highlighted.toLowerCase())) {
    suggestion = "I can break this into a budget table and ROI projection.";
  }

  return NextResponse.json({
    mode: "agentic_browser_assist",
    suggestion,
    sidePanelReady: true,
  });
}
