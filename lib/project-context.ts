import fs from "fs";
import path from "path";

export function getProjectContext() {
  const root = process.cwd();

  const packageJson = fs.readFileSync(
    path.join(root, "package.json"),
    "utf-8"
  );

  const nextConfigPath = path.join(root, "next.config.js");
  const tsconfigPath = path.join(root, "tsconfig.json");

  const nextConfig = fs.existsSync(nextConfigPath)
    ? fs.readFileSync(nextConfigPath, "utf-8")
    : null;

  const tsconfig = fs.readFileSync(tsconfigPath, "utf-8");

  return {
    packageJson: JSON.parse(packageJson),
    nextConfig,
    tsconfig,
  };
}