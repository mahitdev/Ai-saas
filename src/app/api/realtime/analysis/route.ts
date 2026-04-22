import { NextResponse } from "next/server";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { getLiveAnalysis } from "@/lib/server/live-analysis";

function encodeEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const sendSnapshot = async () => {
        try {
          const snapshot = await getLiveAnalysis(user.id);
          controller.enqueue(encoder.encode(encodeEvent(snapshot)));
        } catch {
          controller.enqueue(
            encoder.encode(
              encodeEvent({
                generatedAt: new Date().toISOString(),
                systemStatus: "healthy",
                confidence: 50,
                metrics: {
                  conversations: 0,
                  messages24h: 0,
                  assistantMessages24h: 0,
                  tasksTotal: 0,
                  tasksOpen: 0,
                  tasksDone: 0,
                  overdueTasks: 0,
                  promptInjectionAlerts: 0,
                },
                recommendation: "Live analysis fallback is active.",
                highlights: ["Streaming snapshot unavailable."],
                source: "fallback_memory",
              }),
            ),
          );
        }
      };

      void sendSnapshot();
      interval = setInterval(() => void sendSnapshot(), 5000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        controller.close();
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      if (interval) clearInterval(interval);
      closed = true;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
