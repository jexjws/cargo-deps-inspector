import process from 'node:process'
import { defineDevframe } from 'devframe'
import { description, homepage, name as packageName, version } from '../../package.json'
import { distDir } from '../dirs'
import { getPayloadRpc } from './rpc/get-payload'
import { createInspectorRpcHandlers } from './rpc/handlers'
import { openInEditorRpc } from './rpc/open-in-editor'
import { openInFinderRpc } from './rpc/open-in-finder'
import { reportAuditRpc } from './rpc/report-audit'
import { reportDuplicatesRpc } from './rpc/report-duplicates'
import { reportOutdatedRpc } from './rpc/report-outdated'
import { reportSourceSizesRpc } from './rpc/report-source-sizes'

export interface InspectorDevframeFlags {
  root?: string
  config?: string
  depth?: number
  manifestPath?: string
  cargoPath?: string
  features?: string[]
  allFeatures?: boolean
  noDefaultFeatures?: boolean
  filterPlatform?: string
  locked?: boolean
  offline?: boolean
  frozen?: boolean
  quiet?: boolean
}

function envBoolean(name: string): boolean | undefined {
  const value = process.env[name]
  if (value == null)
    return undefined
  return value === '1' || value === 'true'
}

export default defineDevframe({
  id: 'cargo-deps-inspector',
  name: 'Cargo Deps Inspector',
  version,
  packageName,
  importMetaUrl: import.meta.url,
  homepage,
  description,
  icon: 'ph:cube-duotone',
  cli: {
    command: 'cargo-deps-inspector',
    distDir,
  },
  setup(ctx, info) {
    const flags = (info?.flags ?? {}) as InspectorDevframeFlags
    // The MCP adapter calls setup without flags. The CLI bridges its Cargo
    // resolution options through CDI_CLI_* variables for that adapter only.
    const handlers = createInspectorRpcHandlers({
      cwd: flags.root ?? process.env.CDI_CLI_ROOT ?? ctx.cwd,
      configFile: flags.config ?? process.env.CDI_CLI_CONFIG,
      depth: flags.depth ?? (process.env.CDI_CLI_DEPTH ? Number(process.env.CDI_CLI_DEPTH) : undefined),
      manifestPath: flags.manifestPath ?? process.env.CDI_CLI_MANIFEST_PATH,
      cargoPath: flags.cargoPath ?? process.env.CDI_CLI_CARGO_PATH,
      features: flags.features ?? process.env.CDI_CLI_FEATURES?.split(',').filter(Boolean),
      allFeatures: flags.allFeatures ?? envBoolean('CDI_CLI_ALL_FEATURES'),
      noDefaultFeatures: flags.noDefaultFeatures ?? envBoolean('CDI_CLI_NO_DEFAULT_FEATURES'),
      filterPlatform: flags.filterPlatform ?? process.env.CDI_CLI_FILTER_PLATFORM,
      locked: flags.locked ?? envBoolean('CDI_CLI_LOCKED'),
      offline: flags.offline ?? envBoolean('CDI_CLI_OFFLINE'),
      frozen: flags.frozen ?? envBoolean('CDI_CLI_FROZEN'),
      mode: ctx.mode,
      quiet: flags.quiet ?? process.env.CDI_CLI_QUIET === '1',
    })

    const inspector = ctx.scope('cargo-deps-inspector')
    inspector.rpc.register(getPayloadRpc(handlers))
    inspector.rpc.register(openInEditorRpc(handlers))
    inspector.rpc.register(openInFinderRpc(handlers))
    inspector.rpc.register(reportDuplicatesRpc(handlers))
    inspector.rpc.register(reportSourceSizesRpc(handlers))
    inspector.rpc.register(reportAuditRpc(handlers))
    inspector.rpc.register(reportOutdatedRpc(handlers))
  },
})
