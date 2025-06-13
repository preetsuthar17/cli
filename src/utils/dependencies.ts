import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";
import * as p from "@clack/prompts";
import pc from "picocolors";

const execAsync = promisify(exec);

export async function checkDependencyManager(
  projectRoot: string
): Promise<"pnpm" | "yarn" | "npm" | "bun"> {
  // Check for lock files to determine package manager
  if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (existsSync(join(projectRoot, "yarn.lock"))) {
    return "yarn";
  }
  if (existsSync(join(projectRoot, "bun.lockb"))) {
    return "bun";
  }
  return "npm";
}

export async function installDependencies(
  dependencies: string[],
  projectRoot: string
): Promise<void> {
  if (dependencies.length === 0) return;

  const packageManager = await checkDependencyManager(projectRoot);

  let command: string;

  switch (packageManager) {
    case "pnpm":
      command = `pnpm add ${dependencies.join(" ")}`;
      break;
    case "yarn":
      command = `yarn add ${dependencies.join(" ")}`;
      break;
    case "bun":
      command = `bun add ${dependencies.join(" ")}`;
      break;
    default:
      command = `npm install ${dependencies.join(" ")}`;
      break;
  }

  try {
    await execAsync(command, { cwd: projectRoot });
  } catch (error) {
    // If preferred package manager fails, try npm as fallback
    if (packageManager !== "npm") {
      const npmCommand = `npm install ${dependencies.join(" ")}`;
      await execAsync(npmCommand, { cwd: projectRoot });
    } else {
      throw error;
    }
  }
}

export async function installDependenciesWithProgress(
  dependencies: string[],
  projectRoot: string
): Promise<{ success: string[]; failed: string[] }> {
  if (dependencies.length === 0) return { success: [], failed: [] };

  const packageManager = await checkDependencyManager(projectRoot);
  const success: string[] = [];
  const failed: string[] = [];

  // Show what we're about to install
  p.log.message(
    `Installing ${pc.cyan(dependencies.length)} dependencies with ${pc.cyan(
      packageManager
    )}:`
  );
  p.log.message(
    `${dependencies.map((dep) => pc.dim(`• ${dep}`)).join("\n")}\n`
  );

  const getCommand = (dep: string) => {
    switch (packageManager) {
      case "pnpm":
        return `pnpm add ${dep}`;
      case "yarn":
        return `yarn add ${dep}`;
      case "bun":
        return `bun add ${dep}`;
      default:
        return `npm install ${dep}`;
    }
  };

  for (let i = 0; i < dependencies.length; i++) {
    const dep = dependencies[i]!; // Non-null assertion since we know the index is valid
    const progress = `[${i + 1}/${dependencies.length}]`;
    const progressBar = `${pc.dim("━".repeat(i))}${pc.cyan("━")}${pc.dim(
      "━".repeat(dependencies.length - i - 1)
    )}`;

    try {
      const s = p.spinner();
      s.start(`${progress} ${progressBar} Installing ${pc.cyan(dep)}...`);

      const command = getCommand(dep);
      await execAsync(command, { cwd: projectRoot });

      s.stop(`${progress} ${pc.green("✓")} ${pc.cyan(dep)}`);
      success.push(dep);
    } catch (error) {
      // Try fallback to npm if the preferred package manager fails
      if (packageManager !== "npm") {
        try {
          const s = p.spinner();
          s.start(
            `${progress} ${progressBar} Retrying ${pc.cyan(
              dep
            )} with ${pc.yellow("npm")}...`
          );

          const npmCommand = `npm install ${dep}`;
          await execAsync(npmCommand, { cwd: projectRoot });

          s.stop(
            `${progress} ${pc.green("✓")} ${pc.cyan(dep)} ${pc.dim(
              "(npm fallback)"
            )}`
          );
          success.push(dep);
          continue;
        } catch (npmError) {
          // Both failed
        }
      }

      const s = p.spinner();
      s.stop(`${progress} ${pc.red("✗")} ${pc.cyan(dep)} ${pc.red("failed")}`);
      failed.push(dep);
    }
  }

  return { success, failed };
}
