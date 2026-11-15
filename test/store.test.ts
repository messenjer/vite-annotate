import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createStore, STORE_PATH } from '../src/node/store'

const page = {
  url: '/plans',
  viewport: { width: 1440, height: 900 },
}

describe('createStore', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vite-annotate-'))
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('starts empty, without creating anything', () => {
    expect(createStore(root).all()).toEqual([])
  })

  it('adds, edits, resolves and removes notes in one file', () => {
    const store = createStore(root)
    const note = store.add({ note: 'Bigger', page })

    expect(note).toMatchObject({ status: 'open', note: 'Bigger', page })
    expect(store.update(note.id, { note: 'Much bigger' }).note).toBe('Much bigger')
    expect(
      store.update(note.id, {
        status: 'resolved',
        resolution: { at: 'now', reply: 'Done' },
      }).status,
    ).toBe('resolved')
    expect(JSON.parse(readFileSync(join(root, STORE_PATH), 'utf8'))).toHaveLength(1)

    store.remove(note.id)
    expect(store.all()).toEqual([])
  })

  it('ignores its own folder in git', () => {
    createStore(root).add({ note: 'A', page })

    expect(readFileSync(join(root, '.vite-annotate/.gitignore'), 'utf8')).toBe('*\n')
  })

  it('refuses an unknown id', () => {
    expect(() => createStore(root).update('nope', { note: 'A' })).toThrow('No annotation with id "nope"')
  })

  it('refuses a malformed file instead of overwriting it', () => {
    const store = createStore(root)
    store.add({ note: 'A', page })
    writeFileSync(join(root, STORE_PATH), JSON.stringify([{ id: 'x', note: 42 }]))

    expect(() => store.all()).toThrow('is not a valid list of notes')
  })

  it('reads what another process wrote', () => {
    const store = createStore(root)
    store.add({ note: 'A', page })
    const [note] = store.all()
    writeFileSync(join(root, STORE_PATH), JSON.stringify([{ ...note, status: 'resolved' }]))

    expect(store.all().find((a) => a.id === note!.id)?.status).toBe('resolved')
  })
})
