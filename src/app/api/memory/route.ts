import { addMemory, getMemory } from "@/lib/memory-store";

export async function GET() {
  return Response.json(getMemory());
}

export async function POST(req: Request) {
  const { memory } = await req.json();

  if (!memory) {
    return Response.json({ error: "No memory provided" }, { status: 400 });
  }

  addMemory(memory);
  return Response.json({ status: "saved" });
}
