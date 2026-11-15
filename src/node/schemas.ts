import * as v from 'valibot'

import type { Annotation } from './types'

const NoteSchema = v.pipe(v.string(), v.trim(), v.minLength(1))

const PageSchema = v.object({
  url: v.string(),
  viewport: v.object({ width: v.number(), height: v.number() }),
})

const TargetSchema = v.object({
  file: v.optional(v.string()),
  line: v.optional(v.number()),
  column: v.optional(v.number()),
  selector: v.string(),
  tag: v.string(),
  text: v.string(),
})

/** A record of `.vite-annotate/annotations.json`, as `types.ts` describes it. */
const AnnotationSchema = v.object({
  id: v.string(),
  createdAt: v.string(),
  status: v.picklist(['open', 'resolved']),
  note: v.string(),
  page: PageSchema,
  target: v.optional(TargetSchema),
  resolution: v.optional(v.object({ at: v.string(), reply: v.string() })),
})

export const AnnotationListSchema = v.array(AnnotationSchema)

// types.ts is the documented shape; the schema must parse to exactly it.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
true satisfies Same<v.InferOutput<typeof AnnotationSchema>, Annotation>

export const AddSchema = v.object({
  note: NoteSchema,
  page: PageSchema,
  target: v.optional(TargetSchema),
})

export const UpdateSchema = v.object({
  id: v.string(),
  note: NoteSchema,
})

export const IdSchema = v.object({
  id: v.string(),
})

// Agent tools take one flat object, so agents see named fields instead of positional args.

export const AgentListSchema = v.object({
  status: v.optional(
    v.pipe(v.picklist(['open', 'resolved', 'all']), v.description('Which notes to list. Default: open.')),
  ),
  file: v.optional(
    v.pipe(v.string(), v.description('Only notes on elements from this source file, relative to the project root.')),
  ),
})

export const AgentResolveSchema = v.object({
  id: v.pipe(v.string(), v.description('The note to resolve, from annotate_list.')),
  reply: v.pipe(
    v.string(),
    v.minLength(1),
    v.description('One or two sentences for the person: what you changed, or why you did not.'),
  ),
})
