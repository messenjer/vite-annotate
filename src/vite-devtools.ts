import type { Plugin } from 'vite'

import { createPluginFromDevframe } from '@vitejs/devtools-kit/node'

import type { AnnotateDevframeOptions } from './devframe'

import { DOCK_ID } from './constants'
import { createAnnotateDevframe } from './devframe'
import { browserEntry } from './node/entry'
import { vueSourcePlugin } from './node/vue-source'

export { DOCK_ID }

export interface AnnotateDevtoolsOptions extends AnnotateDevframeOptions {
  /** Stamp `.vue` templates with their file and line. Default: true. */
  vueSource?: boolean
}

/**
 * vite-annotate inside Vite DevTools (and Nuxt DevTools, which runs on it): a toggle in the dock
 * turns annotate mode on, and the notes ride the DevTools connection, already trusted. Use it
 * instead of `vite-annotate/vite`, not with it. Needs `@vitejs/devtools` and `devtools: true` (or
 * `{ apply: 'serve' }`) in the Vite config.
 */
export default function annotateDevtools(options: AnnotateDevtoolsOptions = {}): Plugin[] {
  return [
    ...(options.vueSource === false ? [] : [vueSourcePlugin(options.root)]),
    {
      ...createPluginFromDevframe(createAnnotateDevframe(options), {
        name: 'vite-annotate:devtools',
        // The UI is the in-page overlay, not a panel: hide the iframe entry the kit derives.
        dock: { when: 'false' },
        setup(ctx) {
          ctx.docks.register({
            id: DOCK_ID,
            title: 'Annotate',
            icon: 'ph:chat-circle-dots-duotone',
            type: 'action',
            toggle: true,
            action: { importFrom: browserEntry('devtools-action') },
          })
        },
      }),
      // The kit's plugin has no `apply`: Vite DevTools runs it in dev only, but nothing reaches a build.
      apply: 'serve',
    },
  ]
}
