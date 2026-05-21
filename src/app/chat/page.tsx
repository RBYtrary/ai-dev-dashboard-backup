/**
 * /chat — Server Component shell.
 * Keeps the page itself as a Server Component so metadata and
 * future server-side setup (e.g. auth check) can live here.
 * The actual interactive UI is a Client Component boundary.
 */

import type { Metadata } from "next";
import ChatInterface from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Chat — AI Dev OS",
  description: "AI chat with automatic intent routing",
};

export default function ChatPage() {
  return <ChatInterface />;
}
