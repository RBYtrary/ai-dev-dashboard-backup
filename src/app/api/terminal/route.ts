import { exec } from "child_process";

// Explicit Node.js runtime — required for child_process (not available in Edge)
export const runtime = "nodejs";

const ALLOWED_COMMANDS = [
  "npm run dev",
  "npm run build",
  "npm install",
  "npm test",
  "git status",
  "git log",
];

export async function POST(req: Request): Promise<Response> {
  try {
    const { command } = await req.json();

    if (!command) {
      return Response.json({ error: "No command provided" }, { status: 400 });
    }

    if (!ALLOWED_COMMANDS.includes(command)) {
      return Response.json(
        { error: "Command not allowed", command },
        { status: 403 }
      );
    }

    const cwd = process.cwd();

    const result = await new Promise<{
      stdout: string;
      stderr: string;
      error: string | null;
    }>((resolve) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          error: error ? error.message : null,
        });
      });
    });

    return Response.json({ command, ...result });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Terminal error" },
      { status: 500 }
    );
  }
}
