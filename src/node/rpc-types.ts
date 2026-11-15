import type * as v from 'valibot'

import type { AddSchema, IdSchema, UpdateSchema } from './schemas'
import type { AnnotateState, Annotation } from './types'

// Types the `annotate:*` RPC functions (rpc.ts) and shared state for every caller, the browser included.
declare module 'devframe' {
  interface DevframeRpcServerFunctions {
    'annotate:list': () => Annotation[]
    'annotate:add': (input: v.InferInput<typeof AddSchema>) => Annotation
    'annotate:update': (input: v.InferInput<typeof UpdateSchema>) => Annotation
    'annotate:remove': (input: v.InferInput<typeof IdSchema>) => void
  }
  interface DevframeRpcSharedStates {
    'annotate:state': AnnotateState
  }
}
