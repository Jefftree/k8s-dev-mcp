import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
export function loadConfig() {
    let data;
    const override = process.env.K8S_CONTEXT_CONFIG;
    if (override) {
        data = readFileSync(override, "utf-8");
    }
    else {
        // config.yaml is at package root, two levels up from dist/
        const thisDir = dirname(fileURLToPath(import.meta.url));
        data = readFileSync(join(thisDir, "..", "config.yaml"), "utf-8");
    }
    return yaml.load(data);
}
//# sourceMappingURL=config.js.map