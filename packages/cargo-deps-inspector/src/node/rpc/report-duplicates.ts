import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { computeDuplicates } from '../../shared/reports/duplicates'

const argsSchema = v.optional(v.object({
  minVersions: v.optional(v.pipe(v.number(), v.integer(), v.minValue(2)), 2),
  limit: v.optional(v.number()),
}), {})

const returnsSchema = v.array(v.object({
  name: v.string(),
  versions: v.array(v.string()),
  packageIds: v.array(v.string()),
}))

export function reportDuplicatesRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'report-duplicates',
    type: 'query',
    jsonSerializable: true,
    args: [argsSchema],
    returns: returnsSchema,
    agent: {
      description: 'List Cargo crates resolved to multiple versions in the workspace. Read-only.',
    },
    // Cast: devframe's handler type expects sync RETURN, but async is allowed at runtime (devframe awaits).
    handler: (async (opts = {}) => {
      const payload = await handlers.getPayload()
      return computeDuplicates(payload.packages.values(), opts)
    }) as any,
  })
}
