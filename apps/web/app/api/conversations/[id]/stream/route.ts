import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockConversationRepo, mockMessageRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";
import { registerConversationStream, broadcastStateChange } from "@/lib/sse-bus";

export const dynamic = "force-dynamic";

/**
 * T1 — SSE stream for a single conversation.
 * Auth + participant check (403 if not a participant). Sends last 20 messages
 * as catch-up, then pushes `message` / `state-change` events. 25s heartbeat.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: convId } = await params;
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return new Response("unauthorized", { status: 401 });

  const conv = await mockConversationRepo.getById(convId);
  if (!conv) return new Response("not_found", { status: 404 });
  if (!conv.participantIds.includes(identity.id)) {
    return new Response("forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Catch-up: last 20 messages.
      const recent = (await mockMessageRepo.listByConversation(convId, null, 20)).map((m) => ({
        id: m.id,
        senderId: m.senderId,
        body: m.body,
        state: m.state,
        createdAt: m.createdAt,
        readAt: m.readAt ?? null,
      }));
      send("catch-up", { messages: recent });

      // Register so T3 broadcasts reach this connection.
      const unregister = registerConversationStream(convId, controller);

      // Heartbeat every 25s (keep-alive through proxies).
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          /* closed */
        }
      }, 25_000);

      // Mark delivered for this recipient on connect.
      await mockMessageRepo.markDelivered(convId, identity.id);

      // Cleanup on disconnect.
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
