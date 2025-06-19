import { existsSync } from "fs";
import { join } from "path";
import fs from "fs-extra";

export type FrameworkType = "nextjs" | "vite" | "astro" | "unknown";

export interface ProjectInfo {
  root: string;
  framework: FrameworkType;
  hasTypeScript: boolean;
  packageJson: any;
}

export async function detectFramework(
  projectRoot: string
): Promise<FrameworkType> {
  const packageJsonPath = join(projectRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    return "unknown";
  }

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for Next.js
    if (allDeps.next) {
      return "nextjs";
    }

    // Check for Astro
    if (allDeps.astro) {
      return "astro";
    }

    // Check for Vite
    if (
      allDeps.vite ||
      allDeps["@vitejs/plugin-react"] ||
      allDeps["@vitejs/plugin-react-swc"]
    ) {
      return "vite";
    }

    // Check for config files
    const configFiles = [
      "next.config.js",
      "next.config.mjs",
      "next.config.ts",
      "vite.config.js",
      "vite.config.ts",
      "vite.config.mjs",
      "astro.config.js",
      "astro.config.ts",
      "astro.config.mjs",
    ];

    for (const configFile of configFiles) {
      if (existsSync(join(projectRoot, configFile))) {
        if (configFile.startsWith("next")) return "nextjs";
        if (configFile.startsWith("vite")) return "vite";
        if (configFile.startsWith("astro")) return "astro";
      }
    }

    return "unknown";
  } catch (error) {
    return "unknown";
  }
}

export async function findProjectRoot(): Promise<ProjectInfo | null> {
  let currentDir = process.cwd();

  while (currentDir !== "/") {
    const packageJsonPath = join(currentDir, "package.json");

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          await fs.readFile(packageJsonPath, "utf-8")
        );
        const framework = await detectFramework(currentDir);

        if (framework !== "unknown") {
          return {
            root: currentDir,
            framework,
            hasTypeScript: existsSync(join(currentDir, "tsconfig.json")),
            packageJson,
          };
        }
      } catch (error) {
        // Continue searching if package.json is malformed
      }
    }

    // Move up one directory
    const parentDir = join(currentDir, "..");
    if (parentDir === currentDir) break; // Reached root
    currentDir = parentDir;
  }

  return null;
}
