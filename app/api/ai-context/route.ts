import fs from "fs";
import path from "path";

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (file === "node_modules" || file === ".next" || file === ".git") {
      continue;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

export async function GET() {
  try {
    const root = process.cwd();
    const files = walk(root);

    // keep it lightweight (don’t send full contents yet)
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