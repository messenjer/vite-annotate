// The dock's client script: runs once in the page when the Annotate toggle is first used, then
// follows the toggle. The connection is Vite DevTools' own, already trusted: no code to type.

import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'

import { followRevision, mountOverlay } from './client/overlay'
import { DOCK_ID } from './constants'

export default function setup(ctx: DockClientScriptContext): void {
  const rpc = ctx.rpc.scope('annotate').rpc
  const overlay = mountOverlay(rpc, {
    toggle: false,
    // Esc, the ✕ or Alt+A also turn the dock button off and on.
    onActiveChange: (active) => void ctx.docks.setActionActive(DOCK_ID, active),
  })

  ctx.current.events.on('entry:activated', () => overlay.setActive(true))
  ctx.current.events.on('entry:deactivated', () => overlay.setActive(false))
  if (ctx.current.isActive) overlay.setActive(true)

  // The agent resolves notes from its own MCP process: follow the file.
  void followRevision(rpc, overlay)
}
