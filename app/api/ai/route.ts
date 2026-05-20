import { NextResponse } from "next/server";

/**
 * Your existing AI auto-debug loop
 */
async function autoDebugFix(
  initialError: string,
  memoryContext: string,
  projectContext: {
    packageJson: any;
    nextConfig: string | null;
    tsconfig: string;
  }
) {
  const maxRetries = 3;
  let lastError = initialError;

  for (let i = 0; i < maxRetries; i++) {
    const fixRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        stream: false,
        prompt: `
You are fixing a Next.js build error.

MEMORY:
${memoryContext}

PROJECT FILES (SAFE SNAPSHOT):

package.json:
${JSON.stringify(projectContext.packageJson ?? {}, null, 2)}

next.config:
${projectContext.nextConfig ?? "none"}

tsconfig:
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
        `,
      }),
    });

    const data = await fixRes.json();

    let parsed;

    try {
      parsed = JSON.parse(data.response);
    } catch {
      break;
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        await fetch("http://localhost:3000/api/ai-edit", {
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

    const testRes = await fetch("http://localhost:3000/api/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "npm run build" }),
    });

    const testData = await testRes.json();

    if (!testData.stderr && !testData.error) {
      return {
        success: true,
        fixed: true,
      };
    }

    lastError = testData.stderr || testData.error || "unknown error";
  }

  return {
    success: false,
    fixed: false,
    lastError,
  };
}

/**
 * MAIN AI ROUTE
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || "";

    const memoryContext = "memory disabled for now";

    // IMPORTANT: no unsafe fields like "structure" or "files"
    const projectContext = {
      packageJson: {},
      nextConfig: null,
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