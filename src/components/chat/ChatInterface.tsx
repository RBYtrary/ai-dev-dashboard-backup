"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";

// ─── Session ID — persisted in sessionStorage ─────────────────────────────────

function useSessionId(): string {
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const stored = sessionStorage.getItem("ai_os_session_id");
    if (stored) return stored;
    const fresh = `sess_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    sessionStorage.setItem("ai_os_session_id", fresh);
    return fresh;
  });
  return sessionId;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatInterface() {
  const sessionId = useSessionId();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    reload,
    setMessages,
    stop,
  } = useChat({
    api: "/api/chat",
    body: { sessionId },
    onError: (err) => console.error("[chat ui]", err.message),
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load session history on mount
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/chat?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id ?? String(Math.random()),
              role: m.role,
              content: m.content,
              createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            }))
          );
        }
      })
      .catch(() => {
        // Silent fail — no history to restore
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Submit on Enter (Shift+Enter = new line)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit(e as any);
      }
    }
  }

  function handleClear() {
    setMessages([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ai_os_session_id");
      // Generate new session ID on next render
      const fresh = `sess_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      sessionStorage.setItem("ai_os_session_id", fresh);
    }
  }

  return (
    <div style={s.wrapper}>

      {/* ── Header ── */}
      <header style={s.header}>
        <div>
          <h1 style={s.title}>AI Chat</h1>
          <p style={s.subtitle}>Routed through AI Dev OS brain</p>
        </div>
        <div style={s.headerActions}>
          {isLoading && (
            <button style={s.stopBtn} onClick={stop} type="button">
              Stop
            </button>
          )}
          <button
            style={{
              ...s.clearBtn,
              ...(messages.length === 0 ? s.clearBtnDisabled : {}),
            }}
            onClick={handleClear}
            disabled={messages.length === 0}
            type="button"
          >
            Clear chat
          </button>
        </div>
      </header>

      {/* ── Message list ── */}
      <div style={s.messages}>

        {messages.length === 0 && (
          <div style={s.empty}>
            <p style={s.emptyTitle}>AI Dev OS is ready.</p>
            <p style={s.emptyHint}>
              Ask anything about your codebase, get code written, debug errors,
              or request analysis. The router will select the right model
              profile automatically.
            </p>
            <div style={s.hintRow}>
              {["Fix this TypeScript error", "Write a React hook", "Explain this code"].map(
                (hint) => (
                  <button
                    key={hint}
                    style={s.hintBtn}
                    onClick={() => setInput(hint)}
                    type="button"
                  >
                    {hint}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            style={m.role === "user" ? s.userBubble : s.assistantBubble}
          >
            <span style={m.role === "user" ? s.userLabel : s.assistantLabel}>
              {m.role === "user" ? "You" : "AI Dev OS"}
            </span>
            <p style={s.messageContent}>{m.content}</p>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div style={s.assistantBubble}>
            <span style={s.assistantLabel}>AI Dev OS</span>
            <div style={s.thinkingRow}>
              <span style={{ ...s.dot, animationDelay: "0ms" }} />
              <span style={{ ...s.dot, animationDelay: "160ms" }} />
              <span style={{ ...s.dot, animationDelay: "320ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div style={s.errorBubble}>
            <p style={s.errorText}>{error.message}</p>
            <button style={s.retryBtn} onClick={() => reload()} type="button">
              Retry last message
            </button>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <form onSubmit={handleSubmit} style={s.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI Dev OS… (Enter to send, Shift+Enter for new line)"
          style={s.textarea}
          disabled={isLoading}
          rows={1}
        />
        <button
          type="submit"
          style={{
            ...s.sendBtn,
            ...(isLoading || !input.trim() ? s.sendBtnDisabled : {}),
          }}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "…" : "Send"}
        </button>
      </form>

      <style>{dotAnimation}</style>
    </div>
  );
}

// ─── Keyframe for thinking dots (injected via <style> tag) ────────────────────

const dotAnimation = `
@keyframes ai-dot-bounce {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 52px)", // full height minus navbar
    maxWidth: 860,
    margin: "0 auto",
    padding: "0 24px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "28px 0 20px",
    borderBottom: "1px solid #111c2e",
    flexShrink: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: "#dde3ef",
    letterSpacing: "-0.4px",
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "#364760",
    marginTop: 4,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  stopBtn: {
    fontSize: 12,
    color: "#f87171",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 6,
    padding: "4px 12px",
    cursor: "pointer",
  },
  clearBtn: {
    fontSize: 12,
    color: "#4a5872",
    background: "transparent",
    border: "1px solid #1b2438",
    borderRadius: 6,
    padding: "4px 12px",
    cursor: "pointer",
  },
  clearBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  messages: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "20px 0",
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 12,
    padding: "40px 0",
    textAlign: "center" as const,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: "#c0cce0",
    margin: 0,
  },
  emptyHint: {
    fontSize: 13,
    color: "#364760",
    maxWidth: 420,
    lineHeight: 1.6,
    margin: 0,
  },
  hintRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    justifyContent: "center",
    marginTop: 8,
  },
  hintBtn: {
    fontSize: 12,
    color: "#4a5872",
    background: "#0d1117",
    border: "1px solid #1b2438",
    borderRadius: 20,
    padding: "5px 14px",
    cursor: "pointer",
  },
  userBubble: {
    alignSelf: "flex-end" as const,
    maxWidth: "75%",
    background: "#0e1a30",
    border: "1px solid #1b3050",
    borderRadius: "12px 12px 2px 12px",
    padding: "10px 14px",
  },
  assistantBubble: {
    alignSelf: "flex-start" as const,
    maxWidth: "85%",
    background: "#0d1117",
    border: "1px solid #1a2336",
    borderRadius: "12px 12px 12px 2px",
    padding: "10px 14px",
  },
  userLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#4f8ef7",
    display: "block",
    marginBottom: 5,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  assistantLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#364760",
    display: "block",
    marginBottom: 5,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  messageContent: {
    fontSize: 14,
    color: "#c4cedd",
    lineHeight: 1.65,
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  thinkingRow: {
    display: "flex",
    gap: 5,
    alignItems: "center",
    padding: "4px 0",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3a5070",
    display: "inline-block",
    animation: "ai-dot-bounce 1.4s ease-in-out infinite",
  },
  errorBubble: {
    alignSelf: "flex-start" as const,
    background: "rgba(248,113,113,0.06)",
    border: "1px solid rgba(248,113,113,0.15)",
    borderRadius: 10,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#f87171",
    margin: 0,
  },
  retryBtn: {
    fontSize: 12,
    color: "#f87171",
    background: "transparent",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 6,
    padding: "3px 10px",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "16px 0 24px",
    borderTop: "1px solid #111c2e",
    flexShrink: 0,
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: "#0d1117",
    border: "1px solid #1a2336",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    color: "#dde3ef",
    fontFamily: "inherit",
    resize: "none" as const,
    outline: "none",
    lineHeight: 1.5,
    minHeight: 44,
    maxHeight: 200,
    overflowY: "auto" as const,
  },
  sendBtn: {
    background: "#162340",
    border: "1px solid #1e3060",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 500,
    color: "#60a5fa",
    cursor: "pointer",
    flexShrink: 0,
    height: 44,
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
};
