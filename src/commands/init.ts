import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "fs-extra";
import { join } from "path";
import { findProjectRoot, FrameworkType } from "../utils/project.js";
import {
  installDependencies,
  checkDependencyManager,
} from "../utils/dependencies.js";
import { createInitMarker } from "../utils/init-check.js";
import {
  getFrameworkConfig,
  getComponentsDir,
  getUtilsDir,
} from "../config/frameworks.js";

const HEXTAUI_CSS_VARIABLES = `
:root {
  --radius: 0.75rem;

  --hu-background: 0, 0%, 100%;
  --hu-foreground: 0, 0%, 14%;

  --hu-card: 0, 0%, 99%;
  --hu-card-foreground: 0, 0%, 14%;

  --hu-primary: 0, 0%, 20%;
  --hu-primary-foreground: 0, 0%, 98%;

  --hu-secondary: 0, 0%, 97%;
  --hu-secondary-foreground: 0, 0%, 20%;

  --hu-muted: 0, 0%, 97%;
  --hu-muted-foreground: 0, 0%, 56%;

  --hu-accent: 0, 0%, 96%;
  --hu-accent-foreground: 0, 0%, 20%;

  --hu-destructive: 9, 96%, 47%;
  --hu-destructive-foreground: 0, 0%, 98%;

  --hu-border: 0, 0%, 92%;
  --hu-input: 0, 0%, 100%;
  --hu-ring: 0, 0%, 71%;
}

.dark {
  --hu-background: 0, 0%, 7%;
  --hu-foreground: 0, 0%, 100%;

  --hu-card: 0, 0%, 9%;
  --hu-card-foreground: 0, 0%, 100%;

  --hu-primary: 0, 0%, 100%;
  --hu-primary-foreground: 0, 0%, 20%;

  --hu-secondary: 0, 0%, 15%;
  --hu-secondary-foreground: 0, 0%, 100%;

  --hu-muted: 0, 0%, 15%;
  --hu-muted-foreground: 0, 0%, 71%;

  --hu-accent: 0, 0%, 15%;
  --hu-accent-foreground: 0, 0%, 100%;

  --hu-destructive: 0, 84%, 50%;
  --hu-destructive-foreground: 0, 0%, 98%;

  --hu-border: 0, 0%, 100%, 10%;
  --hu-input: 0, 0%, 100%, 5%;
  --hu-ring: 0, 0%, 56%;
}`;

async function findGlobalCssFile(
  projectRoot: string,
  framework: FrameworkType
): Promise<string | null> {
  const possiblePaths = (() => {
    switch (framework) {
      case "nextjs":
        return [
          "src/app/globals.css",
          "app/globals.css",
          "src/styles/globals.css",
          "styles/globals.css",
          "src/global.css",
          "global.css",
        ];
      case "vite":
        return [
          "src/index.css",
          "src/App.css",
          "src/main.css",
          "src/styles/index.css",
          "src/styles/global.css",
        ];
      case "astro":
        return [
          "src/styles/global.css",
          "src/styles/globals.css",
          "src/global.css",
          "src/layouts/Layout.astro",
        ];
      default:
        return [
          "src/index.css",
          "src/styles/index.css",
          "src/global.css",
          "src/app.css",
        ];
    }
  })();

  for (const possiblePath of possiblePaths) {
    const fullPath = join(projectRoot, possiblePath);
    if (await fs.pathExists(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function removeExistingHextaUIVariables(content: string): string {
  const lines = content.split("\n");
  const cleanedLines: string[] = [];
  let insideHextaUIBlock = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const trimmedLine = line.trim();

    // Detect start of potential HextaUI block
    if (trimmedLine === ":root {" || trimmedLine === ".dark {") {
      // Look ahead to see if this contains HextaUI variables
      let containsHextaUIVars = false;
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const lookAheadLine = lines[j];
        if (!lookAheadLine) continue;

        if (
          lookAheadLine.includes("--hu-") ||
          lookAheadLine.includes("--radius:") ||
          lookAheadLine.includes("--color-fd-")
        ) {
          containsHextaUIVars = true;
          break;
        }
        if (lookAheadLine.trim() === "}") break;
      }

      if (containsHextaUIVars) {
        insideHextaUIBlock = true;
        braceCount = 1;
        continue;
      }
    }

    if (insideHextaUIBlock) {
      // Count braces to know when block ends
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount === 0) {
        insideHextaUIBlock = false;
      }
      continue;
    }

    // Skip individual HextaUI variable lines
    if (
      trimmedLine.startsWith("--hu-") ||
      trimmedLine.startsWith("--radius:") ||
      trimmedLine.startsWith("--color-fd-")
    ) {
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n");
}

async function injectCssVariables(
  projectRoot: string,
  framework: FrameworkType
): Promise<void> {
  const globalCssPath = await findGlobalCssFile(projectRoot, framework);

  if (!globalCssPath) {
    p.log.warn("⚠️  Could not find global.css file automatically.");
    p.note(
      `Please create a global.css file and add these variables:\n\n${HEXTAUI_CSS_VARIABLES}`,
      "CSS Variables (Manual Setup)"
    );
    return;
  }

  const relativePath = globalCssPath
    .replace(projectRoot, "")
    .replace(/^[\/\\]/, "");

  // Read existing content
  const existingContent = await fs.readFile(globalCssPath, "utf-8");

  // Check if HextaUI variables already exist
  if (
    existingContent.includes("--hu-background") ||
    existingContent.includes("--hu-foreground")
  ) {
    const shouldReplace = await p.confirm({
      message: `HextaUI CSS variables already exist in ${relativePath}. Replace them?`,
      initialValue: false,
    });

    if (p.isCancel(shouldReplace) || !shouldReplace) {
      p.log.step("Skipping CSS variables injection.");
      return;
    }

    // Remove existing HextaUI variables
    const cleanedContent = removeExistingHextaUIVariables(existingContent);
    const newContent =
      cleanedContent.trimEnd() + "\n\n" + HEXTAUI_CSS_VARIABLES + "\n";

    await fs.writeFile(globalCssPath, newContent);
    p.log.success(
      `✓ Updated HextaUI CSS variables in ${pc.cyan(relativePath)}`
    );
  } else {
    // Check if there are existing CSS variables that might conflict
    const hasExistingVars =
      existingContent.includes(":root") || existingContent.includes("--");

    if (hasExistingVars) {
      p.log.warn(
        `⚠️  Existing CSS variables found in ${relativePath}.\n` +
          `   Please review and remove any conflicting variables.`
      );

      const shouldContinue = await p.confirm({
        message: "Continue adding HextaUI CSS variables?",
        initialValue: true,
      });

      if (p.isCancel(shouldContinue) || !shouldContinue) {
        p.log.step("Skipping CSS variables injection.");
        return;
      }
    }

    // Add HextaUI variables to the end of the file
    const newContent =
      existingContent.trimEnd() + "\n\n" + HEXTAUI_CSS_VARIABLES + "\n";
    await fs.writeFile(globalCssPath, newContent);
    p.log.success(`✓ Added HextaUI CSS variables to ${pc.cyan(relativePath)}`);
  }

  // Show important note about variable usage
  p.note(
    `🎨 HextaUI CSS variables have been added to your global stylesheet.\n\n` +
      `These variables provide:\n` +
      `• Light and dark theme support\n` +
      `• Consistent color scheme across components\n` +
      `• Easy customization of the design system\n\n` +
      `${pc.yellow(
        "Important:"
      )} Remove any conflicting CSS variables to avoid styling issues.`,
    "CSS Variables Added"
  );
}

function getFrameworkSpecificInstructions(framework: FrameworkType): string {
  switch (framework) {
    case "vite":
      return `1. Add alias configuration to your vite.config.js/ts:

${pc.cyan(`resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},`)}

2. Update your tsconfig.json baseUrl and paths:

${pc.cyan(`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`)}

3. Make sure Tailwind CSS is properly configured`;

    case "astro":
      return `1. Ensure you have the required integrations in astro.config.js/ts:

${pc.cyan(`import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});`)}

2. Update your tsconfig.json paths:

${pc.cyan(`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`)}

3. Install required dependencies:
   ${pc.cyan("npm install @astrojs/react @astrojs/tailwind")}`;

    default:
      return "";
  }
}

export async function initCommand() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(" HextaUI Init ")));

  // Find project root and detect framework
  const projectInfo = await findProjectRoot();
  if (!projectInfo) {
    p.cancel(
      "Could not find a supported project. Please run this command in a Next.js, Vite, or Astro project."
    );
    process.exit(1);
  }

  const { root: projectRoot, framework } = projectInfo;
  const config = getFrameworkConfig(framework);

  p.log.info(`Detected ${pc.cyan(config.displayName)} project`);

  const s = p.spinner();
  s.start("Initializing HextaUI...");
  try {
    // Create components/ui directory
    const componentsDir = getComponentsDir(framework, projectRoot);
    await fs.ensureDir(componentsDir);

    // Create utils directory and files
    const libDir = getUtilsDir(framework, projectRoot);
    await fs.ensureDir(libDir);
    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;

    const colorUtilsContent = `"use client";
/**
 * Enhanced color format utilities for the ColorPicker component
 * Provides conversion between different color formats including OKLCH and LAB
 */

import { Color, parseColor } from "react-aria-components";

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsv" | "oklch" | "lab";

export const formatLabels: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  hsv: "HSV",
  oklch: "OKLCH",
  lab: "LAB",
};

/**
 * Converts RGB values (0-1) to XYZ color space
 */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  // Convert sRGB to linear RGB
  const toLinear = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Convert to XYZ using sRGB matrix
  const x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  const y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.072175;
  const z = rLinear * 0.0193339 + gLinear * 0.119192 + bLinear * 0.9503041;

  return [x, y, z];
}

/**
 * Converts XYZ to LAB color space
 */
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  // Reference white point D65
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  const fx = x / xn;
  const fy = y / yn;
  const fz = z / zn;

  const transform = (t: number) => {
    return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  };

  const fxT = transform(fx);
  const fyT = transform(fy);
  const fzT = transform(fz);

  const L = 116 * fyT - 16;
  const a = 500 * (fxT - fyT);
  const b = 200 * (fyT - fzT);

  return [L, a, b];
}

/**
 * Converts XYZ to OKLCH color space (simplified conversion)
 */
function xyzToOklch(x: number, y: number, z: number): [number, number, number] {
  // Simplified conversion to OKLCH
  // In practice, you'd want to use a proper color library like colorjs.io

  // Convert to OKLab first (simplified)
  const l = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  // Convert to LCH
  const L_oklch = okL;
  const C = Math.sqrt(okA * okA + okB * okB);
  const H = (Math.atan2(okB, okA) * 180) / Math.PI;

  return [L_oklch, C, H < 0 ? H + 360 : H];
}

/**
 * Formats a color value according to the specified format
 */
export function formatColorValue(color: Color, format: ColorFormat): string {
  switch (format) {
    case "hex":
      return color.toString("hex");
    case "rgb": {
      const rgb = color.toFormat("rgb");
      const r = Math.round(rgb.getChannelValue("red"));
      const g = Math.round(rgb.getChannelValue("green"));
      const b = Math.round(rgb.getChannelValue("blue"));
      const alpha = rgb.getChannelValue("alpha");

      if (alpha < 1) {
        return \`rgba(\${r}, \${g}, \${b}, \${alpha.toFixed(2)})\`;
      }
      return \`rgb(\${r}, \${g}, \${b})\`;
    }
    case "hsl": {
      const hsl = color.toFormat("hsl");
      const h = Math.round(hsl.getChannelValue("hue"));
      const s = Math.round(hsl.getChannelValue("saturation"));
      const l = Math.round(hsl.getChannelValue("lightness"));
      const alpha = hsl.getChannelValue("alpha");

      if (alpha < 1) {
        return \`hsla(\${h}, \${s}%, \${l}%, \${alpha.toFixed(2)})\`;
      }
      return \`hsl(\${h}, \${s}%, \${l}%)\`;
    }
    case "hsv": {
      const hsv = color.toFormat("hsb"); // HSB is HSV in react-aria-components
      const h = Math.round(hsv.getChannelValue("hue"));
      const s = Math.round(hsv.getChannelValue("saturation"));
      const v = Math.round(hsv.getChannelValue("brightness"));
      const alpha = hsv.getChannelValue("alpha");

      if (alpha < 1) {
        return \`hsva(\${h}, \${s}%, \${v}%, \${alpha.toFixed(2)})\`;
      }
      return \`hsv(\${h}, \${s}%, \${v}%)\`;
    }
    case "oklch": {
      const rgb = color.toFormat("rgb");
      const r = rgb.getChannelValue("red") / 255;
      const g = rgb.getChannelValue("green") / 255;
      const b = rgb.getChannelValue("blue") / 255;
      const alpha = rgb.getChannelValue("alpha");

      const [x, y, z] = rgbToXyz(r, g, b);
      const [L, C, H] = xyzToOklch(x, y, z);

      if (alpha < 1) {
        return \`oklch(\${(L * 100).toFixed(1)}% \${C.toFixed(3)} \${H.toFixed(
          1,
        )} / \${alpha.toFixed(2)})\`;
      }
      return \`oklch(\${(L * 100).toFixed(1)}% \${C.toFixed(3)} \${H.toFixed(1)})\`;
    }
    case "lab": {
      const rgb = color.toFormat("rgb");
      const r = rgb.getChannelValue("red") / 255;
      const g = rgb.getChannelValue("green") / 255;
      const b = rgb.getChannelValue("blue") / 255;
      const alpha = rgb.getChannelValue("alpha");

      const [x, y, z] = rgbToXyz(r, g, b);
      const [L, a, b_lab] = xyzToLab(x, y, z);

      if (alpha < 1) {
        return \`lab(\${L.toFixed(1)}% \${a.toFixed(1)} \${b_lab.toFixed(
          1,
        )} / \${alpha.toFixed(2)})\`;
      }
      return \`lab(\${L.toFixed(1)}% \${a.toFixed(1)} \${b_lab.toFixed(1)})\`;
    }
    default:
      return color.toString("hex");
  }
}

/**
 * Parses a color string in the specified format
 */
export function parseColorFromFormat(
  value: string,
  format: ColorFormat,
): Color | null {
  try {
    // For formats that react-aria-components supports directly
    if (format === "hex" || format === "rgb" || format === "hsl") {
      return parseColor(value);
    }

    if (format === "hsv") {
      // Try to parse HSV/HSB format
      const hsvMatch = value.match(/hsva?\\(([^)]+)\\)/);
      if (hsvMatch) {
        const parts = hsvMatch[1].split(",").map((p) => p.trim());
        const h = parseFloat(parts[0]) || 0;
        const s = parseFloat(parts[1]) || 0;
        const v = parseFloat(parts[2]) || 0;
        const a = parts[3] ? parseFloat(parts[3]) : 1;

        // Convert HSV to HSL for react-aria-components
        const hslL = (v * (2 - s / 100)) / 2;
        const hslS = (v * s) / (100 - Math.abs(2 * hslL - 100));

        return parseColor(\`hsla(\${h}, \${hslS || 0}%, \${hslL}%, \${a})\`);
      }
    }

    if (format === "oklch") {
      // Parse OKLCH and convert to HSL as approximation
      const oklchMatch = value.match(/oklch\\(([^)]+)\\)/);
      if (oklchMatch) {
        const parts = oklchMatch[1].split(/[\\s\\/]+/);
        const L = parseFloat(parts[0]) || 50;
        const C = parseFloat(parts[1]) || 0;
        const H = parseFloat(parts[2]) || 0;
        const alpha = parts[3] ? parseFloat(parts[3]) : 1;

        // Simplified conversion back to HSL
        return parseColor(
          \`hsla(\${H}, \${Math.min(C * 100, 100)}%, \${L}%, \${alpha})\`,
        );
      }
    }

    if (format === "lab") {
      // Parse LAB and convert to HSL as approximation
      const labMatch = value.match(/lab\\(([^)]+)\\)/);
      if (labMatch) {
        const parts = labMatch[1].split(/[\\s\\/]+/);
        const L = parseFloat(parts[0]) || 50;
        const a = parseFloat(parts[1]) || 0;
        const b = parseFloat(parts[2]) || 0;
        const alpha = parts[3] ? parseFloat(parts[3]) : 1;

        // Simplified conversion back to HSL
        const chroma = Math.sqrt(a * a + b * b);
        const hue = (Math.atan2(b, a) * 180) / Math.PI;

        return parseColor(
          \`hsla(\${hue < 0 ? hue + 360 : hue}, \${Math.min(
            chroma,
            100,
          )}%, \${L}%, \${alpha})\`,
        );
      }
    }

    // Fallback: try to parse as any supported format
    return parseColor(value);
  } catch {
    return null;
  }
}

/**
 * Validates if a color string is valid for the given format
 */
export function isValidColorFormat(
  value: string,
  format: ColorFormat,
): boolean {
  const parsed = parseColorFromFormat(value, format);
  return parsed !== null;
}

/**
 * Gets format-specific input placeholder text
 */
export function getFormatPlaceholder(format: ColorFormat): string {
  switch (format) {
    case "hex":
      return "#3b82f6";
    case "rgb":
      return "rgb(59, 130, 246)";
    case "hsl":
      return "hsl(220, 91%, 64%)";
    case "hsv":
      return "hsv(220, 76%, 96%)";
    case "oklch":
      return "oklch(65% 0.15 230)";
    case "lab":
      return "lab(55% -10 40)";
    default:
      return "";
  }
}`;

    // Write utility files
    await fs.writeFile(join(libDir, "utils.ts"), utilsContent);
    await fs.writeFile(join(libDir, "color-utils.ts"), colorUtilsContent);
    s.stop("HextaUI initialized successfully");

    // Install required dependencies
    const packageManager = await checkDependencyManager(projectRoot);
    s.start(`Installing required dependencies with ${packageManager}...`);

    try {
      await installDependencies(config.requiredDependencies, projectRoot);
      s.stop("Dependencies installed successfully");
    } catch (error) {
      s.stop("Failed to install some dependencies");
      p.log.warn(
        `Please manually install: ${pc.yellow(
          config.requiredDependencies.join(" ")
        )}`
      );
      p.log.info(
        `Run: ${pc.cyan(
          `${packageManager} ${
            packageManager === "npm" ? "install" : "add"
          } ${config.requiredDependencies.join(" ")}`
        )}`
      );
    }

    // Create initialization marker
    await createInitMarker(projectRoot);

    // Add CSS variables injection step
    const shouldInjectCss = await p.confirm({
      message: "Add HextaUI CSS variables to your global stylesheet?",
      initialValue: true,
    });

    if (!p.isCancel(shouldInjectCss) && shouldInjectCss) {
      await injectCssVariables(projectRoot, framework);
    } else {
      p.note(
        `You can manually add the CSS variables later:\n\n${HEXTAUI_CSS_VARIABLES}`,
        "CSS Variables (Manual Setup)"
      );
    }

    // Show framework-specific setup instructions
    if (framework === "vite" || framework === "astro") {
      p.note(
        `${pc.yellow("Framework-specific setup required:")}\n\n` +
          getFrameworkSpecificInstructions(framework),
        `${config.displayName} Setup`
      );
    }

    p.note(
      `Created:\n` +
        `${pc.cyan(config.componentsPath + "/")} - Components directory\n` +
        `${pc.cyan(config.utilsPath + "/utils.ts")} - Utility functions\n` +
        `${pc.cyan(
          config.utilsPath + "/color-utils.ts"
        )} - Color utility functions\n\n` +
        `${pc.green("✓")} Base dependencies installed\n` +
        `${pc.green("✓")} CSS variables ${
          shouldInjectCss ? "added" : "skipped"
        }`,
      "Files created"
    );

    p.outro(
      pc.green('HextaUI is ready! Run "npx hextaui add" to add components.')
    );
  } catch (error) {
    s.stop("Failed to initialize HextaUI");
    p.cancel(`Error: ${error}`);
    process.exit(1);
  }
}
