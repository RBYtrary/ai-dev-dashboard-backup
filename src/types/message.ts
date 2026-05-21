/** Role types matching the AI SDK CoreMessage roles */
export type MessageRole = "user" | "assistant" | "system";

/** Chat message as stored in memory and used by the chat UI */
export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  sessionId: string;
  metadata?: {
    intent?: string;
    routeId?: string;
    model?: string;
    provider?: string;
    durationMs?: number;
    confidence?: string;
  };
};
