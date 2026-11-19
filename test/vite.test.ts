import type { ViteDevServer } from 'vite'

import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'

import annotate from '../src/vite'

describe('vite-annotate/vite', () => {
  let root: string | undefined
  let server: ViteDevServer | undefined

  afterEach(async () => {
    await server?.close()
    if (root) rmSync(root, { recursive: true, force: true })
  })

  async function start(base?: string): Promise<ViteDevServer> {
    root = mkdtempSync(join(tmpdir(), 'vite-annotate-'))
    server = await createServer({
      root,
      base,
      configFile: false,
      logLevel: 'silent',
      server: { port: 0 },
      plugins: [annotate({ auth: false })],
    })
    await server.listen()
    return server
  }

  // The stamp writes paths relative to Vite's root: the notes must live there too, not in the working directory.
  it("keeps the notes at Vite's root when it is not the working directory", async () => {
    await start()
    await expect.poll(() => existsSync(join(root!, '.vite-annotate'))).toBe(true)
  })

  it('serves no MCP route: agents use `vite-annotate mcp`', async () => {
    const [url] = (await start()).resolvedUrls!.local
    const response = await fetch(new URL('__annotate/__mcp', url), { method: 'POST' })
    expect(response.status).toBe(404)
  })
  it("loads the overlay under Vite's base", async () => {
    const html = await (await start('/app/')).transformIndexHtml('/', '<html><body></body></html>')
    expect(html).toContain('src="/app/@id/virtual:vite-annotate/client"')
  })
})
