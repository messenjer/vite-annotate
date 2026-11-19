import type { NuxtModule } from '@nuxt/schema'

import { addPluginTemplate, addVitePlugin, defineNuxtModule } from '@nuxt/kit'

import type { AnnotateOptions } from './vite'

import annotate, { CLIENT_ID } from './vite'

export type { AnnotateOptions }

/**
 * vite-annotate for Nuxt: `modules: ['vite-annotate/nuxt']`, options under `annotate`. Dev only.
 *
 * Nuxt has no `index.html` to inject the overlay into, so a client plugin loads it. Its Vite root is
 * `app/`: the notes and the stamp's paths start from the project root instead, where the agent runs
 * `vite-annotate mcp`.
 */
const module: NuxtModule<AnnotateOptions> = defineNuxtModule<AnnotateOptions>({
  meta: { name: 'vite-annotate', configKey: 'annotate' },
  setup(options, nuxt) {
    if (!nuxt.options.dev) return
    // First, like in a Vite config: the stamp reads `.vue` files before any plugin rewrites them.
    addVitePlugin(annotate({ root: nuxt.options.rootDir, ...options }), { prepend: true })
    addPluginTemplate({
      filename: 'vite-annotate.client.mjs',
      mode: 'client',
      getContents: () =>
        [
          `import '${CLIENT_ID}'`,
          `import { defineNuxtPlugin } from '#app/nuxt'`,
          `export default defineNuxtPlugin({ name: 'vite-annotate' })`,
        ].join('\n'),
    })
  },
})

export default module
