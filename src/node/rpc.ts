import type { DevframeNodeContext } from 'devframe'

import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'

import type { AnnotationStore } from './store'

import { AddSchema, IdSchema, UpdateSchema } from './schemas'

/** The `annotate:*` functions the in-page overlay calls. Agents get their own tools (agent.ts), not these. */
export function registerRpc(ctx: DevframeNodeContext, store: AnnotationStore): void {
  const rpc = ctx.scope('annotate').rpc

  rpc.register(
    defineRpcFunction({
      name: 'list',
      type: 'query',
      jsonSerializable: true,
      handler: () => store.all(),
    }),
  )
  rpc.register(
    defineRpcFunction({
      name: 'add',
      type: 'action',
      jsonSerializable: true,
      handler: (input: v.InferInput<typeof AddSchema>) => store.add(v.parse(AddSchema, input)),
    }),
  )
  rpc.register(
    defineRpcFunction({
      name: 'update',
      type: 'action',
      jsonSerializable: true,
      handler: (input: v.InferInput<typeof UpdateSchema>) => {
        const { id, note } = v.parse(UpdateSchema, input)
        return store.update(id, { note })
      },
    }),
  )
  rpc.register(
    defineRpcFunction({
      name: 'remove',
      type: 'action',
      jsonSerializable: true,
      handler: (input: v.InferInput<typeof IdSchema>) => {
        store.remove(v.parse(IdSchema, input).id)
      },
    }),
  )
}
