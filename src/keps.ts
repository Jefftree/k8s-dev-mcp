import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { Config } from "./config.js";
import { getRepoPath } from "./repos.js";

interface FeatureGate {
  name: string;
}

export interface KepMeta {
  title: string;
  kepNumber: number;
  status: string;
  owningSig: string;
  stage: string;
  latestMilestone: string;
  featureGates: FeatureGate[];
  dir: string;
}

interface KepYaml {
  title?: string;
  "kep-number"?: number;
  status?: string;
  "owning-sig"?: string;
  stage?: string;
  "latest-milestone"?: string;
  "feature-gates"?: FeatureGate[];
}

export function buildKepIndex(cfg: Config): { index: KepMeta[]; repoPath: string } {
  const repoPath = getRepoPath(cfg, "enhancements");
  const kepsDir = join(repoPath, "keps");
  const index: KepMeta[] = [];

  for (const sigEntry of readdirSync(kepsDir, { withFileTypes: true })) {
    if (!sigEntry.isDirectory() || !sigEntry.name.startsWith("sig-")) continue;

    const sigPath = join(kepsDir, sigEntry.name);
    let kepEntries;
    try {
      kepEntries = readdirSync(sigPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const kepEntry of kepEntries) {
      if (!kepEntry.isDirectory()) continue;

      const yamlPath = join(sigPath, kepEntry.name, "kep.yaml");
      let data: string;
      try {
        data = readFileSync(yamlPath, "utf-8");
      } catch {
        continue;
      }

      let raw: KepYaml;
      try {
        raw = yaml.load(data) as KepYaml;
      } catch {
        continue;
      }

      let kepNumber = raw["kep-number"] || 0;
      if (kepNumber === 0) {
        const match = kepEntry.name.match(/^(\d+)/);
        if (match) kepNumber = parseInt(match[1], 10);
      }

      index.push({
        title: raw.title || kepEntry.name,
        kepNumber,
        status: raw.status || "",
        owningSig: raw["owning-sig"] || sigEntry.name,
        stage: raw.stage || "",
        latestMilestone: raw["latest-milestone"] || "",
        featureGates: raw["feature-gates"] || [],
        dir: join(sigEntry.name, kepEntry.name),
      });
    }
  }

  index.sort((a, b) => a.kepNumber - b.kepNumber);
  return { index, repoPath };
}

export function filterKeps(keps: KepMeta[], sig: string, status: string, query: string): KepMeta[] {
  return keps.filter((k) => {
    if (sig && !k.owningSig.includes(sig)) return false;
    if (status && k.status !== status) return false;
    if (query) {
      const q = query.toLowerCase();
      const matched =
        k.title.toLowerCase().includes(q) ||
        String(k.kepNumber).includes(q) ||
        k.featureGates.some((fg) => fg.name?.toLowerCase().includes(q));
      if (!matched) return false;
    }
    return true;
  });
}

export function formatKepLine(k: KepMeta): string {
  const ms = k.latestMilestone ? ` ${k.latestMilestone}` : "";
  return `KEP-${k.kepNumber}: ${k.title} [${k.status}] (${k.owningSig}, ${k.stage}${ms})`;
}

export function readKepREADME(repoPath: string, kep: KepMeta): string {
  const p = join(repoPath, "keps", kep.dir, "README.md");
  try {
    return readFileSync(p, "utf-8");
  } catch {
    throw new Error(`KEP ${kep.kepNumber} README.md not found`);
  }
}

export function readKepYAML(repoPath: string, kep: KepMeta): string {
  const p = join(repoPath, "keps", kep.dir, "kep.yaml");
  try {
    return readFileSync(p, "utf-8");
  } catch {
    throw new Error(`KEP ${kep.kepNumber} kep.yaml not found`);
  }
}
