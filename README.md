# k8s-dev-mcp

An MCP server that gives AI assistants access to Kubernetes enhancement proposals (KEPs), contributor guidelines, and official documentation.

## What it does

Provides 7 tools over the [Model Context Protocol](https://modelcontextprotocol.io):

| Tool | Description |
|------|-------------|
| `list-keps` | List and filter KEPs by SIG, status, or search query |
| `read-kep` | Read a full KEP design document by number |
| `read-kep-metadata` | Read KEP metadata (status, milestones, feature gates) |
| `list-docs` | List available convention/guideline documents |
| `read-doc` | Read a document, optionally a specific section |
| `list-doc-sections` | List section headings in a document |
| `search-k8s-docs` | Full-text search across all repos |

Documents are sourced from three Kubernetes repos using sparse git checkouts:
- **kubernetes/enhancements** — KEPs
- **kubernetes/community** — contributor guidelines (API conventions, controller patterns, etc.)
- **kubernetes/website** — official docs (API concepts, CRDs, server-side apply, etc.)

## Requirements

- Node.js 18+
- Git
- [ripgrep](https://github.com/BurntSushi/ripgrep) (`rg`) — optional, falls back to `grep` for full-text search

## Install

### Claude Code

```bash
claude mcp add k8s-dev-mcp npx github:Jefftree/k8s-dev-mcp
```

### Gemini CLI

```bash
gemini mcp add k8s-dev-mcp npx github:Jefftree/k8s-dev-mcp
```

### Manual

Add to your MCP client config:

```json
{
  "mcpServers": {
    "k8s-dev-mcp": {
      "command": "npx",
      "args": ["github:Jefftree/k8s-dev-mcp"]
    }
  }
}
```

## Configuration

Repos and documents are defined in the bundled `config.yaml`. Override it by setting:

```bash
export K8S_CONTEXT_CONFIG=/path/to/custom/config.yaml
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `K8S_CONTEXT_CONFIG` | Path to a custom config.yaml |
| `K8S_CONTEXT_CACHE` | Cache directory for cloned repos (default: `~/.cache/k8s-dev-mcp`) |

## Development

```bash
npm install
npm run build
npm start
```

## License

Apache 2.0
