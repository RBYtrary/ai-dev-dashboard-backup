/**
 * POST /api/terminal
 *
 * Executes whitelisted shell commands.
 * LOCAL ONLY — returns 501 on Vercel (child_process.exec is not
 * reliable in serverless and will timeout for long-running builds).
 *
 * SECURITY RULES (enforced, non-negotiable):
 * - Exact-match whitelist only (no regex, no substring, no glob)
 * - No dynamic command construction
 * - No shell interpolation
 * - No eval
 * - No AI-generated command execution
 * - Commands must be literal strings from ALLOWED_COMMANDS
 */

import { exec } from "child_process";

export const runtime = "nodejs";

const IS_VERCEL = process.env.VERCEL === "1";

// Exact-match whitelist. Never use includes(), startsWith(), or regex here.
const ALLOWED_COMMANDS = new Set([
  "npm run dev",
  "npm run build",
  "npm run lint",
  "npm install",
  "npm test",
  "git status",
  "git log",
]);

export async function POST(req: Request): Promise<Response> {
  if (IS_VERCEL) {
    return Response.json(
      {
        error:
          "terminal requires local runtime. " +
          "child_process.exec is not supported in Vercel serverless functions.",
        code: "LOCAL_ONLY",
      },
      { status: 501 }
    );
  }

  try {
    const { command } = await req.json();

    if (!command || typeof command !== "string") {
      return Response.json({ error: "command is required" }, { status: 400 });
    }

    // Exact-match check — no fuzzy matching, no dynamic construction
    if (!ALLOWED_COMMANDS.has(command)) {
      return Response.json(
        {
          error: "Command not in allowlist",
          command,
          allowed: [...ALLOWED_COMMANDS],
        },
        { status: 403 }
      );
    }

    const cwd = process.cwd();

    const result = await new Promise<{
      stdout: string;
      stderr: string;
      error: string | null;
    }>((resolve) => {
      exec(
        command,
        { cwd, timeout: 60_000 }, // 60s hard limit
        (err, stdout, stderr) => {
          resolve({ stdout, stderr, error: err ? err.message : null });
        }
      );
    });

    return Response.json({ command, ...result });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Terminal error" },
      { status: 500 }
    );
  }
}
