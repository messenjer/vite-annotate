import type { DevframeScopedClientRpc } from 'devframe/client'

import type { Annotation, AnnotationTarget } from '../node/types'

import { describe, isEditable, locate, pick, sourceLabel } from './dom'
import { STYLES } from './styles'

/** The `annotate:*` RPC, from the dev server's own connection or from Vite DevTools'. */
export type AnnotateRpc = Pick<DevframeScopedClientRpc<'annotate'>, 'call' | 'sharedState'>

/** Exchanges the code printed by the dev server for trust. */
export type Trust = (code: string) => Promise<boolean>

interface Draft {
  id?: string
  element: Element | null
  target?: AnnotationTarget
  text: string
}

/**
 * Pointer events caught on the way down, at `window`, before any of the app's handlers: the app
 * never sees them while picking, nor ever when they start in the overlay.
 */
const POINTER_EVENTS = [
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'click',
  'dblclick',
  'contextmenu',
  'auxclick',
] as const

export interface OverlayOptions {
  /** Show the overlay's own floating button. Off inside Vite DevTools, where the dock button is the toggle. */
  toggle?: boolean
  /** Called whenever annotate mode turns on or off, from any source: button, Alt+A, Esc, the ✕. */
  onActiveChange?: (active: boolean) => void
}

export interface Overlay {
  refresh: () => Promise<void>
  /** Locked while `trust` is set: the panel asks for the dev server's code. `null` once trusted. */
  setTrust: (trust: Trust | null) => void
  setActive: (active: boolean) => void
}

/**
 * The in-page overlay: a toggle, a hover outline on what a note would be about, a click to pick
 * it, a panel to write and manage notes, and numbered pins on the elements they are about.
 * Everything lives in one shadow root on `<html>`, so the app's styles and the overlay's never mix.
 */
export function mountOverlay(rpc: AnnotateRpc, options: OverlayOptions = {}): Overlay {
  const host = document.createElement('vite-annotate')
  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>${STYLES}</style>`
  document.documentElement.append(host)

  // A modal <dialog> (showModal) makes everything outside it inert, the overlay included. While one
  // is open, the overlay moves into the topmost modal dialog, and back to <html> when it closes.
  // Moving the host keeps its shadow root and state. `close()` removes `open`: the observer sees it.
  function placeHost(): void {
    const modal = [...document.querySelectorAll('dialog')].findLast((d) => d.matches(':modal'))
    const parent = modal ?? document.documentElement
    if (host.parentNode !== parent) parent.append(host)
  }
  new MutationObserver(placeHost).observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ['open'],
  })

  const layer = el('div', 'layer')
  const outline = el('div', 'outline')
  const outlineLabel = el('span', 'outline-label')
  outline.append(outlineLabel)
  const picked = el('div', 'picked')
  const pins = el('div')
  let pinned: { id: string; n: number; note: string; target: AnnotationTarget }[] = []
  let pinButtons: HTMLButtonElement[] = []
  const panel = el('section', 'panel interactive')
  panel.setAttribute('aria-label', 'Notes for your agent')
  const toggle = el('button', 'toggle')
  toggle.type = 'button'
  toggle.title = 'Annotate this page (Alt+A)'
  layer.append(outline, picked, pins, panel)
  shadow.append(layer)
  if (options.toggle !== false) shadow.append(toggle)

  let annotations: Annotation[] = []
  let trust: Trust | null = null
  let active = false
  let hovered: Element | null = null
  let draft: Draft | null = null
  let frame = 0

  // ── Rendering ────────────────────────────────────────────────────────────

  function render(): void {
    const open = annotations.filter((a) => a.status === 'open').length
    toggle.setAttribute('aria-pressed', String(active))
    toggle.replaceChildren(text('span', '✎ Annotate'), ...(open ? [text('span', String(open), 'count')] : []))

    layer.hidden = !active
    if (!active) return
    panel.replaceChildren(...(trust ? [renderLocked(trust)] : [renderHeader(), ...renderBody()]))
  }

  function renderHeader(): HTMLElement {
    const header = el('header')
    const title = el('div')
    title.append(
      text('strong', 'Notes for your agent'),
      el('br'),
      text('span', 'Click an element · Esc to leave', 'hint'),
    )
    header.append(
      title,
      iconButton('✕', 'Leave annotate mode', () => setActive(false)),
    )
    return header
  }

  function renderLocked(exchange: Trust): HTMLElement {
    const form = el('form')
    const input = el('input')
    input.inputMode = 'numeric'
    input.autocomplete = 'one-time-code'
    input.placeholder = 'Code from the dev server terminal'
    input.setAttribute('aria-label', 'Code from the dev server terminal')
    const submit = button('Connect', 'primary')
    submit.type = 'submit'
    form.append(
      text('strong', 'Connect this browser'),
      text(
        'span',
        'Your dev server printed a code and a link when this page opened. Type the code, or open the link.',
        'hint',
      ),
      input,
      row(submit),
    )
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      submit.disabled = true
      const ok = await exchange(input.value.trim())
      submit.disabled = false
      if (!ok) {
        input.value = ''
        input.placeholder = 'Wrong or expired code, try again'
      }
    })
    queueMicrotask(() => input.focus())
    return form
  }

  function renderBody(): HTMLElement[] {
    const parts: HTMLElement[] = []
    if (draft) parts.push(renderDraft(draft))

    if (annotations.length) {
      const list = el('ol')
      annotations.forEach((a, i) => list.append(renderItem(a, i + 1)))
      parts.push(list)
    } else if (!draft) {
      parts.push(text('p', 'No notes yet. Click an element of the page to leave one.', 'empty'))
    }

    if (!draft) {
      const footer = el('footer')
      footer.append(button('Note on the whole page', '', () => startDraft(null)))
      parts.push(footer)
    }
    return parts
  }

  function renderDraft(d: Draft): HTMLElement {
    const form = el('form')
    const about = d.target ? `<${d.target.tag}>${d.target.text ? ` “${d.target.text}”` : ''}` : 'The whole page'
    form.append(text('strong', about))
    if (d.target?.file) form.append(text('span', `${d.target.file}:${d.target.line}`, 'mono'))

    const area = el('textarea')
    area.value = d.text
    area.placeholder = 'What should change?'
    area.setAttribute('aria-label', 'Note')
    area.addEventListener('input', () => (d.text = area.value))
    area.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        void save()
      }
    })
    const submit = button(d.id ? 'Save' : 'Add note', 'primary')
    submit.type = 'submit'
    form.append(area, row(button('Cancel', '', cancelDraft), submit))
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      void save()
    })
    queueMicrotask(() => area.focus())
    return form
  }

  function renderItem(a: Annotation, n: number): HTMLElement {
    const item = el('li')
    if (draft?.id === a.id) item.classList.add('editing')
    const done = a.status === 'resolved'
    const onScreen = !done && a.target ? locate(a.target) !== null : false
    item.append(text('span', done ? '✓' : String(n), `num${done ? ' done' : onScreen ? ' on-screen' : ''}`))

    const body = el('div', 'body')
    body.append(text('div', a.note, 'note'))
    const where = !a.target
      ? 'Whole page'
      : `${a.target.file ? `${a.target.file.split('/').pop()}:${a.target.line}` : `<${a.target.tag}>`}${
          !done && !onScreen ? ' · not on screen' : ''
        }`
    body.append(text('div', where, 'mono'))
    if (a.resolution) body.append(text('div', a.resolution.reply, 'reply'))
    item.append(body)

    const actions = el('div', 'actions')
    if (!done) actions.append(iconButton('✎', 'Edit', () => edit(a)))
    actions.append(
      iconButton(done ? '✕' : '🗑', done ? 'Dismiss' : 'Delete', () => void act(() => rpc.call('remove', { id: a.id }))),
    )
    item.append(actions)
    return item
  }

  // ── Tracking: outline, picked element and pins follow the page every frame ──

  function track(): void {
    // Read every box first, then write: interleaved, each write would force a layout for the next read.
    const outlined = hovered && hovered !== draft?.element ? hovered : null
    const pickedElement = draft?.element?.isConnected ? draft.element : null
    const boxes = pinned.map(({ target }) => locate(target)?.getBoundingClientRect() ?? null)

    place(outline, outlined)
    outlineLabel.textContent = outlined ? (sourceLabel(outlined) ?? outlined.tagName.toLowerCase()) : ''
    place(picked, pickedElement)
    pinButtons.forEach((pin, i) => {
      const box = boxes[i]
      pin.hidden = !box
      if (box) {
        pin.style.top = `${box.top}px`
        pin.style.left = `${box.left}px`
      }
    })

    frame = requestAnimationFrame(track)
  }

  /** One pin per open note on an element, numbered like the list. Rebuilt when the notes change, not every frame. */
  function renderPins(): void {
    pinned = annotations.flatMap((a, i) =>
      a.status === 'open' && a.target ? [{ id: a.id, n: i + 1, note: a.note, target: a.target }] : [],
    )
    pinButtons = pinned.map(({ id, n, note }) => {
      const pin = text('button', String(n), 'pin')
      pin.type = 'button'
      pin.title = note
      onClick(pin, () => {
        const annotation = annotations.find((a) => a.id === id)
        if (annotation) edit(annotation)
      })
      return pin
    })
    pins.replaceChildren(...pinButtons)
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  function setActive(value: boolean): void {
    if (value === active) return
    active = value
    options.onActiveChange?.(active)
    if (active) {
      frame = requestAnimationFrame(track)
      void refresh()
    } else {
      cancelAnimationFrame(frame)
      hovered = null
      draft = null
    }
    render()
  }

  function cancelDraft(): void {
    draft = null
    render()
  }

  function startDraft(element: Element | null): void {
    draft = {
      element,
      target: element ? describe(element) : undefined,
      text: '',
    }
    render()
  }

  function edit(a: Annotation): void {
    const element = a.target ? locate(a.target) : null
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    draft = {
      id: a.id,
      element,
      target: a.target,
      text: a.note,
    }
    render()
  }

  async function save(): Promise<void> {
    const d = draft
    if (!d?.text.trim()) return
    await act(async () => {
      if (d.id) {
        await rpc.call('update', { id: d.id, note: d.text })
      } else {
        await rpc.call('add', {
          note: d.text,
          page: {
            url: location.pathname + location.search + location.hash,
            viewport: { width: innerWidth, height: innerHeight },
          },
          target: d.target,
        })
      }
      draft = null
    })
  }

  async function act(run: () => Promise<unknown>): Promise<void> {
    try {
      await run()
      await refresh()
    } catch (error) {
      console.warn('[vite-annotate]', error)
    }
  }

  async function refresh(): Promise<void> {
    // Without its own button, nothing shows while off: setActive(true) refreshes when it turns on.
    if (trust || (!active && options.toggle === false)) return render()
    annotations = await rpc.call('list')
    renderPins()
    render()
  }

  // ── Events ───────────────────────────────────────────────────────────────

  /** True for events that start in the overlay. Shadow DOM retargets them to `host` outside. */
  const fromOverlay = (event: Event): boolean => event.composedPath().includes(host)

  window.addEventListener(
    'pointermove',
    (event) => {
      if (!active || trust) return
      const target = event.composedPath()[0]
      hovered = !fromOverlay(event) && target instanceof Element ? pick(target) : null
    },
    true,
  )

  for (const type of POINTER_EVENTS) {
    window.addEventListener(
      type,
      (event) => {
        if (fromOverlay(event)) {
          // A modal closes on a click outside it, often from a listener on the way down
          // (`onClickOutside`, Headless UI): the overlay is outside it. Stopped here, the event no
          // longer reaches the overlay's own buttons either, so their action runs from here.
          event.stopImmediatePropagation()
          if (type === 'click') runClickAction(event, host)
          return
        }
        if (!active) return
        event.preventDefault()
        event.stopImmediatePropagation()
        if (type === 'click' && !trust && hovered) startDraft(hovered)
      },
      true,
    )
  }

  // A modal dialog traps focus: the overlay is outside it. Key and focus events stop at the host,
  // and focus moving into the overlay is hidden from the trap.
  for (const type of ['focusin', 'keydown', 'keyup'] as const)
    host.addEventListener(type, (event) => event.stopPropagation())
  window.addEventListener(
    'focusout',
    (event) => {
      if (active && event.relatedTarget === host) event.stopImmediatePropagation()
    },
    true,
  )

  window.addEventListener(
    'keydown',
    (event) => {
      // `code`, not `key`: Alt+A types "å" on a Mac.
      if (event.altKey && event.code === 'KeyA' && !isEditable(event.composedPath()[0] ?? null)) {
        event.preventDefault()
        setActive(!active)
      } else if (event.key === 'Escape' && active) {
        // preventDefault too: Escape would otherwise also close a native <dialog> underneath.
        event.preventDefault()
        event.stopImmediatePropagation()
        if (draft) cancelDraft()
        else setActive(false)
      }
    },
    true,
  )

  onClick(toggle, () => setActive(!active))

  render()
  return {
    refresh,
    setTrust(next) {
      trust = next
      void refresh()
    },
    setActive,
  }
}

/** Refreshes `overlay` whenever the dev server bumps the revision: the file changed, from any page or the agent. */
export async function followRevision(rpc: AnnotateRpc, overlay: Overlay): Promise<void> {
  const state = await rpc.sharedState('state')
  state.on('updated', () => void overlay.refresh())
}

/** Lays `node` over `target`, or hides it. */
function place(node: HTMLElement, target: Element | null): void {
  node.hidden = !target
  if (!target) return
  const box = target.getBoundingClientRect()
  Object.assign(node.style, {
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  })
}

// ── Tiny DOM helpers ───────────────────────────────────────────────────────

/** Click actions of the overlay's buttons, run by `runClickAction`: a click never reaches them as an event. */
const clickActions = new WeakMap<EventTarget, () => void>()

function onClick(node: HTMLElement, action: () => void): void {
  clickActions.set(node, action)
}

/** Runs the action of the innermost overlay button on the click's path. */
function runClickAction(event: Event, host: Element): void {
  for (const node of event.composedPath()) {
    if (node === host) return
    const action = clickActions.get(node)
    if (action) return action()
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}

/** Text goes in as text, never as HTML: notes and replies are written by people and agents. */
function text<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  content: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = el(tag, className)
  node.textContent = content
  return node
}

function button(label: string, variant: string, action?: () => void): HTMLButtonElement {
  const node = text('button', label, `btn ${variant}`.trim())
  node.type = 'button'
  if (action) onClick(node, action)
  return node
}

function iconButton(glyph: string, label: string, action: () => void): HTMLButtonElement {
  const node = button(glyph, '', action)
  node.className = 'icon'
  node.setAttribute('aria-label', label)
  node.title = label
  return node
}

function row(...children: HTMLElement[]): HTMLElement {
  const node = el('div', 'row')
  node.append(...children)
  return node
}
