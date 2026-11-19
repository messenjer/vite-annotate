# vite-annotate maintainer guide

vite-annotate lets a person leave notes on elements of their running Vite app, and hands the notes to
a coding agent over MCP. One [devframe](https://devfra.me) definition serves the page (RPC through the
Vite dev server, or through the Vite DevTools hub) and the agent (MCP over stdio), on one file:
`.vite-annotate/annotations.json`. It is a proof of concept: `README.md` says what works.

## Rules

**MUST**, **MUST NOT** and **SHOULD** use their RFC 2119 meanings: they mark real invariants, not
house style.

- Before a commit, `pnpm check` MUST pass. Commits follow Conventional Commits.
- Nothing reaches a production build. Every Vite plugin is `apply: 'serve'`, and the overlay is loaded
  only by the dev server or the dock.
- These are **wire contracts**, read by other processes and by agents: the annotation record
  (`src/node/types.ts`), the `annotate:*` RPC names, the MCP tool names and input schemas
  (`src/node/agent.ts`, `src/node/schemas.ts`), and the `data-annotate-src` attribute format. A change
  to one MUST update `docs/mcp.md` and the skills in `skills/`, and is a breaking change.
- A note is written by a person and read by an agent: tool descriptions present it as a request to
  discuss, and the overlay inserts note and reply text with `textContent`, never as HTML.
- The source stamp runs `enforce: 'pre'` on the raw `.vue` file, so its lines are the lines of the file
  whatever later plugins cut out (vue-router's `definePage()`). Keep it there; `test/vue-source.test.ts`
  holds the cases.
- The overlay is framework-free and lives in one shadow root. It MUST keep working on top of the app's
  modals: its pointer events stop at `window` on the way down, before the app's capture listeners
  (its buttons' actions run from there), its key and focus events stop at the host, focus moving
  into it is hidden from focus traps, and the host moves into the topmost modal `<dialog>` while one
  is open. The playground's modal listens on the way down, like VueUse's `onClickOutside`.

## Layout

| Path                                      | Holds                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/devframe.ts`                         | The devframe definition: wires the store, RPC, agent tools and the shared `revision`.        |
| `src/node/`                               | Node side: the store, RPC for the page, MCP tools, schemas, the `.vue` source stamp.         |
| `src/vite.ts`                             | `vite-annotate/vite`: stamp, devframe bridge on the dev server, overlay injection.           |
| `src/vite-devtools.ts`                    | `vite-annotate/vite-devtools`: the same inside the Vite DevTools hub, with a dock toggle.    |
| `src/nuxt.ts`                             | `vite-annotate/nuxt`: the Vite plugin from the project root, the overlay as a client plugin. |
| `src/constants.ts`                        | Names the dev server and the page share: the source attribute, the base, the dock id.        |
| `src/client.ts`, `src/devtools-action.ts` | Browser entries of the two modes; both mount `src/client/overlay.ts`.                        |
| `src/cli.ts`                              | `vite-annotate mcp`, the stdio MCP server.                                                   |
| `skills/`                                 | Skills shipped in the package, for agents of projects that use vite-annotate.                |
| `docs/mcp.md`                             | Client configs and the tool reference, shipped in the package.                               |
| `playground/`                             | A Vue app with the plugin from `src/`: `pnpm play`, `pnpm play:devtools`.                    |

devframe's and the Vite DevTools kit's own skills are linked into `.claude/skills/` by pnpm on install:
read them before changing how the devframe is defined, mounted or exposed.
