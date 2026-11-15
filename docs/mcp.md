# Connect your coding agent

vite-annotate hands the notes to your agent over the [Model Context Protocol](https://modelcontextprotocol.io)
(MCP). The server is a command your agent starts itself:

```sh
npx vite-annotate mcp
```

It speaks MCP over stdio, reads and writes `.vite-annotate/annotations.json` in the directory it starts
in, and needs neither the dev server nor a browser: notes left yesterday are still there. Pass
`--root <dir>` when the agent starts it somewhere else than the project root.

Pick your agent below. Each config goes in the project, so everyone who clones it gets the same setup.

- [Claude Code](#claude-code)
- [Codex](#codex)
- [Cursor](#cursor)
- [VS Code (GitHub Copilot)](#vs-code-github-copilot)
- [OpenCode](#opencode)
- [Any other MCP client](#any-other-mcp-client)

## Claude Code

```sh
claude mcp add --scope project annotate -- npx vite-annotate mcp
```

This writes `.mcp.json` at the project root. To write it by hand:

```json
{
  "mcpServers": {
    "annotate": {
      "command": "npx",
      "args": ["vite-annotate", "mcp"]
    }
  }
}
```

Claude Code asks once before it starts a server from `.mcp.json`. Check with `/mcp`.

## Codex

```sh
codex mcp add annotate -- npx vite-annotate mcp
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.annotate]
command = "npx"
args = ["vite-annotate", "mcp"]
```

Codex starts the server in the directory it runs in. When you run Codex outside the project, add
`cwd = "/path/to/project"`, or `"--root", "/path/to/project"` to `args`.

## Cursor

`.cursor/mcp.json` at the project root:

```json
{
  "mcpServers": {
    "annotate": {
      "command": "npx",
      "args": ["vite-annotate", "mcp"]
    }
  }
}
```

## VS Code (GitHub Copilot)

`.vscode/mcp.json`. Note the top-level key is `servers`, not `mcpServers`:

```json
{
  "servers": {
    "annotate": {
      "type": "stdio",
      "command": "npx",
      "args": ["vite-annotate", "mcp", "--root", "${workspaceFolder}"]
    }
  }
}
```

## OpenCode

`opencode.json` at the project root:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "annotate": {
        "type": "local",
        "command": ["npx", "vite-annotate", "mcp"]
      }
    }
  }
}
```

## Any other MCP client

Any client that starts stdio servers works: the command is `npx`, the arguments `vite-annotate mcp`,
started in the project root (or with `--root <dir>`).

## Tools

| Tool               | Safety | Does                                                                                                                                                                                                                                 |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `annotate_list`    | read   | Lists notes: open ones by default, or `status: "resolved"` / `"all"`, or only those of one source `file`. Each note has its text, the page it was left on, and the clicked element's `file`, `line`, `column`, tag and visible text. |
| `annotate_resolve` | action | Marks a note resolved with a `reply` the person sees under it, on the page. Takes `id` and `reply`.                                                                                                                                  |

The server sends the agent short usage instructions when it connects: read the notes, propose the
changes, wait for the go-ahead, then resolve each note with a reply. The
[`vite-annotate` skill](../skills/vite-annotate/SKILL.md) spells the same loop out step by step.

## The file

The notes live in `.vite-annotate/annotations.json`, a JSON array. The folder ignores itself in git.
An agent without MCP can read and edit the file directly: the overlay follows the file and updates the
page when it changes.

```json
[
  {
    "id": "741910ed",
    "createdAt": "2026-11-15T21:07:00.000Z",
    "status": "open",
    "note": "Make this the primary action",
    "page": { "url": "/plans", "viewport": { "width": 1440, "height": 900 } },
    "target": {
      "file": "src/components/PlanCard.vue",
      "line": 10,
      "column": 5,
      "selector": "#app > main > section > article:nth-of-type(2) > button",
      "tag": "button",
      "text": "Choose"
    }
  }
]
```

A resolved note has `"status": "resolved"` and `"resolution": { "at": "<ISO date>", "reply": "…" }`.
