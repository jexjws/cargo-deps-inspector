import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { auditResultSchema } from './external-tool-schemas'

const argsSchema = v.optional(v.object({
  force: v.optional(v.boolean(), false),
}), {})

export function reportAuditRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'report-audit',
    type: 'query',
    jsonSerializable: true,
    args: [argsSchema],
    returns: auditResultSchema,
    agent: {
      description: 'Run cargo-audit on demand and return RustSec vulnerabilities and warnings. Read-only; reports an install command when cargo-audit is unavailable.',
    },
    handler: (async (opts: { force?: boolean } = {}) => handlers.getAudit(opts.force)) as any,
  })
}
