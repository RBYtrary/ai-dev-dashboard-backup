/**
 * src/lib/memory.ts
 *
 * Memory abstraction layer for AI Dev OS.
 * Wraps Vercel KV with a schema designed for:
 *   - session-scoped conversation history
 *   - global system memory
 *   - future: embeddings, summarization, agent state
 *
 * Automatically falls back to an in-process store when KV is not
 * configured (local dev without .env.local). The fallback logs a
 * warning so the gap is always visible.
 *
 * IMPORTANT: Never construct KV keys outside this file.
 * All key logic lives in the `keys` object below.
 */

import { kv } from "@vercel/kv";
import type { CoreMessage } from "ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoryScope = "session" | "system";

export type MemoryEntryType =
  | "message"   // a single chat message (user or assistant)
  | "context"   // injected project/system context
  | "event"     // system event (build, deploy, error, etc.)
  | "embedding"; // future: vector embedding of content

/**
 * A single memory entry.
 * metadata is intentionally open (Record<string, unknown>) so callers
 * can attach arbitrary structured data without schema migrations.
 * Future embedding support: add optional `embedding?: number[]` here.
 */
export type MemoryEntry = {
  id: string;
  type: MemoryEntryType;
  scope: MemoryScope;
  content: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  sessionId?: string;
  // future: embedding?: number[];
  // future: summaryOf?: string[];   // IDs of entries this summarizes
  // future: tokenCount?: number;
};

export type SessionMeta = {
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  model?: string;
  provider?: string;
};

// ─── KV key schema ────────────────────────────────────────────────────────────
// All key construction is centralized here.
// Prefix `mem:` scopes all keys so they don't conflict with future KV usage.

const keys = {
  sessionMessages: (sid: string) => `mem:session:${sid}:messages`,
  sessionMeta:     (sid: string) => `mem:session:${sid}:meta`,
  systemEntries:   ()            => `mem:system:entries`,
  sessionIndex:    ()            => `mem:index:sessions`,
} as const;

// ─── KV availability guard ────────────────────────────────────────────────────

let _warnedOnce = false;

function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function warnIfFallback(): void {
  if (!isKVConfigured() && !_warnedOnce) {
    console.warn(
      "[memory] KV_REST_API_URL or KV_REST_API_TOKEN not set. " +
        "Using in-process fallback — memory will NOT persist between requests. " +
        "Run `vercel env pull` or set values in .env.local to enable persistence."
    );
    _warnedOnce = true;
  }
}

// ─── In-process fallback ──────────────────────────────────────────────────────
// Module-level — shared within a single server process.
// On serverless (Vercel) each invocation may be a fresh process, so
// this only provides within-request continuity, not cross-request.

const _fallback: {
  sessions: Map<string, MemoryEntry[]>;
  sessionMeta: Map<string, SessionMeta>;
  system: MemoryEntry[];
} = {
  sessions: new Map(),
  sessionMeta: new Map(),
  system: [],
};

// ─── Session ID ───────────────────────────────────────────────────────────────

export function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `sess_${ts}_${rand}`;
}

// ─── Add message to session ───────────────────────────────────────────────────

export async function addMessage(
  sessionId: string,
  message: CoreMessage,
  metadata: Record<string, unknown> = {}
): Promise<MemoryEntry> {
  warnIfFallback();

  const content =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content);

  const entry: MemoryEntry = {
    id: `${sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: "message",
    scope: "session",
    content,
    metadata: { role: message.role, ...metadata },
    timestamp: Date.now(),
    sessionId,
  };

  if (isKVConfigured()) {
    const existing =
      (await kv.get<MemoryEntry[]>(keys.sessionMessages(sessionId))) ?? [];
    existing.push(entry);
    await kv.set(keys.sessionMessages(sessionId), existing);
    await _upsertSessionMeta(sessionId, existing.length);
  } else {
    if (!_fallback.sessions.has(sessionId)) {
      _fallback.sessions.set(sessionId, []);
    }
    _fallback.sessions.get(sessionId)!.push(entry);
  }

  return entry;
}

// ─── Get session messages ─────────────────────────────────────────────────────

export async function getMessages(sessionId: string): Promise<MemoryEntry[]> {
  warnIfFallback();
  if (isKVConfigured()) {
    return (await kv.get<MemoryEntry[]>(keys.sessionMessages(sessionId))) ?? [];
  }
  return _fallback.sessions.get(sessionId) ?? [];
}

/**
 * Returns messages as CoreMessage[] suitable for passing directly
 * to the AI SDK. Filters to message-type entries only.
 */
export async function getMessagesForContext(
  sessionId: string
): Promise<CoreMessage[]> {
  const entries = await getMessages(sessionId);
  return entries
    .filter((e) => e.type === "message")
    .map((e) => ({
      role: (e.metadata.role as CoreMessage["role"]) ?? "user",
      content: e.content,
    }));
}

// ─── Clear session ────────────────────────────────────────────────────────────

export async function clearSession(sessionId: string): Promise<void> {
  warnIfFallback();
  if (isKVConfigured()) {
    await kv.del(keys.sessionMessages(sessionId));
    await kv.del(keys.sessionMeta(sessionId));
  } else {
    _fallback.sessions.delete(sessionId);
    _fallback.sessionMeta.delete(sessionId);
  }
}

// ─── Session meta (internal) ──────────────────────────────────────────────────

async function _upsertSessionMeta(
  sessionId: string,
  messageCount: number
): Promise<void> {
  if (!isKVConfigured()) return;
  const existing = await kv.get<SessionMeta>(keys.sessionMeta(sessionId));
  const meta: SessionMeta = {
    sessionId,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    messageCount,
    model: existing?.model,
    provider: existing?.provider,
  };
  await kv.set(keys.sessionMeta(sessionId), meta);
}

export async function getSessionMeta(
  sessionId: string
): Promise<SessionMeta | null> {
  if (isKVConfigured()) {
    return await kv.get<SessionMeta>(keys.sessionMeta(sessionId));
  }
  return _fallback.sessionMeta.get(sessionId) ?? null;
}

// ─── System / global memory ───────────────────────────────────────────────────

export async function addSystemMemory(
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<MemoryEntry> {
  warnIfFallback();

  const entry: MemoryEntry = {
    id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: "context",
    scope: "system",
    content,
    metadata,
    timestamp: Date.now(),
  };

  if (isKVConfigured()) {
    const existing =
      (await kv.get<MemoryEntry[]>(keys.systemEntries())) ?? [];
    existing.push(entry);
    await kv.set(keys.systemEntries(), existing);
  } else {
    _fallback.system.push(entry);
  }

  return entry;
}

export async function getSystemMemory(): Promise<MemoryEntry[]> {
  warnIfFallback();
  if (isKVConfigured()) {
    return (await kv.get<MemoryEntry[]>(keys.systemEntries())) ?? [];
  }
  return [..._fallback.system];
}

// ─── Legacy compat (for api/memory/route.ts during migration) ─────────────────

/** @deprecated Use addSystemMemory() instead */
export async function addMemory(content: string): Promise<MemoryEntry> {
  return addSystemMemory(content, { source: "legacy-api" });
}

/** @deprecated Use getSystemMemory() instead */
export async function getMemory(): Promise<MemoryEntry[]> {
  return getSystemMemory();
}
