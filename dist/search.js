import { execFileSync } from "node:child_process";
import { getRepoPath } from "./repos.js";
function hasRg() {
    try {
        execFileSync("rg", ["--version"], { stdio: "pipe" });
        return true;
    }
    catch {
        return false;
    }
}
const useRg = hasRg();
function runSearch(query, maxResults, repoPath) {
    if (useRg) {
        return execFileSync("rg", [
            "--line-number",
            "--no-heading",
            "--max-count",
            String(maxResults),
            "--glob",
            "*.md",
            "--glob",
            "*.yaml",
            "-i",
            query,
            repoPath,
        ], { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    }
    // Fallback to grep -r
    return execFileSync("grep", [
        "-r",
        "-n",
        "-i",
        "-m",
        String(maxResults),
        "--include=*.md",
        "--include=*.yaml",
        query,
        repoPath,
    ], { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}
export function searchDocs(cfg, query, repo, maxResults) {
    const repos = repo ? [repo] : Object.keys(cfg.repos);
    if (maxResults <= 0)
        maxResults = 20;
    const results = [];
    for (const r of repos) {
        let repoPath;
        try {
            repoPath = getRepoPath(cfg, r);
        }
        catch {
            continue;
        }
        let out;
        try {
            out = runSearch(query, maxResults, repoPath);
        }
        catch {
            continue;
        }
        for (const line of out.trim().split("\n")) {
            if (!line)
                continue;
            const parts = line.split(":");
            if (parts.length < 3)
                continue;
            const file = parts[0].replace(repoPath + "/", r + "/");
            results.push({
                file,
                line: parts[1],
                text: parts.slice(2).join(":").trim(),
            });
            if (results.length >= maxResults)
                return results;
        }
    }
    return results;
}
//# sourceMappingURL=search.js.map