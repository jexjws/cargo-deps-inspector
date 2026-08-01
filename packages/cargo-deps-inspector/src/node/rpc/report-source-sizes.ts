import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { computeSourceSizes } from '../../shared/reports/sizes'

const argsSchema = v.optional(v.object({
  limit: v.optional(v.pipe(v.number(), v.integer()), 50),
  includeWorkspace: v.optional(v.boolean(), false),
}), {})

const returnsSchema = v.array(v.object({
  packageId: v.string(),
  name: v.string(),
  version: v.string(),
  workspace: v.boolean(),
  source: v.nullable(v.string()),
  sourceKind: v.string(),
  bytes: v.number(),
  files: v.number(),
  categories: v.record(v.string(), v.object({
    bytes: v.number(),
    count: v.number(),
  })),
}))

export function reportSourceSizesRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'report-source-sizes',
    type: 'query',
    jsonSerializable: true,
    args: [argsSchema],
    returns: returnsSchema,
    agent: {
      description: 'List Cargo crates sorted by local source-tree size (largest first). Read-only.',
    },
    handler: (async (opts = {}) => {
      const payload = await handlers.getPayload()
      return computeSourceSizes(payload.packages.values(), opts)
    }) as any,
  })
}
