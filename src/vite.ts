import type { Plugin } from 'vite'

import { devframeViteBridge } from '@devframes/vite/single'

import type { AnnotateDevframeOptions } from './devframe'

import { ANNOTATE_BASE } from './constants'
import { createAnnotateDevframe } from './devframe'
import { browserEntry } from './node/entry'
import { vueSourcePlugin } from './node/vue-source'

export { ANNOTATE_BASE }

export interface AnnotateOptions extends AnnotateDevframeOptions {
  /**
   * Stamp `.vue` templates with their file and line, so a note knows where the clicked element is
   * written. Default: true.
   */
  vueSource?: boolean
  /**
   * The devframe's own auth gate (one-time code printed in the terminal). Default: devframe's,
   * gated. `false` leaves only the loopback origin check, for a single-user machine.
   */
  auth?: boolean
}

const CLIENT_ID = 'virtual:vite-annotate/client'

/**
 * Annotate a Vite app from the browser: an overlay to click an element and leave a note, the
 * devframe behind it, and the `.vue` source stamps. Dev server only: nothing reaches `vite build`.
 *
 * Put it **before** plugins that rewrite `.vue` files (vue-router's `definePage()`, for one), so
 * the stamped lines are the lines of the file.
 */
export default function annotate(options: AnnotateOptions = {}): Plugin[] {
  // The bridge starts devframe in `process.cwd()`. Read lazily by the devframe's setup, once the
  // dev server starts: the notes then live at Vite's root, the root the stamp's paths start from.
  const devframeOptions: AnnotateDevframeOptions = { root: options.root }
  return [
    ...(options.vueSource === false ? [] : [vueSourcePlugin(options.root)]),
    {
      name: 'vite-annotate:client',
      apply: 'serve',
      configResolved(config) {
        devframeOptions.root ??= config.root
      },
      resolveId: (id) => (id === CLIENT_ID ? browserEntry('client') : undefined),
      transformIndexHtml: () => [
        {
          tag: 'script',
          attrs: { type: 'module', src: `/@id/${CLIENT_ID}` },
          injectTo: 'body',
        },
      ],
    },
    devframeViteBridge(createAnnotateDevframe(devframeOptions), {
      base: ANNOTATE_BASE,
      auth: options.auth,
      // Agents get the notes from `vite-annotate mcp`, over stdio. devframe's HTTP route would answer
      // without the code the browser needs.
      mcp: false,
    }),
  ]
}
