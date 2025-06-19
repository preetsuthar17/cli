import { FrameworkType } from "../utils/project.js";

export interface FrameworkConfig {
  name: string;
  displayName: string;
  componentsPath: string;
  utilsPath: string;
  globalCssPath: string[];
  requiredDependencies: string[];
  requiredDevDependencies: string[];
  tsConfigUpdates?: Record<string, any>;
  viteConfigUpdates?: string;
  astroConfigUpdates?: string;
}

export const FRAMEWORK_CONFIGS: Record<FrameworkType, FrameworkConfig> = {
  nextjs: {
    name: "nextjs",
    displayName: "Next.js",
    componentsPath: "src/components/ui",
    utilsPath: "src/lib",
    globalCssPath: [
      "src/app/globals.css",
      "app/globals.css",
      "src/styles/globals.css",
      "styles/globals.css",
    ],
    requiredDependencies: ["clsx", "tailwind-merge"],
    requiredDevDependencies: [],
  },
  vite: {
    name: "vite",
    displayName: "Vite + React",
    componentsPath: "src/components/ui",
    utilsPath: "src/lib",
    globalCssPath: [
      "src/index.css",
      "src/App.css",
      "src/main.css",
      "src/styles/index.css",
    ],
    requiredDependencies: ["clsx", "tailwind-merge"],
    requiredDevDependencies: [],
    tsConfigUpdates: {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
        },
      },
    },
    viteConfigUpdates: `
// Add this to your vite.config.js/ts resolve.alias section:
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},`,
  },
  astro: {
    name: "astro",
    displayName: "Astro",
    componentsPath: "src/components/ui",
    utilsPath: "src/lib",
    globalCssPath: [
      "src/styles/global.css",
      "src/styles/globals.css",
      "src/global.css",
    ],
    requiredDependencies: ["clsx", "tailwind-merge"],
    requiredDevDependencies: ["@astrojs/react", "@astrojs/tailwind"],
    tsConfigUpdates: {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
        },
      },
    },
    astroConfigUpdates: `
// Add this to your astro.config.js/ts:
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // Let HextaUI handle base styles
    }),
  ],
});`,
  },
  unknown: {
    name: "unknown",
    displayName: "Unknown Framework",
    componentsPath: "src/components/ui",
    utilsPath: "src/lib",
    globalCssPath: ["src/index.css", "src/styles/index.css", "src/global.css"],
    requiredDependencies: ["clsx", "tailwind-merge"],
    requiredDevDependencies: [],
  },
};

export function getFrameworkConfig(framework: FrameworkType): FrameworkConfig {
  return FRAMEWORK_CONFIGS[framework];
}

export function getComponentsDir(
  framework: FrameworkType,
  projectRoot: string
): string {
  const config = getFrameworkConfig(framework);
  return `${projectRoot}/${config.componentsPath}`;
}

export function getUtilsDir(
  framework: FrameworkType,
  projectRoot: string
): string {
  const config = getFrameworkConfig(framework);
  return `${projectRoot}/${config.utilsPath}`;
}

export async function findGlobalCssFile(
  framework: FrameworkType,
  projectRoot: string
): Promise<string | null> {
  const config = getFrameworkConfig(framework);
  const fs = await import("fs-extra");

  for (const cssPath of config.globalCssPath) {
    const fullPath = `${projectRoot}/${cssPath}`;
    if (await fs.pathExists(fullPath)) {
      return fullPath;
    }
  }

  return null;
}
