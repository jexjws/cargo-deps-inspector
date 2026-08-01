import * as v from 'valibot'

const packageSchema = v.object({
  name: v.string(),
  version: v.string(),
  source: v.optional(v.string()),
})

const findingSchema = v.object({
  advisory: v.object({
    id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    url: v.optional(v.string()),
    informational: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    cvss: v.optional(v.string()),
  }),
  package: packageSchema,
  versions: v.optional(v.object({
    patched: v.optional(v.array(v.string())),
    unaffected: v.optional(v.array(v.string())),
  })),
})

const unavailableSchemas = [
  v.object({ status: v.literal('disabled'), message: v.string() }),
  v.object({ status: v.literal('missing'), message: v.string(), installCommand: v.string() }),
  v.object({ status: v.literal('error'), message: v.string() }),
] as const

export const auditResultSchema = v.union([
  v.object({
    status: v.literal('ready'),
    generatedAt: v.number(),
    data: v.object({
      database: v.optional(v.object({
        'advisory-count': v.optional(v.number()),
        'last-commit': v.optional(v.nullable(v.string())),
        'last-updated': v.optional(v.nullable(v.string())),
      })),
      vulnerabilities: v.object({
        found: v.boolean(),
        count: v.number(),
        list: v.array(findingSchema),
      }),
      warnings: v.record(v.string(), v.array(findingSchema)),
    }),
  }),
  ...unavailableSchemas,
])

export const outdatedResultSchema = v.union([
  v.object({
    status: v.literal('ready'),
    generatedAt: v.number(),
    data: v.array(v.object({
      workspace: v.string(),
      name: v.string(),
      project: v.string(),
      compat: v.string(),
      latest: v.string(),
      kind: v.nullable(v.string()),
      platform: v.nullable(v.string()),
    })),
  }),
  ...unavailableSchemas,
])
