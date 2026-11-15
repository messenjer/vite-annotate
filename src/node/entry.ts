import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** A browser script by absolute path: built next to the plugin (`<name>.mjs`), or its source when run from the repo. */
export function browserEntry(name: string): string {
  const built = fileURLToPath(new URL(`./${name}.mjs`, import.meta.url))
  return existsSync(built) ? built : fileURLToPath(new URL(`../${name}.ts`, import.meta.url))
}
