import fs from "fs";
import path from "path";

function safePath(filePath: string) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fullPath.startsWith(process.cwd())) {
    throw new Error("Invalid path");
  }

  return fullPath;
}

export function readFile(filePath: string) {
  return fs.readFileSync(safePath(filePath), "utf-8");
}

export function writeFile(filePath: string, content: string) {
  fs.writeFileSync(safePath(filePath), content, "utf-8");

  return { success: true, filePath };
}