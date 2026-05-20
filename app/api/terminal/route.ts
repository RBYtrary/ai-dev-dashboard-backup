import { exec } from "child_process";
import path from "path";

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!command) {
      return Response.json({ error: "No command provided" }, { status: 400 });
    }

    // 🚨 SAFETY LAYER (very important)
    const allowedCommands = [
      "npm run dev",
      "npm run build",
      "npm install",
      "npm test",
      "git status",
      "git log",
    ];

    if (!allowedCommands.includes(command)) {
      return Response.json({
        error: "Command not allowed",
        command,
      });
    }

    const cwd = process.cwd();

    return new Promise((resolve) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        resolve(
          Response.json({
            command,
            stdout,
            stderr,
            error: error ? error.message : null,
          })
        );
      });
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Terminal error" },
      { status: 500 }
    );
  }
}