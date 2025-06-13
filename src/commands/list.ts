import * as p from "@clack/prompts";
import pc from "picocolors";
import { COMPONENTS } from "../config/components.js";

export async function listComponents() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(" HextaUI Components ")));

  // Group components by type
  const fileComponents = COMPONENTS.filter((c) =>
    c.files.some((f) => f.type === "file")
  );
  const folderComponents = COMPONENTS.filter((c) =>
    c.files.some((f) => f.type === "folder")
  );

  const simpleComponents = fileComponents
    .map(
      (c) => `${pc.green("●")} ${pc.cyan(c.name.padEnd(15))} ${c.description}`
    )
    .join("\n");

  const complexComponents = folderComponents
    .map(
      (c) => `${pc.blue("●")} ${pc.cyan(c.name.padEnd(15))} ${c.description}`
    )
    .join("\n");

  p.note(
    `${pc.bold("Simple Components:")}\n${simpleComponents}\n\n` +
      `${pc.bold("Complex Components:")}\n${complexComponents}\n\n` +
      `${pc.dim("Total:")} ${COMPONENTS.length} components available`,
    "Available Components"
  );

  p.log.info(
    `Run ${pc.cyan("npx hextaui add")} to select components interactively`
  );
  p.log.info(
    `Or run ${pc.cyan(
      "npx hextaui add Button Card"
    )} to install specific components`
  );
  p.log.info(
    `Dependencies: Choose between ${pc.cyan(
      "manual"
    )} (copy to clipboard) or ${pc.cyan("automatic")} installation`
  );
}
