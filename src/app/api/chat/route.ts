import { streamText } from "ai";
import { NextResponse } from "next/server";
import type { CoreMessage } from "ai";

import { generateModel } from "@/lib/models";
import { getMessagesForContext, saveMessage } from "@/lib/memory";
import { routeMessage } from "@/lib/ai-router";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    // 1. Route message (intent + model + system prompt)
    const routing = await routeMessage(message);

    // 2. Load memory context
    const history = await getMessagesForContext(sessionId);

    // 3. Build safe CoreMessage array
    const messages: CoreMessage[] = [
      {
        role: "system",
        content: routing.systemPrompt,
      },
      ...history
        .filter(
          (m) => m.role === "user" || m.role === "assistant"
        )
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      {
        role: "user",
        content: message,
      },
    ];

    // 4. Generate streamed response
    const result = await streamText({
      model: generateModel({
        provider: routing.provider,
        model: routing.model,
      }),
      messages,
    });

    // 5. Save user message
    await saveMessage(sessionId, {
      role: "user",
      content: message,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat route error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}