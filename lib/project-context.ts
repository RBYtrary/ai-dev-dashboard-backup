import fs from "fs";
import path from "path";

export function getProjectContext() {
  const root = process.cwd();

  const importantFiles = [
    "package.json",
    "next.config.js",
    "tsconfig.json"
  ];

  const files = importantFiles.map((file) => {
    const filePath = path.join(root, file);

    try {
      const content = fs.readFileSync(filePath, "utf-8");

      return {
        file,
        content
      };
    } catch {
      return {
        file,
        content: "FILE_NOT_FOUND"
      };
    }
  });

  return {
    structure: "Next.js App Router project",
    files
  };
}