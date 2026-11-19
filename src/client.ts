// Entry of the in-page overlay. Injected by `vite-annotate/vite` in dev only, or loaded by the Nuxt
// module's client plugin.

import { connectDevframe } from 'devframe/client'

import { followRevision, mountOverlay } from './client/overlay'
import { ANNOTATE_BASE } from './constants'

async function main(): Promise<void> {
  // `simpleAuth: false`: never a native prompt() over the person's app. The overlay asks for the
  // code itself, and the magic link printed by the dev server works too.
  const client = await connectDevframe({ baseURL: ANNOTATE_BASE, simpleAuth: false })
  const rpc = client.scope('annotate').rpc
  const overlay = mountOverlay(rpc)
  let listening = false

  async function connected(): Promise<void> {
    overlay.setTrust(null)
    if (listening) return
    listening = true
    await followRevision(rpc, overlay)
  }

  if (client.isTrusted) await connected()
  else {
    overlay.setTrust((code) => client.requestTrustWithCode(code))
    // Without devframe's prompt, nothing else asks the dev server to print the code. It prints a
    // code once, however many pages ask.
    await client.requestAuthCode()
  }
  // Trust can arrive later: the code typed in the overlay, or the magic link opened in another tab.
  client.events.on('rpc:is-trusted:updated', (trusted) => {
    if (trusted) void connected()
  })
}

main().catch((error) => console.warn('[vite-annotate] could not connect:', error))
