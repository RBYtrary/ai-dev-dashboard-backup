/**
 * POST /api/router
 *
 * Non-streaming AI endpoint.
 * All pages and components that need a complete AI response
 * (not streamed) call this endpoint.
 *
 * Body: {
 *   message: string
 *   sessionId?: string        — omit to start a new session
 *   providerOverride?: string — override MODEL_PROVIDER for this call
 *   modelOverride?: string    — override MODEL_DEFAULT for this call
 * }
 *
 * Response: {
 *   reply: string
 *   sessionId: string
 *   intent: Intent
 *   routeId: string
 *   model: string
 *   provider: string
 *   confidence: string
 *   usage: { promptTokens, completionTokens, totalTokens }
 * }
 */

import { NextResponse } from "next/server";
import { route } from "@/lib/ai-router";
import { generateText, type Provider } from "@/lib/models";
import {
  addMessage,
  getMessagesForContext,
  generateSessionId,
} from "@/lib/memory";
import type { CoreMessage } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      message,
      sessionId: incomingSessionId,
      providerOverride,
      modelOverride,
    }: {
      message: string;
      sessionId?: string;
      providerOverride?: string;
      modelOverride?: string;
    } = body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const sessionId = incomingSessionId ?? generateSessionId();

    // Classify intent and resolve system prompt + model config
    const routing = route(message, { providerOverride, modelOverride });

    // Load existing session history for context
    const history = await getMessagesForContext(sessionId);

    const userMessage: CoreMessage = { role: "user", content: message };

    const messages: CoreMessage[] = [
      { role: "system", content: routing.systemPrompt },
      ...history,
      userMessage,
    ];

    // Call the model through the abstraction layer
    const result = await generateText(messages, {
      model: routing.model,
      provider: routing.provider as Provider | undefined,
      temperature: routing.temperature,
      maxTokens: routing.maxTokens,
    });

    // Persist both turns to memory
    await addMessage(sessionId, userMessage);
    await addMessage(
      sessionId,
      { role: "assistant", content: result.text },
      {
        intent: routing.intent,
        routeId: routing.routeId,
        model: result.model,
        provider: result.provider,
        durationMs: result.durationMs,
        confidence: routing.confidence,
      }
    );

    return NextResponse.json({
      reply: result.text,
      sessionId,
      intent: routing.intent,
      routeId: routing.routeId,
      model: result.model,
      provider: result.provider,
      confidence: routing.confidence,
      usage: result.usage,
      durationMs: result.durationMs,
    });
  } catch (err: any) {
    console.error("[/api/router] Error:", err);
    return NextResponse.json(
      {
        error: err?.message ?? "Router error",
        code: err?.code,
      },
      { status: 500 }
    );
  }
}
