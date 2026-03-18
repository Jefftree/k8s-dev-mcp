import { existsSync, statSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import type { Config } from "./config.js";

function cacheDir(): string {
  return process.env.K8S_CONTEXT_CACHE || join(homedir(), ".cache", "k8s-dev-mcp");
}

function ensureRepo(cfg: Config, name: string): string {
  const repo = cfg.repos[name];
  if (!repo) throw new Error(`unknown repo: ${name}`);

  const dir = join(cacheDir(), name);
  const gitDir = join(dir, ".git");

  if (!existsSync(gitDir)) {
    // Remove leftover dir from a previously failed clone
    if (existsSync(dir)) {
      execFileSync("rm", ["-rf", dir], { stdio: "pipe" });
    }
    mkdirSync(dir, { recursive: true });
    execFileSync("git", ["clone", "--depth", "1", "--sparse", repo.url, dir], {
      stdio: "pipe",
    });
    if (repo.sparse && repo.sparse.length > 0) {
      execFileSync("git", ["sparse-checkout", "set", ...repo.sparse], {
        cwd: dir,
        stdio: "pipe",
      });
    }
  } else {
    // Refresh if last fetch was more than 24 hours ago
    const fetchHead = join(gitDir, "FETCH_HEAD");
    const mtime = existsSync(fetchHead) ? statSync(fetchHead).mtimeMs : 0;
    if (Date.now() - mtime > 24 * 60 * 60 * 1000) {
      try {
        execFileSync("git", ["pull", "--depth", "1"], { cwd: dir, stdio: "pipe" });
      } catch {
        // non-fatal
      }
    }
  }

  return dir;
}

const resolvedPaths = new Map<string, string>();

export function getRepoPath(cfg: Config, name: string): string {
  const cached = resolvedPaths.get(name);
  if (cached) return cached;

  const resolved = ensureRepo(cfg, name);
  resolvedPaths.set(name, resolved);
  return resolved;
}
