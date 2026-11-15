import type { AnnotationTarget } from '../node/types'

import { SOURCE_ATTR } from '../constants'

/** The element a note is about: the nearest one stamped with its source, or the clicked one. */
export function pick(element: Element): Element {
  return element.closest(`[${SOURCE_ATTR}]`) ?? element
}

export function describe(element: Element): AnnotationTarget {
  const source = parseSource(element.getAttribute(SOURCE_ATTR))
  return {
    ...source,
    selector: selectorOf(element),
    tag: element.tagName.toLowerCase(),
    text: labelOf(element),
  }
}

function parseSource(value: string | null): Pick<AnnotationTarget, 'file' | 'line' | 'column'> {
  const match = value?.match(/^(.*):(\d+):(\d+)$/)
  return match
    ? {
        file: match[1],
        line: Number(match[2]),
        column: Number(match[3]),
      }
    : {}
}

/** `src/PlanCard.vue:10` for a stamped element: what the hover outline shows. */
export function sourceLabel(element: Element): string | undefined {
  const { file, line } = parseSource(element.getAttribute(SOURCE_ATTR))
  return file ? `${file}:${line}` : undefined
}

function sourceOf(target: AnnotationTarget): string | undefined {
  return target.file ? `${target.file}:${target.line}:${target.column}` : undefined
}

/** What a person would call the element: its text, or its accessible name for an icon or a field. */
function labelOf(element: Element): string {
  const text =
    element instanceof HTMLElement
      ? // innerText, not textContent: the text as rendered, without hidden nodes and with line breaks.
        // oxlint-disable-next-line unicorn/prefer-dom-node-text-content
        element.innerText
      : element.textContent
  const label =
    text?.trim() ||
    element.getAttribute('aria-label') ||
    element.getAttribute('placeholder') ||
    element.getAttribute('title') ||
    element.getAttribute('alt') ||
    ''
  const flat = label.replace(/\s+/g, ' ').trim()
  return flat.length > 80 ? `${flat.slice(0, 79)}…` : flat
}

/** `tag:nth-of-type()` steps up to the nearest unique id, or to `body`. */
function selectorOf(element: Element): string {
  const steps: string[] = []
  for (let node: Element | null = element; node && node !== document.body; node = node.parentElement) {
    if (node.id && document.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1)
      return [`#${CSS.escape(node.id)}`, ...steps].join(' > ')
    const tag = node.tagName.toLowerCase()
    const same = node.parentElement ? [...node.parentElement.children].filter((c) => c.tagName === node.tagName) : []
    steps.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag)
  }
  return ['body', ...steps].join(' > ')
}

/**
 * The note's element on the screen as it is now: the selector while it still points at the same
 * source, then an element from that source with the same text. `null` when it isn't on screen
 * (another step, a closed dialog, or code that changed since).
 */
export function locate(target: AnnotationTarget): Element | null {
  const source = sourceOf(target)
  let bySelector: Element | null = null
  try {
    bySelector = document.querySelector(target.selector)
  } catch {}
  if (bySelector && (!source || bySelector.getAttribute(SOURCE_ATTR) === source)) return bySelector
  if (!source) return null
  const same = [...document.querySelectorAll(`[${SOURCE_ATTR}="${CSS.escape(source)}"]`)]
  return same.find((e) => labelOf(e) === target.text) ?? (same.length === 1 ? same[0]! : null)
}

export function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && (target.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  )
}
