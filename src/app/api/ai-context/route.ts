import fs from "fs";
import path from "path";

// Explicit Node.js runtime — required for fs (not available in Edge)
export const runtime = "nodejs";

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file === "node_modules" || file === ".next" || file === ".git") {
      continue;
    }

    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * GET /api/ai-context
 * Returns full file tree of the project (excluding build artifacts).
 * Used by the AI system to understand its own codebase.
 */
export async function GET() {
  try {
    const root = process.cwd();
    const files = walk(root);

    const structure = files.map((f) =>
      f.replace(root, "").replace(/\\/g, "/")
    );

    return Response.json({
      projectRoot: root,
      files: structure,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
