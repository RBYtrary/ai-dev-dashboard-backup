/**
 * POST /api/chat
 *
 * Streaming AI endpoint. Used by the chat UI via the Vercel AI SDK
 * useChat() hook. Returns a Server-Sent Events stream.
 *
 * Body (sent automatically by useChat):
 * {
 *   messages: Message[]   — full conversation including the latest turn
 *   sessionId?: string    — included via useChat's `body` option
 *   providerOverride?: string
 *   modelOverride?: string
 * }
 *
 * GET /api/chat?sessionId=...
 * Returns stored message history for session restoration on page load.
 */

import { route } from "@/lib/ai-router";
import { streamText, type Provider } from "@/lib/models";
import {
  addMessage,
  getMessages,
  generateSessionId,
} from "@/lib/memory";
import type { CoreMessage } from "ai";

export const runtime = "nodejs";

// ─── POST — streaming ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      messages: clientMessages,
      sessionId: incomingSessionId,
      providerOverride,
      modelOverride,
    }: {
      messages: Array<{ id: string; role: string; content: string }>;
      sessionId?: string;
      providerOverride?: string;
      modelOverride?: string;
    } = body;

    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return Response.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const sessionId = incomingSessionId ?? generateSessionId();

    // The last message is always the user's latest input
    const lastMessage = clientMessages[clientMessages.length - 1];
    const routing = route(lastMessage.content, { providerOverride, modelOverride });

    // Build CoreMessage array: system prompt + all client messages
    const messages: CoreMessage[] = [
      { role: "system", content: routing.systemPrompt },
      ...clientMessages.map((m) => ({
        role: m.role as CoreMessage["role"],
        content: m.content,
      })),
    ];

    // Save the user's message before streaming begins
    await addMessage(
      sessionId,
      { role: "user", content: lastMessage.content },
      { intent: routing.intent, routeId: routing.routeId }
    );

    // Start streaming — save assistant response when stream completes
    const result = streamText(messages, {
      model: routing.model,
      provider: routing.provider as Provider | undefined,
      temperature: routing.temperature,
      maxTokens: routing.maxTokens,
      onFinish: async (text: string) => {
        await addMessage(
          sessionId,
          { role: "assistant", content: text },
          {
            intent: routing.intent,
            routeId: routing.routeId,
            model: routing.model,
            provider: routing.provider,
            confidence: routing.confidence,
          }
        );
      },
    });

    const response = result.toAIStreamResponse();

    // Surface session metadata in response headers for the client
    response.headers.set("X-Session-Id", sessionId);
    response.headers.set("X-Intent", routing.intent);
    response.headers.set("X-Route-Id", routing.routeId);

    return response;
  } catch (err: any) {
    console.error("[/api/chat] Error:", err);
    return Response.json(
      { error: err?.message ?? "Chat stream error" },
      { status: 500 }
    );
  }
}

// ─── GET — session history ────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return Response.json({ messages: [], sessionId: null });
    }

    const entries = await getMessages(sessionId);

    // Convert MemoryEntry[] to the shape useChat expects
    const messages = entries
      .filter((e) => e.type === "message")
      .map((e) => ({
        id: e.id,
        role: (e.metadata.role as string) ?? "user",
        content: e.content,
        createdAt: new Date(e.timestamp).toISOString(),
      }));

    return Response.json({ messages, sessionId });
  } catch (err: any) {
    console.error("[/api/chat GET] Error:", err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
