import { exec } from "child_process";

export async function POST(req: Request): Promise<Response> {
  try {
    const { command } = await req.json();

    if (!command) {
      return Response.json(
        { error: "No command provided" },
        { status: 400 }
      );
    }

    // 🚨 SAFETY LAYER
    const allowedCommands = [
      "npm run dev",
      "npm run build",
      "npm install",
      "npm test",
      "git status",
      "git log",
    ];

    if (!allowedCommands.includes(command)) {
      return Response.json(
        {
          error: "Command not allowed",
          command,
        },
        { status: 403 }
      );
    }

    const cwd = process.cwd();

    // ✅ FIX: wrap exec in a properly typed Promise<Response>
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

    return Response.json({
      command,
      ...result,
    });
  } catch (err: any) {
    return Response.json(
      {
        error: err?.message ?? "Terminal error",
      },
      { status: 500 }
    );
  }
}