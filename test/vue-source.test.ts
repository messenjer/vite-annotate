import { describe, expect, it } from 'vitest'

import { stampVueSource } from '../src/node/vue-source'

const FILE = 'src/components/PlanCard.vue'

async function stamp(code: string): Promise<string | undefined> {
  return (await stampVueSource(code, FILE))?.code
}

/** Every `data-annotate-src` value in `code`, in order. */
function stamps(code: string | undefined): string[] {
  return [...(code ?? '').matchAll(/data-annotate-src="([^"]+)"/g)].map((m) => m[1]!)
}

describe('stampVueSource', () => {
  it('stamps each element and component with its file, line and column', async () => {
    const code = [
      '<script setup lang="ts">',
      "import Card from './Card.vue'",
      '</script>',
      '',
      '<template>',
      '  <main class="page">',
      '    <h1>Plans</h1>',
      '    <Card v-for="plan in plans" :key="plan.id" />',
      '  </main>',
      '</template>',
    ].join('\n')

    expect(stamps(await stamp(code))).toEqual([`${FILE}:6:3`, `${FILE}:7:5`, `${FILE}:8:5`])
  })

  it('counts lines in the file as written, script included', async () => {
    // A router plugin may cut `definePage()` out later: the stamp is taken before, on the raw file.
    const code = [
      '<script setup lang="ts">',
      'definePage({',
      "  meta: { title: 'Plans' },",
      '})',
      '</script>',
      '<template>',
      '  <button type="button">Choose</button>',
      '</template>',
    ].join('\n')

    expect(stamps(await stamp(code))).toEqual([`${FILE}:7:3`])
  })

  it('keeps self-closing tags and existing attributes valid', async () => {
    const out = await stamp('<template><img src="/a.png" alt="A"/><br></template>')

    expect(out).toContain(`<img data-annotate-src="${FILE}:1:11" src="/a.png" alt="A"/>`)
    expect(out).toContain(`<br data-annotate-src="${FILE}:1:38">`)
  })

  it('skips built-ins that render no element of their own', async () => {
    const out = await stamp(
      [
        '<template>',
        '  <Transition><div v-if="open">A</div></Transition>',
        '  <template v-if="ok"><span>B</span></template>',
        '  <slot />',
        '  <component :is="tag" />',
        '</template>',
      ].join('\n'),
    )

    expect(stamps(out)).toEqual([`${FILE}:2:15`, `${FILE}:3:23`])
  })

  it('leaves files without an HTML template alone', async () => {
    expect(await stamp('<script setup>const a = 1</script>')).toBeUndefined()
    expect(await stamp('<template lang="pug">div hello</template>')).toBeUndefined()
  })

  it('maps back to the original file', async () => {
    const result = await stampVueSource('<template><p>Hi</p></template>', FILE, '/abs/src/components/PlanCard.vue')

    expect(result?.map.sources).toEqual(['/abs/src/components/PlanCard.vue'])
    expect(result?.map.sourcesContent?.[0]).toBe('<template><p>Hi</p></template>')
  })
})
