import fs from "fs";
import path from "path";

const MEMORY_FILE = path.join(process.cwd(), "ai-memory.json");

export function getMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify({ memories: [] }, null, 2));
    }

    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  } catch {
    return { memories: [] };
  }
}

export function addMemory(entry: string) {
  const memory = getMemory();

  memory.memories.push({
    entry,
    timestamp: new Date().toISOString(),
  });

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

export function clearMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({ memories: [] }, null, 2));
}