// Simple in-memory store (resets on deploy/restart)

type MemoryEntry = {
  id: string;
  content: string;
  timestamp: number;
};

const memory: MemoryEntry[] = [];

export function addMemory(content: string) {
  const entry = {
    id: Math.random().toString(36).substring(2),
    content,
    timestamp: Date.now(),
  };

  memory.push(entry);
  return entry;
}

export function getMemory() {
  return memory;
}

export function clearMemory() {
  memory.length = 0;
}