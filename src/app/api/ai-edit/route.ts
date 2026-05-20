import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

// Explicit Node.js runtime — required for fs and child_process
export const runtime = "nodejs";

const execAsync = promisify(exec);

// Ollama endpoint — override via env var for non-local environments
const AI_ENDPOINT =
  process.env.OLLAMA_URL
    ? `${process.env.OLLAMA_URL}/api/chat`
    : "http://localhost:11434/api/chat";

type AIEditRequest = {
  instruction: string;
};

/**
 * Read project config files for AI context
 */
async function getProjectContext() {
  const files = ["package.json", "next.config.js", "tsconfig.json"];
  const context: Record<string, string> = {};

  for (const file of files) {
    try {
      context[file] = await fs.readFile(
        path.join(process.cwd(), file),
        "utf-8"
      );
    } catch {
      context[file] = "NOT_FOUND";
    }
  }

  return context;
}

/**
 * Apply file edits received from AI
 * Expected AI response format:
 * { "files": [{ "path": "relative/path", "content": "full content" }] }
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
 * Run lint as a post-edit diagnostic
 */
async function runDiagnostics() {
  try {
    const { stdout, stderr } = await execAsync("npm run lint");
    return { success: true, output: stdout + stderr };
  } catch (err: any) {
    return { success: false, output: err.stdout + err.stderr };
  }
}

/**
 * Call Ollama-compatible AI endpoint
 */
async function callAI(
  instruction: string,
  context: any,
  errorLog?: string
) {
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
You can read project files, edit files, and fix errors.

RULES:
- Always return VALID JSON ONLY
- No markdown, no explanation text

OUTPUT FORMAT:
{
  "files": [
    { "path": "relative/path", "content": "full file content" }
  ]
}
          `.trim(),
        },
        {
          role: "user",
          content: `
INSTRUCTION:
${instruction}

PROJECT CONTEXT:
${JSON.stringify(context, null, 2)}

${errorLog ? `ERROR LOG:\n${errorLog}` : ""}
          `.trim(),
        },
      ],
      stream: false,
    }),
  });

  return res.json();
}

/**
 * Auto-debug loop: edit → lint → retry up to 3 times
 */
async function autoFixLoop(instruction: string, context: any) {
  const result = await callAI(instruction, context);
  await applyEdits(result);

  let diagnostics = await runDiagnostics();
  let attempts = 0;

  while (!diagnostics.success && attempts < 3) {
    attempts++;
    const fixResult = await callAI(
      "Fix the errors from diagnostics",
      context,
      diagnostics.output
    );
    await applyEdits(fixResult);
    diagnostics = await runDiagnostics();
  }

  return diagnostics;
}

/**
 * POST /api/ai-edit
 * Body: { instruction: string }
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
