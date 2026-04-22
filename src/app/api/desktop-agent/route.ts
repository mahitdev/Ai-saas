import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addFallbackDesktopAgentSession,
  getFallbackDesktopAgentSession,
  updateFallbackDesktopAgentSession,
} from "@/lib/server/fallback-persistence";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const desktopAgentSchema = z.object({
  goal: z.string().trim().min(3).max(4000),
  platform: z.enum(["windows", "macos", "linux", "browser"]).default("browser"),
  action: z.enum(["open_app", "focus_window", "capture_clipboard", "run_hotkey", "inspect_context"]).default("inspect_context"),
  target: z.string().trim().min(1).max(300).optional().default("workspace"),
  approved: z.boolean().optional().default(false),
});

function buildInstructions(action: z.infer<typeof desktopAgentSchema>["action"], target: string, goal: string) {
  if (action === "open_app") {
    return [
      `Open the requested app or window for ${target}.`,
      "Load the workspace context and wait for the next instruction.",
      `Return a summary of the state that best supports: ${goal}.`,
    ];
  }
  if (action === "focus_window") {
    return [
      `Bring the ${target} window to the foreground.`,
      "Capture the current state, selections, and visible context.",
      `Keep the user in control before any changes are applied for: ${goal}.`,
    ];
  }
  if (action === "capture_clipboard") {
    return [
      "Read the clipboard locally through the desktop bridge.",
      `Mask sensitive values before forwarding the result for: ${goal}.`,
      "Only send the sanitized summary back to the app.",
    ];
  }
  if (action === "run_hotkey") {
    return [
      `Execute the approved hotkey sequence for ${target}.`,
      "Confirm the action before triggering any destructive step.",
      `Use the result to continue: ${goal}.`,
    ];
  }
  return [
    `Inspect ${target} and collect the live desktop context.`,
    "No data leaves the machine until the desktop bridge approves it.",
    `Return a runbook that supports: ${goal}.`,
  ];
}

function buildSafetyNotes(platform: string, action: string) {
  const notes = ["Require explicit approval for destructive actions.", "Keep the desktop bridge local-first and read-only by default."];
  if (platform === "browser") notes.push("Browser mode is a bridge preview, not direct OS control.");
  if (action === "capture_clipboard") notes.push("Scrub personal or secret data before transmission.");
  return notes;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = desktopAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid desktop agent payload" }, { status: 400 });
  }

  const bridgeToken = `desktop_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const instructions = buildInstructions(parsed.data.action, parsed.data.target, parsed.data.goal);
  const safetyNotes = buildSafetyNotes(parsed.data.platform, parsed.data.action);
  const session = addFallbackDesktopAgentSession(user.id, {
    platform: parsed.data.platform,
    goal: parsed.data.goal,
    action: parsed.data.action,
    bridgeToken,
    instructions,
    safetyNotes,
    status: parsed.data.approved ? "running" : "ready",
  });

  return NextResponse.json({
    sessionId: session.id,
    bridgeToken,
    status: session.status,
    platform: session.platform,
    goal: session.goal,
    action: session.action,
    instructions: session.instructions,
    safetyNotes: session.safetyNotes,
    approved: parsed.data.approved,
    note:
      parsed.data.platform === "browser"
        ? "Desktop bridge preview generated. Install a companion app for direct OS control."
        : "Desktop bridge runbook generated. Use a local companion app to execute the actions.",
  });
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (sessionId) {
    const session = getFallbackDesktopAgentSession(user.id, sessionId);
    if (!session) {
      return NextResponse.json({ error: "Desktop agent session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  }

  return NextResponse.json({ sessions: [] });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const schema = z.object({
    sessionId: z.string().trim().min(1),
    status: z.enum(["pending", "ready", "running", "complete"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid desktop agent update payload" }, { status: 400 });
  }

  const session = updateFallbackDesktopAgentSession(user.id, parsed.data.sessionId, { status: parsed.data.status });
  if (!session) {
    return NextResponse.json({ error: "Desktop agent session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
