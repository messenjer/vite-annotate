#!/usr/bin/env node
import { cac } from 'cac'
import { createMcpServer } from 'devframe/adapters/mcp'
import process from 'node:process'

import { version } from '../package.json' with { type: 'json' }
import { createAnnotateDevframe } from './devframe'

const cli = cac('vite-annotate')

cli
  .command('mcp', 'Serve the notes to a coding agent over MCP (stdio)')
  .option('--root <dir>', 'Project root, where .vite-annotate/ lives (default: the current directory)')
  .action(async (options: { root?: string }) => {
    // stdout is the MCP transport: anything else goes to stderr.
    await createMcpServer(createAnnotateDevframe({ root: options.root ?? process.cwd() }), {
      transport: 'stdio',
      instructions:
        'Notes left by the person on their running app. Read them with annotate_list, propose what you will change, wait for their go-ahead, make the changes, then annotate_resolve each one with a short reply.',
    })
  })

cli.help()
cli.version(version)
cli.parse()
