import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "fs";
import fs from "fs-extra";
import { join, dirname } from "path";
import { downloadComponent } from "../utils/download.js";
import {
  installDependencies,
  installDependenciesWithProgress,
  checkDependencyManager,
} from "../utils/dependencies.js";
import { findProjectRoot } from "../utils/project.js";
import { checkMissingDependencies } from "../utils/project-info.js";
import { COMPONENTS } from "../config/components.js";
import { isHextaUIInitialized } from "../utils/init-check.js";
import { initCommand } from "./init.js";
import {
  resolveRequiredComponents,
  getInstallationList,
  validateComponentNames,
} from "../utils/component-resolver.js";

export async function addComponents(
  componentArgs: string[] = [],
  options: { deps?: boolean; noDeps?: boolean; fast?: boolean } = {}
) {
  console.clear();

  p.intro(pc.bgCyan(pc.black(" HextaUI ")));

  // Find project root
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    p.cancel(
      "Could not find a Next.js project. Please run this command in a Next.js project."
    );
    process.exit(1);
  }
  p.log.step(`Found Next.js project at: ${pc.cyan(projectRoot)}`);

  // Check if HextaUI is initialized
  const isInitialized = await isHextaUIInitialized(projectRoot);

  if (!isInitialized) {
    p.log.warn("HextaUI is not initialized in this project.");

    const shouldAutoInit = await p.confirm({
      message: "Would you like to initialize HextaUI now?",
      initialValue: true,
    });

    if (p.isCancel(shouldAutoInit) || !shouldAutoInit) {
      p.cancel('Please run "npx hextaui init" first to set up your project.');
      process.exit(0);
    }

    // Run initialization
    p.log.step("Running HextaUI initialization...");
    await initCommand();
    p.log.success(
      "HextaUI initialized successfully! Continuing with component installation...\n"
    );
  }

  // Now we know HextaUI is initialized
  const componentsDir = join(projectRoot, "src", "components", "ui");

  let selectedComponents: string[] = [];

  // Check if components were provided as arguments
  if (componentArgs.length > 0) {
    const { validComponents, invalidNames } =
      validateComponentNames(componentArgs);

    if (invalidNames.length > 0) {
      const availableNames = COMPONENTS.map((c) => c.name);
      const suggestions = invalidNames
        .map((name) => {
          // Find close matches using simple string similarity
          const closeMatches = availableNames
            .filter(
              (available) =>
                available.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(available.toLowerCase())
            )
            .slice(0, 3);

          return closeMatches.length > 0
            ? `${pc.red(name)} → Did you mean: ${closeMatches
                .map((m) => pc.cyan(m))
                .join(", ")}?`
            : `${pc.red(name)} → No close matches found`;
        })
        .join("\n  ");

      p.cancel(
        `Invalid component name(s):\n  ${suggestions}\n\n` +
          `Use ${pc.cyan("npx hextaui list")} to see all available components.`
      );
      process.exit(1);
    }

    selectedComponents = validComponents.map((c) => c.name);

    p.log.step(
      `Installing component${
        selectedComponents.length > 1 ? "s" : ""
      }: ${selectedComponents.map((name) => pc.cyan(name)).join(", ")}`
    );
  } else {
    // Show component selection
    const userSelection = await p.multiselect({
      message: "Which components would you like to add?",
      options: COMPONENTS.map((component) => ({
        value: component.name,
        label: component.name,
        hint: component.description,
      })),
      required: false,
    });

    if (p.isCancel(userSelection) || userSelection.length === 0) {
      p.cancel("No components selected.");
      process.exit(0);
    }

    selectedComponents = userSelection as string[];
  }

  // Resolve required components
  const installationList = getInstallationList(selectedComponents);
  const componentsToInstall = installationList.total;

  // Show required components if any
  if (installationList.required.length > 0) {
    p.note(
      `The following components will also be installed as dependencies:\n\n` +
        installationList.required
          .map((name) => `  ${pc.cyan("+")} ${name}`)
          .join("\n"),
      "Required Components"
    );
  } // Collect dependencies from all components (requested + required)
  const allDependencies = new Set<string>();
  const componentDependencies: { [key: string]: string[] } = {};
  let shouldInstallDeps = options.deps || false; // Default to false for speed

  // Fast mode overrides everything
  if (options.fast) {
    options.noDeps = true;
  }

  componentsToInstall.forEach((component) => {
    if (component.dependencies && component.dependencies.length > 0) {
      componentDependencies[component.name] = component.dependencies;
      component.dependencies.forEach((dep) => allDependencies.add(dep));
    }
  }); // Show dependencies if any
  if (allDependencies.size > 0 && !options.noDeps) {
    // Check which dependencies are already installed
    const { missing, existing } = await checkMissingDependencies(
      Array.from(allDependencies),
      projectRoot
    );

    const componentDependencyInfo = Object.entries(componentDependencies)
      .map(([component, deps]) => `  ${pc.cyan(component)}: ${deps.join(", ")}`)
      .join("\n");

    let dependencyNote = `The following components require dependencies:\n\n${componentDependencyInfo}\n\n`;

    if (existing.length > 0) {
      dependencyNote += `${pc.green("✓ Already installed:")} ${existing.join(
        ", "
      )}\n`;
    }
    if (missing.length > 0) {
      dependencyNote += `${pc.yellow("⚠ Need to install:")} ${missing.join(
        ", "
      )}`;
      if (!options.deps) {
        dependencyNote += `\n\n${pc.dim(
          "💡 Tip: Use --deps to auto-install, --no-deps to skip, or --fast for maximum speed"
        )}`;
      }
    } else {
      dependencyNote += `${pc.green(
        "✓ All dependencies are already installed!"
      )}`;
      shouldInstallDeps = false; // No need to install anything
    }

    p.note(dependencyNote, "Dependencies Status");

    if (missing.length > 0 && !options.deps) {
      const confirmInstallDeps = await p.confirm({
        message: `Install ${missing.length} missing dependencies? (can be slow)`,
        initialValue: false, // Changed to false for faster workflow
      });

      if (p.isCancel(confirmInstallDeps)) {
        p.cancel("Installation cancelled.");
        process.exit(0);
      }

      shouldInstallDeps = confirmInstallDeps;

      if (!shouldInstallDeps) {
        const packageManager = await checkDependencyManager(projectRoot);
        p.log.warn(
          "⚡ Skipping dependency installation for speed. Install manually when needed:"
        );
        p.log.info(
          `${pc.cyan(
            `${packageManager} ${packageManager === "npm" ? "install" : "add"}`
          )} ${missing.join(" ")}`
        );
      }
    } else {
      shouldInstallDeps = false; // No need to install anything
    }
  }

  const s = p.spinner();

  // Download selected components
  s.start("Downloading components...");

  try {
    for (const component of componentsToInstall) {
      await downloadComponent(component, componentsDir);
    }
    s.stop("Components downloaded successfully");
  } catch (error) {
    s.stop("Failed to download components");
    p.cancel(`Error: ${error}`);
    process.exit(1);
  } // Install dependencies if confirmed
  if (allDependencies.size > 0 && shouldInstallDeps) {
    const { missing } = await checkMissingDependencies(
      Array.from(allDependencies),
      projectRoot
    );
    if (missing.length > 0) {
      const packageManager = await checkDependencyManager(projectRoot);

      try {
        const { success, failed } = await installDependenciesWithProgress(
          missing,
          projectRoot
        );

        if (success.length > 0 && failed.length === 0) {
          p.log.success(
            `All ${pc.green(
              success.length
            )} dependencies installed successfully! 🎉`
          );
        } else if (success.length > 0 && failed.length > 0) {
          p.log.success(
            `${pc.green(success.length)} dependencies installed successfully`
          );
          p.log.warn(
            `${pc.red(failed.length)} dependencies failed: ${failed
              .map((dep) => pc.yellow(dep))
              .join(", ")}`
          );
          p.log.info(
            `Install manually: ${pc.cyan(
              `${packageManager} ${
                packageManager === "npm" ? "install" : "add"
              } ${failed.join(" ")}`
            )}`
          );
        } else if (failed.length > 0) {
          p.log.error(
            `All ${pc.red(failed.length)} dependencies failed to install`
          );
          p.log.info(
            `Install manually: ${pc.cyan(
              `${packageManager} ${
                packageManager === "npm" ? "install" : "add"
              } ${failed.join(" ")}`
            )}`
          );
        }
      } catch (error) {
        p.log.error("Dependency installation failed");
        p.log.warn(`Please manually install: ${pc.yellow(missing.join(" "))}`);
        p.log.info(
          `Run: ${pc.cyan(
            `${packageManager} ${
              packageManager === "npm" ? "install" : "add"
            } ${missing.join(" ")}`
          )}`
        );
      }
    }
  } // Show success message
  const requestedList = installationList.requested
    .map((name) => `  ${pc.green("✓")} ${name}`)
    .join("\n");

  const requiredList =
    installationList.required.length > 0
      ? `\n\nRequired components:\n` +
        installationList.required
          .map((name) => `  ${pc.cyan("+")} ${name}`)
          .join("\n")
      : "";

  const dependencyStatus =
    allDependencies.size > 0
      ? shouldInstallDeps
        ? "installed"
        : "skipped (install manually)"
      : "none required";

  p.note(
    `${pc.bold("Components added to:")} ${pc.cyan(componentsDir)}\n\n` +
      `Requested components:\n${requestedList}${requiredList}\n\n` +
      `${pc.green("✓")} ${
        componentsToInstall.length
      } total component(s) installed\n` +
      `${pc.green("✓")} ${
        allDependencies.size
      } dependenc(ies) ${dependencyStatus}`,
    "Success!"
  );

  p.outro(pc.green("All components added successfully!"));
}
