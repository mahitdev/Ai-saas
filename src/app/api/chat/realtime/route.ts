import { NextResponse } from "next/server";

import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";
import { getChatRealtimeSnapshot, registerRealtimeListener } from "@/lib/server/chat-realtime";

function encodeEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(encodeEvent({ type: "snapshot", ...getChatRealtimeSnapshot(user.id), generatedAt: new Date().toISOString() })));

      const listener = (event: unknown) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };
      const unsubscribe = registerRealtimeListener(user.id, listener);
      const interval = setInterval(() => {
        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: "snapshot",
              ...getChatRealtimeSnapshot(user.id),
              generatedAt: new Date().toISOString(),
            }),
          ),
        );
      }, 5000);

      request.signal.addEventListener(
        "abort",
        () => {
          clearInterval(interval);
          unsubscribe();
          controller.close();
        },
        { once: true },
      );
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
