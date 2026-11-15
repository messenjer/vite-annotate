import type { Plugin } from 'vite'
import type { SFCDescriptor } from 'vue/compiler-sfc'

import { MagicString } from 'magic-string'
import { relative } from 'node:path'
import { normalizePath } from 'vite'

import { SOURCE_ATTR } from '../constants'

// Vue compiler element kinds (ElementTypes.ELEMENT / COMPONENT).
const PLAIN_ELEMENT = 0
const COMPONENT = 1
/** Built-ins that render no element of their own: an attribute on them would land somewhere else or nowhere. */
const SKIPPED = new Set([
  'template',
  'slot',
  'component',
  'Transition',
  'TransitionGroup',
  'KeepAlive',
  'Teleport',
  'Suspense',
  'RouterView',
  'router-view',
])

// The compiler's own node types, reached through the SFC descriptor that `vue/compiler-sfc` exports.
type TemplateRoot = NonNullable<NonNullable<SFCDescriptor['template']>['ast']>
type TemplateChild = TemplateRoot['children'][number]

/**
 * `file` is written in the attribute (relative to the root); `id` is the module id, for the source map.
 *
 * Adds `data-annotate-src="<file>:<line>:<column>"` to every element and component of a `.vue`
 * file's template, straight in the raw source. It runs before any other transform, so the line is
 * the line in the file as the person sees it, whatever later plugins cut out of the script (a
 * router's `definePage()`, for one). On a component, Vue passes the attribute down to its root
 * element, so clicking a library button points at the line that uses it.
 */
export async function stampVueSource(
  code: string,
  file: string,
  id: string = file,
): Promise<{ code: string; map: ReturnType<MagicString['generateMap']> } | null> {
  const { parse } = await import('vue/compiler-sfc')
  const { descriptor, errors } = parse(code, { filename: file, sourceMap: false })
  const ast = descriptor.template?.ast
  if (errors.length || !ast || (descriptor.template?.lang && descriptor.template.lang !== 'html')) return null

  const s = new MagicString(code)
  const visit = (node: TemplateChild): void => {
    // Only element nodes carry a `tagType`: text, comments and interpolations end here.
    if (!('tagType' in node)) return
    // ElementTypes is a const enum of the compiler: compare its numeric value.
    const kind: number = node.tagType
    if (!SKIPPED.has(node.tag) && (kind === PLAIN_ELEMENT || kind === COMPONENT)) {
      const { offset, line, column } = node.loc.start
      // Right after `<tag`: valid for `<div>`, `<div class>` and `<Foo/>` alike.
      s.appendLeft(offset + 1 + node.tag.length, ` ${SOURCE_ATTR}="${file}:${line}:${column}"`)
    }
    node.children.forEach(visit)
  }
  ast.children.forEach(visit)

  return s.hasChanged()
    ? {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary', source: id, includeContent: true }),
      }
    : null
}

/**
 * The Vite plugin that applies {@link stampVueSource} to every `.vue` file of the app. `pre`, so it
 * sees the file before any other plugin rewrites it: put it before vue-router and its kin.
 */
export function vueSourcePlugin(rootOption?: string): Plugin {
  let root = ''
  return {
    name: 'vite-annotate:vue-source',
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      root = rootOption ?? config.root
    },
    transform(code, id) {
      // Only the SFC itself: `?vue&type=…` sub-modules and virtual ones carry no template of their own.
      if (!id.endsWith('.vue') || id.includes('/node_modules/')) return null
      return stampVueSource(code, normalizePath(relative(root, id)), id)
    },
  }
}
