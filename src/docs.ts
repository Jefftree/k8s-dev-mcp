import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "./config.js";
import { getRepoPath } from "./repos.js";

export function readDoc(cfg: Config, name: string, section?: string): string {
  const doc = cfg.docs[name];
  if (!doc) {
    const available = Object.keys(cfg.docs).join(", ");
    throw new Error(`doc "${name}" not found, available: ${available}`);
  }

  const repoPath = getRepoPath(cfg, doc.repo);
  const content = readFileSync(join(repoPath, doc.path), "utf-8");

  if (!section) return content;
  return extractSection(content, section);
}

export function listDocSections(cfg: Config, name: string): string[] {
  const content = readDoc(cfg, name);
  const sections: string[] = [];

  for (const line of content.split("\n")) {
    if (line.startsWith("#")) {
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx > 0) {
        const level = spaceIdx - 1;
        const indent = "  ".repeat(level);
        sections.push(indent + line.slice(spaceIdx + 1));
      }
    }
  }

  return sections;
}

function extractSection(content: string, section: string): string {
  const lines = content.split("\n");
  const sectionLower = section.toLowerCase();
  let capturing = false;
  let captureLevel = 0;
  const result: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#")) {
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx > 0) {
        const level = spaceIdx;
        const title = line.slice(spaceIdx + 1).toLowerCase();

        if (capturing && level <= captureLevel) break;
        if (title.includes(sectionLower)) {
          capturing = true;
          captureLevel = level;
        }
      }
    }
    if (capturing) result.push(line);
  }

  if (result.length === 0) {
    return `Section "${section}" not found. Try listing sections first.`;
  }
  return result.join("\n");
}
