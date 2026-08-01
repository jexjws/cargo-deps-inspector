import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { outdatedResultSchema } from './external-tool-schemas'

const argsSchema = v.optional(v.object({
  force: v.optional(v.boolean(), false),
}), {})

export function reportOutdatedRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'report-outdated',
    type: 'query',
    jsonSerializable: true,
    args: [argsSchema],
    returns: outdatedResultSchema,
    agent: {
      description: 'Run cargo-outdated on demand and return workspace dependency update opportunities. Read-only; reports an install command when cargo-outdated is unavailable.',
    },
    handler: (async (opts: { force?: boolean } = {}) => handlers.getOutdated(opts.force)) as any,
  })
}
