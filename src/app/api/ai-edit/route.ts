/**
 * POST /api/ai-edit
 *
 * Applies AI-generated file patches.
 * Requests the AI to generate file edits given an instruction,
 * then applies those edits to the local filesystem.
 *
 * LOCAL ONLY: File writes use process.cwd() which is the project root.
 * On Vercel: writes go to /tmp (ephemeral, cleared between invocations).
 * For persistent edits on Vercel: GitHub API commit + Deploy Hook (Phase 2).
 *
 * All model access goes through src/lib/models.ts — no direct fetches.
 */

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { generateText } from "@/lib/models";
import type { CoreMessage } from "ai";

export const runtime = "nodejs";

const execAsync = promisify(exec);

type AIEditRequest = {
  instruction: string;
};

type FileEdit = {
  path: string;
  content: string;
};

// ─── Context reader ───────────────────────────────────────────────────────────

async function getProjectContext(): Promise<Record<string, string>> {
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

// ─── File patch applier ───────────────────────────────────────────────────────

async function applyEdits(edits: FileEdit[]): Promise<void> {
  for (const edit of edits) {
    const fullPath = path.join(process.cwd(), edit.path);
    // Security: ensure path stays within cwd
    if (!fullPath.startsWith(process.cwd())) {
      console.warn(`[ai-edit] Rejected out-of-bounds path: ${edit.path}`);
      continue;
    }
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, edit.content, "utf-8");
  }
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

async function runDiagnostics(): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync("npm run lint", {
      cwd: process.cwd(),
      timeout: 30_000,
    });
    return { success: true, output: stdout + stderr };
  } catch (err: any) {
    return { success: false, output: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

// ─── AI edit loop ─────────────────────────────────────────────────────────────

async function autoFixLoop(
  instruction: string,
  context: Record<string, string>
): Promise<{ success: boolean; output: string }> {
  const systemPrompt = `You are a senior software engineer. Apply the requested change to the project.
Return ONLY valid JSON. No markdown, no explanations.
Format: { "files": [{ "path": "relative/path", "content": "full file content" }] }`;

  const userContent = `INSTRUCTION:\n${instruction}\n\nCONTEXT:\n${JSON.stringify(
    context,
    null,
    2
  )}`;

  const messages: CoreMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  // First attempt
  const result = await generateText(messages, { temperature: 0.1, maxTokens: 4000 });
  let editsJson: { files: FileEdit[] } | null = null;
  try {
    editsJson = JSON.parse(result.text);
  } catch {
    return { success: false, output: "AI returned non-JSON response" };
  }
  if (editsJson?.files) await applyEdits(editsJson.files);

  let diagnostics = await runDiagnostics();
  let attempts = 0;

  while (!diagnostics.success && attempts < 3) {
    attempts++;
    const fixMessages: CoreMessage[] = [
      ...messages,
      { role: "assistant", content: result.text },
      {
        role: "user",
        content: `Diagnostics failed:\n${diagnostics.output}\nReturn corrected JSON only.`,
      },
    ];
    const fixResult = await generateText(fixMessages, {
      temperature: 0.1,
      maxTokens: 4000,
    });
    try {
      const fixEdits: { files: FileEdit[] } = JSON.parse(fixResult.text);
      if (fixEdits?.files) await applyEdits(fixEdits.files);
    } catch {
      break;
    }
    diagnostics = await runDiagnostics();
  }

  return diagnostics;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body: AIEditRequest = await req.json();
    const context = await getProjectContext();
    const result = await autoFixLoop(body.instruction, context);
    return NextResponse.json({ success: result.success, logs: result.output });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
