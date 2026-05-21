/**
 * src/lib/models.ts
 *
 * SINGLE SOURCE OF TRUTH for all AI model access.
 * No other file in this project may call a model endpoint directly.
 *
 * Supports: ollama | openai | groq | anthropic
 * Switching providers requires ONLY env var changes — no code changes.
 */

import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
  type CoreMessage,
  type LanguageModel,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

// ─── Public types ─────────────────────────────────────────────────────────────

export type Provider = "ollama" | "openai" | "groq" | "anthropic";

export type ModelOptions = {
  /** Override the MODEL_PROVIDER env var for this call only */
  provider?: Provider;
  /** Override the MODEL_DEFAULT env var for this call only */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Milliseconds before the request is aborted. Default: 30_000 */
  timeoutMs?: number;
  /** How many times to retry on transient failure. Default: 2 */
  maxRetries?: number;
};

export type StreamOptions = ModelOptions & {
  /**
   * Called when the stream completes with the full accumulated text.
   * Use this to save assistant responses to memory.
   */
  onFinish?: (text: string) => Promise<void> | void;
};

/** Normalized response shape — identical regardless of provider */
export type ModelResult = {
  text: string;
  model: string;
  provider: Provider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  durationMs: number;
};

// ─── Internal config ──────────────────────────────────────────────────────────

const DEFAULTS = {
  temperature: 0.7,
  maxTokens: 2048,
  timeoutMs: 30_000,
  maxRetries: 2,
} as const;

// ─── Provider resolution ──────────────────────────────────────────────────────

function resolveProvider(override?: Provider): Provider {
  return override ?? ((process.env.MODEL_PROVIDER ?? "ollama") as Provider);
}

function resolveModel(override?: string): string {
  return override ?? process.env.MODEL_DEFAULT ?? "llama3";
}

/**
 * Construct the correct LanguageModel instance for the given provider.
 * All provider-specific logic lives here and nowhere else.
 */
function buildLanguageModel(provider: Provider, modelId: string): LanguageModel {
  switch (provider) {
    case "ollama": {
      const base = process.env.OLLAMA_URL ?? "http://localhost:11434";
      const client = createOpenAI({
        // Ollama exposes an OpenAI-compatible API at /v1
        baseURL: `${base}/v1`,
        // The SDK requires an apiKey field; Ollama ignores it
        apiKey: "ollama",
      });
      return client(modelId);
    }

    case "openai": {
      const client = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? "",
        // Optional: override endpoint (e.g. Azure OpenAI, proxy)
        baseURL: process.env.OPENAI_BASE_URL || undefined,
      });
      return client(modelId);
    }

    case "groq": {
      // Groq is OpenAI-compatible with a different base URL
      const client = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? "",
        baseURL:
          process.env.OPENAI_BASE_URL ?? "https://api.groq.com/openai/v1",
      });
      return client(modelId);
    }

    case "anthropic": {
      const client = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      });
      return client(modelId);
    }

    default: {
      const _exhaustive: never = provider;
      throw new Error(
        `[models] Unsupported provider: "${_exhaustive}". ` +
          `Valid values: ollama | openai | groq | anthropic`
      );
    }
  }
}

// ─── Retry with exponential backoff ──────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  attempt = 0
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (attempt >= maxRetries) throw err;
    // 500ms → 1s → 2s → ...
    const delayMs = Math.pow(2, attempt) * 500;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, maxRetries, attempt + 1);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a complete (non-streaming) text response.
 * Handles timeout via AbortController and retries transient failures.
 * Returns a normalized ModelResult regardless of provider.
 */
export async function generateText(
  messages: CoreMessage[],
  options: ModelOptions = {}
): Promise<ModelResult> {
  const provider = resolveProvider(options.provider);
  const modelId = resolveModel(options.model);
  const model = buildLanguageModel(provider, modelId);
  const maxRetries = options.maxRetries ?? DEFAULTS.maxRetries;
  const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;

  const start = Date.now();

  const raw = await withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await aiGenerateText({
        model,
        messages,
        temperature: options.temperature ?? DEFAULTS.temperature,
        maxTokens: options.maxTokens ?? DEFAULTS.maxTokens,
        abortSignal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }, maxRetries);

  return {
    text: raw.text,
    model: modelId,
    provider,
    usage: {
      promptTokens: raw.usage.promptTokens,
      completionTokens: raw.usage.completionTokens,
      totalTokens: raw.usage.totalTokens,
    },
    finishReason: raw.finishReason,
    durationMs: Date.now() - start,
  };
}

/**
 * Return a streaming text result.
 * Caller converts to a Response via result.toAIStreamResponse().
 * Not async — the AI SDK's streamText is synchronous.
 * Use the onFinish callback to persist the assistant response to memory.
 */
export function streamText(
  messages: CoreMessage[],
  options: StreamOptions = {}
) {
  const provider = resolveProvider(options.provider);
  const modelId = resolveModel(options.model);
  const model = buildLanguageModel(provider, modelId);

  return aiStreamText({
    model,
    messages,
    temperature: options.temperature ?? DEFAULTS.temperature,
    maxTokens: options.maxTokens ?? DEFAULTS.maxTokens,
    onFinish: options.onFinish
      ? ({ text }) => {
          // onFinish receives { text, finishReason, usage }
          return options.onFinish!(text);
        }
      : undefined,
  });
}
