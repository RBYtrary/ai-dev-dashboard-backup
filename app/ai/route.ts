import { getProjectContext } from "@/lib/project-context";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.message) {
      return Response.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    // 🔥 Load project context (your AI now "sees" the repo)
    const projectContext = getProjectContext();

    const systemPrompt = `
You are the AI core of a developer dashboard system.

You are embedded inside this project and act as:
- senior software engineer
- system architect
- debugging assistant

You MUST use the project context below to understand the system.

PROJECT STRUCTURE:
${projectContext.structure}

IMPORTANT FILE SNAPSHOT:
${projectContext.files
  .map((f) => `\n--- ${f.file} ---\n${f.content}`)
  .join("\n")}

RULES:
- Do NOT hallucinate files that are not shown here.
- If something is missing, say so clearly.
- Base all answers on the provided project context.
- Think like you are working inside this codebase.
`;

    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: body.message,
          },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      return Response.json(
        { error: "Ollama not responding" },
        { status: 500 }
      );
    }

    const data = await res.json();

    return Response.json({
      reply: data.message?.content ?? "No response",
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}