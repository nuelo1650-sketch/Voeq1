import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";
import { registerUserStream } from "@/lib/sse-bus";

export const dynamic = "force-dynamic";

/**
 * T2 — User-scoped SSE stream (single per logged-in user, single tab).
 * Pushes `new-conversation` and `notification` events. 25s heartbeat.
 */
export async function GET(_req: NextRequest) {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return new Response("unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const unregister = registerUserStream(identity.id, controller);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          /* closed */
        }
      }, 25_000);

      _req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unregister();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
