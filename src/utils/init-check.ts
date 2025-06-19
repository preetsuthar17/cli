import fs from "fs-extra";
import { join } from "path";
import { FrameworkType } from "./project.js";
import {
  getFrameworkConfig,
  getComponentsDir,
  getUtilsDir,
} from "../config/frameworks.js";

/**
 * Check if HextaUI has been initialized in the project
 */
export async function isHextaUIInitialized(
  projectRoot: string
): Promise<boolean> {
  // Check for marker file first (new approach)
  const markerFile = join(projectRoot, ".hextaui");
  if (await fs.pathExists(markerFile)) {
    return true;
  }

  // Fallback: check for utils file (legacy approach)
  const utilsFile = join(projectRoot, "src", "lib", "utils.ts");
  return await fs.pathExists(utilsFile);
}

/**
 * Create a marker file to indicate HextaUI initialization
 */
export async function createInitMarker(projectRoot: string): Promise<void> {
  const markerFile = join(projectRoot, ".hextaui");
  const markerContent = {
    initialized: true,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };

  await fs.writeFile(markerFile, JSON.stringify(markerContent, null, 2));
}

/**
 * Check if the marker file exists
 */
export async function hasInitMarker(projectRoot: string): Promise<boolean> {
  const markerFile = join(projectRoot, ".hextaui");
  return await fs.pathExists(markerFile);
}
