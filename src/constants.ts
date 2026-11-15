// Names both sides must agree on, the dev server and the page. No imports: the browser build reads it too.

/** The attribute every stamped element carries: `src/App.vue:12:5`. A wire contract. */
export const SOURCE_ATTR = 'data-annotate-src'

/** Where the RPC socket, discovery and MCP route are served, on the app's own dev server. */
export const ANNOTATE_BASE = '/__annotate/'

/** The Vite DevTools dock button: an on/off tool, like an element picker. */
export const DOCK_ID = 'annotate:pick'
