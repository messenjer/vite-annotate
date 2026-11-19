import { defineConfig } from 'tsdown'

// `exports` in package.json is written by hand: the CLI is a `bin`, not an import path, and the
// overlay comes from a second, browser build.
export default defineConfig([
  {
    entry: ['src/devframe.ts', 'src/vite.ts', 'src/vite-devtools.ts', 'src/nuxt.ts', 'src/cli.ts'],
    platform: 'node',
    dts: true,
    publint: true,
  },
  {
    // The overlay runs in the page: built for the browser, loaded by the Vite plugin or the dock.
    entry: ['src/client.ts', 'src/devtools-action.ts'],
    platform: 'browser',
    target: 'es2022',
    fixedExtension: true,
    dts: false,
    clean: false,
  },
])
