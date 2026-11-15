/** Where the annotated element comes from, and how to find it again on the page. */
export interface AnnotationTarget {
  /** Source file, relative to the project root: `src/components/PlanCard.vue`. Absent outside stamped templates. */
  file?: string
  /** 1-based line and column of the element's opening tag in `file`. */
  line?: number
  column?: number
  /** A CSS selector to find the element again on the same screen. */
  selector: string
  tag: string
  /** Its visible text or accessible name, cut short. */
  text: string
}

export type AnnotationStatus = 'open' | 'resolved'

export interface Annotation {
  id: string
  createdAt: string
  status: AnnotationStatus
  /** What the person wants changed, in their words. */
  note: string
  page: {
    /** Path, query and hash of the page it was left on. */
    url: string
    viewport: { width: number; height: number }
  }
  /** Absent for a note on the whole page. */
  target?: AnnotationTarget
  /** Set by the agent when it resolves the note. */
  resolution?: { at: string; reply: string }
}

/** Shared with every connected page: bumps when the file changes, so overlays re-fetch. */
export interface AnnotateState {
  revision: number
}
