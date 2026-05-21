/**
 * GET  /api/memory         — return all system memory entries
 * POST /api/memory         — add an entry to system memory
 *
 * Uses src/lib/memory.ts abstraction (Vercel KV with fallback).
 */

import { addMemory, getMemory } from "@/lib/memory";

export async function GET() {
  try {
    const entries = await getMemory();
    return Response.json(entries);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { memory } = await req.json();
    if (!memory || typeof memory !== "string") {
      return Response.json({ error: "memory string is required" }, { status: 400 });
    }
    const entry = await addMemory(memory);
    return Response.json({ status: "saved", entry });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
