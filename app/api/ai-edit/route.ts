import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * CONFIG
 * You can later swap this to Ollama / OpenAI
 */
const AI_ENDPOINT = "http://localhost:11434/api/chat"; // Ollama default

type AIEditRequest = {
  instruction: string;
};

/**
 * Helper: read full project context (light version)
 */
async function getProjectContext() {
  const files = [
    "package.json",
    "next.config.js",
    "tsconfig.json",
  ];

  const context: Record<string, string> = {};

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(process.cwd(), file), "utf-8");
      context[file] = content;
    } catch {
      context[file] = "NOT_FOUND";
    }
  }

  return context;
}

/**
 * Helper: apply file edits from AI
 * AI must return:
 * {
 *   files: [
 *     { path: "app/page.tsx", content: "..." }
 *   ]
 * }
 */
async function applyEdits(edits: any) {
  if (!edits?.files) return;

  for (const file of edits.files) {
    const fullPath = path.join(process.cwd(), file.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf-8");
  }
}

/**
 * Helper: run diagnostics after edits
 */
async function runDiagnostics() {
  try {
    const { stdout, stderr } = await execAsync("npm run lint");
    return { success: true, output: stdout + stderr };
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout + err.stderr,
    };
  }
}

/**
 * Call AI (Ollama-style)
 */
async function callAI(instruction: string, context: any, errorLog?: string) {
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      messages: [
        {
          role: "system",
          content: `
You are a senior software engineer inside a Next.js project.

You can:
- read project files
- edit files
- fix errors

RULES:
- Always return VALID JSON ONLY
- No markdown
- No explanation text

OUTPUT FORMAT:
{
  "files": [
    {
      "path": "relative/path",
      "content": "full file content"
    }
  ]
}

If fixing errors, prioritize correctness over creativity.
          `,
        },
        {
          role: "user",
          content: `
INSTRUCTION:
${instruction}

PROJECT CONTEXT:
${JSON.stringify(context, null, 2)}

${errorLog ? `ERROR LOG:\n${errorLog}` : ""}
          `,
        },
      ],
      stream: false,
    }),
  });

  return res.json();
}

/**
 * AUTO DEBUG LOOP
 */
async function autoFixLoop(instruction: string, context: any) {
  let result = await callAI(instruction, context);

  let edits = result;

  await applyEdits(edits);

  let diagnostics = await runDiagnostics();

  let attempts = 0;

  while (!diagnostics.success && attempts < 3) {
    attempts++;

    const fixResult = await callAI(
      "Fix the errors from diagnostics",
      context,
      diagnostics.output
    );

    edits = fixResult;

    await applyEdits(edits);

    diagnostics = await runDiagnostics();
  }

  return diagnostics;
}

/**
 * MAIN ROUTE
 */
export async function POST(req: Request) {
  try {
    const body: AIEditRequest = await req.json();

    const context = await getProjectContext();

    const result = await autoFixLoop(body.instruction, context);

    return NextResponse.json({
      success: result.success,
      logs: result.output,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}