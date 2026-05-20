import { NextResponse } from "next/server";

/**
 * AI ROUTE — Brain of the auto-debug loop
 *
 * Connects to Ollama (local LLM) for fix generation,
 * then applies edits and re-runs build via internal APIs.
 *
 * OLLAMA_URL env var: override for non-local environments.
 * Self-referencing API calls use request-derived base URL.
 */

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";

/**
 * Auto-debug loop:
 * 1. Ask Ollama to generate file patches for the error
 * 2. Apply patches via /api/ai-edit
 * 3. Trigger build via /api/terminal
 * 4. Repeat until success or maxRetries exceeded
 */
async function autoDebugFix(
  initialError: string,
  memoryContext: string,
  projectContext: {
    packageJson: any;
    nextConfig: string | null;
    tsconfig: string;
  },
  baseUrl: string
) {
  const maxRetries = 3;
  let lastError = initialError;

  for (let i = 0; i < maxRetries; i++) {
    // Ask Ollama for file patches
    let fixRes: Response;
    try {
      fixRes = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          stream: false,
          prompt: `
You are fixing a Next.js build error.

MEMORY:
${memoryContext}

PACKAGE.JSON:
${JSON.stringify(projectContext.packageJson ?? {}, null, 2)}

NEXT CONFIG:
${projectContext.nextConfig ?? "none"}

TYPESCRIPT CONFIG:
${projectContext.tsconfig ?? "none"}

ERROR:
${lastError}

TASK:
Return ONLY JSON patches in this format:

[
  {
    "type": "write",
    "filePath": "path",
    "content": "full corrected file"
  }
]

No explanation.
          `.trim(),
        }),
      });
    } catch {
      // Ollama not reachable (e.g. running on Vercel without local LLM)
      break;
    }

    const data = await fixRes.json();

    let parsed: any[];
    try {
      parsed = JSON.parse(data.response);
    } catch {
      break;
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        await fetch(`${baseUrl}/api/ai-edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              type: "write",
              filePath: item.filePath,
              content: item.content,
            },
          ]),
        });
      }
    }

    const testRes = await fetch(`${baseUrl}/api/terminal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "npm run build" }),
    });

    const testData = await testRes.json();

    if (!testData.stderr && !testData.error) {
      return { success: true, fixed: true };
    }

    lastError = testData.stderr || testData.error || "unknown error";
  }

  return { success: false, fixed: false, lastError };
}

/**
 * POST /api/ai
 * Body: { message: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || "";

    // Derive base URL from request — works on all environments
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Stable context (expand as system grows)
    const memoryContext = "memory disabled for now";
    const projectContext = {
      packageJson: {},
      nextConfig: null as string | null,
      tsconfig: "",
    };

    return NextResponse.json({
      success: true,
      reply: `AI received: ${message}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
