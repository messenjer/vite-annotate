---
name: vite-annotate-setup
description: Set up vite-annotate in a Vite + Vue project, so the person can leave notes on their running app and hand them to a coding agent over MCP. Use when they ask to install, add or set up vite-annotate, or to connect an agent to its notes.
---

# Setting up vite-annotate

vite-annotate adds an overlay to a Vite dev server: the person clicks an element, writes a note, and
the note lands in `.vite-annotate/annotations.json` with the element's source file and line. An MCP
server hands the notes to the agent.

## 1. Look at the project

Find the Vite config (`vite.config.*`), the package manager (lockfile), whether `@vitejs/plugin-vue`
is in it, and whether `@vitejs/devtools` is installed with `devtools` set in the config.

The source locations come from `.vue` templates: in a project without Vue, notes still work, without
file and line. Nuxt is untested: say so before going on.

Done when you know the config file, the package manager and both answers.

## 2. Ask, in one message

- **Where the toggle lives**: a floating **✎ Annotate** button (`vite-annotate/vite`), or a button in
  the Vite DevTools dock (`vite-annotate/vite-devtools`). Offer the dock only when Vite DevTools is
  already set up; recommend the floating button otherwise.
- **Which agents** to connect: Claude Code, Codex, Cursor, VS Code, OpenCode, or another MCP client.

## 3. Install and register the plugin

Add `vite-annotate` as a dev dependency with the project's package manager. Then, in the Vite config:

```ts
import annotate from 'vite-annotate/vite' // or: import annotate from 'vite-annotate/vite-devtools'

export default defineConfig({
  plugins: [annotate() /* then vue-router, vue() and the rest */],
})
```

`annotate()` goes **first** in `plugins`, before any plugin that rewrites `.vue` files (vue-router's
`definePage()`, for one): it stamps each element with its line in the file as written.

Done when the plugin is the first entry of `plugins`.

## 4. Connect the agents

The MCP server is `npx vite-annotate mcp`, over stdio, started in the project root. The exact config
for each client is in `docs/mcp.md` of the package (`node_modules/vite-annotate/docs/mcp.md`). Write
the project-level config for each agent they picked, so the whole team gets it.

Done when each picked agent has its config file.

## 5. Check it end to end

Start the dev server and open the app. The first time, the dev server prints a code and a link: the
person types the code in the overlay, or opens the link (with the dock, they authorize Vite DevTools
instead). Ask them to leave one note, then call `annotate_list` and show it.

`.vite-annotate/` ignores itself in git: nothing to add to `.gitignore`.

Done when `annotate_list` returns the note they just left.
