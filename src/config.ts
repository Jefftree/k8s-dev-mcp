import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export interface RepoConfig {
  url: string;
  sparse?: string[];
}

export interface DocConfig {
  repo: string;
  path: string;
  description: string;
}

export interface Config {
  repos: Record<string, RepoConfig>;
  docs: Record<string, DocConfig>;
}

export function loadConfig(): Config {
  let data: string;

  const override = process.env.K8S_CONTEXT_CONFIG;
  if (override) {
    data = readFileSync(override, "utf-8");
  } else {
    // config.yaml is at package root, two levels up from dist/
    const thisDir = dirname(fileURLToPath(import.meta.url));
    data = readFileSync(join(thisDir, "..", "config.yaml"), "utf-8");
  }

  return yaml.load(data) as Config;
}
