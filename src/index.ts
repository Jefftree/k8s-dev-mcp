#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { type KepMeta, buildKepIndex, filterKeps, formatKepLine, readKepREADME, readKepYAML } from "./keps.js";
import { readDoc, listDocSections } from "./docs.js";
import { searchDocs } from "./search.js";

const cfg = loadConfig();

let kepIndex: KepMeta[] = [];
let kepRepoPath = "";

try {
  const result = buildKepIndex(cfg);
  kepIndex = result.index;
  kepRepoPath = result.repoPath;
} catch (err) {
  console.error(`Warning: could not build KEP index: ${err}`);
}

const server = new McpServer({ name: "k8s-dev-mcp", version: "0.1.0" });

// --- list-keps ---
server.tool(
  "list-keps",
  "List Kubernetes Enhancement Proposals. Filter by SIG name, status, or search query.",
  {
    sig: z.string().optional().describe('Filter by SIG name, e.g. "scheduling", "api-machinery"'),
    status: z.string().optional().describe('Filter by status: "provisional", "implementable", "implemented"'),
    query: z.string().optional().describe("Search KEP titles, feature gate names, or KEP numbers"),
  },
  async ({ sig, status, query }) => {
    const filtered = filterKeps(kepIndex, sig || "", status || "", query || "");
    if (filtered.length === 0) {
      return { content: [{ type: "text", text: "No KEPs matched the filter." }] };
    }
    const lines = filtered.map(formatKepLine);
    return { content: [{ type: "text", text: `${lines.length} KEPs found:\n\n${lines.join("\n")}` }] };
  }
);

// --- read-kep ---
server.tool(
  "read-kep",
  "Read the full KEP design document (README.md) by its number.",
  { kepNumber: z.number().describe("The KEP number, e.g. 4008") },
  async ({ kepNumber }) => {
    const kep = kepIndex.find((k) => k.kepNumber === kepNumber);
    if (!kep) {
      return { content: [{ type: "text", text: `KEP ${kepNumber} not found` }], isError: true };
    }
    try {
      const content = readKepREADME(kepRepoPath, kep);
      return { content: [{ type: "text", text: content }] };
    } catch (err) {
      return { content: [{ type: "text", text: String(err) }], isError: true };
    }
  }
);

// --- read-kep-metadata ---
server.tool(
  "read-kep-metadata",
  "Read kep.yaml metadata: status, milestones, feature gates, authors.",
  { kepNumber: z.number().describe("The KEP number, e.g. 4008") },
  async ({ kepNumber }) => {
    const kep = kepIndex.find((k) => k.kepNumber === kepNumber);
    if (!kep) {
      return { content: [{ type: "text", text: `KEP ${kepNumber} not found` }], isError: true };
    }
    try {
      const content = readKepYAML(kepRepoPath, kep);
      return { content: [{ type: "text", text: content }] };
    } catch (err) {
      return { content: [{ type: "text", text: String(err) }], isError: true };
    }
  }
);

// --- list-docs ---
server.tool("list-docs", "List available Kubernetes convention and guideline documents.", {}, async () => {
  const names = Object.keys(cfg.docs).sort();
  if (names.length === 0) {
    return { content: [{ type: "text", text: "No docs configured." }] };
  }
  const lines = names.map((name) => `- ${name}: ${cfg.docs[name].description}`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// --- read-doc ---
server.tool(
  "read-doc",
  "Read a Kubernetes convention/guideline document, optionally a specific section.",
  {
    name: z.string().describe('Doc name from list-docs, e.g. "api-conventions"'),
    section: z.string().optional().describe('Optional section heading, e.g. "Validation"'),
  },
  async ({ name, section }) => {
    try {
      const content = readDoc(cfg, name, section);
      return { content: [{ type: "text", text: content }] };
    } catch (err) {
      return { content: [{ type: "text", text: String(err) }], isError: true };
    }
  }
);

// --- list-doc-sections ---
server.tool(
  "list-doc-sections",
  "List section headings in a document.",
  { name: z.string().describe('Doc name, e.g. "api-conventions"') },
  async ({ name }) => {
    try {
      const sections = listDocSections(cfg, name);
      return { content: [{ type: "text", text: sections.join("\n") }] };
    } catch (err) {
      return { content: [{ type: "text", text: String(err) }], isError: true };
    }
  }
);

// --- search-k8s-docs ---
server.tool(
  "search-k8s-docs",
  "Full-text search across all configured Kubernetes repos (enhancements, community, website).",
  {
    query: z.string().describe("Search query (regex supported)"),
    repo: z.string().optional().describe('Limit to a specific repo, e.g. "enhancements", "community", "website"'),
    maxResults: z.number().optional().describe("Maximum results (default 20)"),
  },
  async ({ query, repo, maxResults }) => {
    try {
      const results = searchDocs(cfg, query, repo || "", maxResults || 20);
      if (results.length === 0) {
        return { content: [{ type: "text", text: "No results found." }] };
      }
      const lines = results.map((r) => `${r.file}:${r.line}: ${r.text}`);
      return { content: [{ type: "text", text: `${results.length} results:\n\n${lines.join("\n")}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: String(err) }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
