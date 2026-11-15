import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import * as v from 'valibot'

import type { Annotation } from './types'

import { AnnotationListSchema } from './schemas'

/** Annotations live in one file at the project root, so the browser, the dev server and the MCP process share them. */
export const STORE_PATH = '.vite-annotate/annotations.json'

export interface AnnotationStore {
  all: () => Annotation[]
  add: (input: Omit<Annotation, 'id' | 'createdAt' | 'status'>) => Annotation
  update: (id: string, patch: Partial<Pick<Annotation, 'note' | 'status' | 'resolution'>>) => Annotation
  remove: (id: string) => void
  /** Calls `listener` when another process (the MCP server, an editor) changes the file. Returns a stop function. */
  watch: (listener: () => void) => () => void
}

export function createStore(root: string): AnnotationStore {
  const file = join(root, STORE_PATH)

  function all(): Annotation[] {
    if (!existsSync(file)) return []
    // Agents may edit the file by hand: a malformed one is refused, never half-read and overwritten.
    const result = v.safeParse(AnnotationListSchema, JSON.parse(readFileSync(file, 'utf8')))
    if (!result.success) throw new Error(`${STORE_PATH} is not a valid list of notes: ${v.summarize(result.issues)}`)
    return result.output
  }

  function save(annotations: Annotation[]): void {
    mkdirSync(dirname(file), { recursive: true })
    // The folder ignores itself: notes are local, never committed by accident.
    const ignore = join(dirname(file), '.gitignore')
    if (!existsSync(ignore)) writeFileSync(ignore, '*\n')
    writeFileSync(file, `${JSON.stringify(annotations, null, 2)}\n`)
  }

  return {
    all,
    add(input) {
      const annotation: Annotation = {
        id: randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
        status: 'open',
        ...input,
      }
      save([...all(), annotation])
      return annotation
    },
    update(id, patch) {
      const annotations = all()
      const updated: Annotation = { ...find(annotations, id), ...patch }
      save(annotations.map((a) => (a.id === id ? updated : a)))
      return updated
    },
    remove(id) {
      const annotations = all()
      find(annotations, id)
      save(annotations.filter((a) => a.id !== id))
    },
    watch(listener) {
      mkdirSync(dirname(file), { recursive: true })
      // Watch the folder, not the file: the file may not exist yet, and some writers replace it.
      // One write fires several events: report them once, when they settle.
      let timer: ReturnType<typeof setTimeout> | undefined
      const watcher = watch(dirname(file), (_event, name) => {
        if (name !== basename(file)) return
        clearTimeout(timer)
        timer = setTimeout(listener, 30)
      })
      return () => {
        clearTimeout(timer)
        watcher.close()
      }
    },
  }
}

function find(annotations: Annotation[], id: string): Annotation {
  const annotation = annotations.find((a) => a.id === id)
  if (!annotation) throw new Error(`No annotation with id "${id}"`)
  return annotation
}
