import type { DevframeDefinition } from 'devframe'

import { defineDevframe } from 'devframe'

import type { AnnotateState } from './node/types'

import { description, homepage, name, version } from '../package.json' with { type: 'json' }
import { registerAgentTools } from './node/agent'
import { registerRpc } from './node/rpc'
import { createStore } from './node/store'

export type * from './node/types'

export interface AnnotateDevframeOptions {
  /** Project root, where `.vite-annotate/` lives. Default: the host's working directory. */
  root?: string
}

/**
 * The annotations as a devframe: RPC for the in-page overlay, MCP tools for agents, and a shared
 * revision that tells every page when the file changed. The same definition runs in a Vite dev
 * server (`vite-annotate/vite`), in a hub, or as `vite-annotate mcp` over stdio.
 */
export function createAnnotateDevframe(options: AnnotateDevframeOptions = {}): DevframeDefinition {
  return defineDevframe({
    id: 'annotate',
    name: 'Annotate',
    version,
    packageName: name,
    homepage,
    description,
    icon: 'ph:chat-circle-dots-duotone',
    importMetaUrl: import.meta.url,
    async setup(ctx) {
      const store = createStore(options.root ?? ctx.cwd)
      registerRpc(ctx, store)
      registerAgentTools(ctx, store)
      if (ctx.mode !== 'dev') return

      // The MCP process and the dev server are two processes on one file: the overlay follows the file.
      const state = await ctx.scope('annotate').rpc.sharedState('state', {
        initialValue: { revision: 0 } satisfies AnnotateState,
      })
      store.watch(() =>
        state.mutate((draft) => {
          draft.revision += 1
        }),
      )
    },
  })
}

export default createAnnotateDevframe()
