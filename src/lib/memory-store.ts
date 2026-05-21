/**
 * @deprecated SUPERSEDED by src/lib/memory.ts
 *
 * This file is kept to prevent breaking changes during migration.
 * - memory.ts provides Vercel KV persistence with in-process fallback
 * - This file uses a module-level array that resets on every serverless invocation
 *
 * All new code must import from @/lib/memory instead.
 * This file will be removed in a future cleanup pass.
 */

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