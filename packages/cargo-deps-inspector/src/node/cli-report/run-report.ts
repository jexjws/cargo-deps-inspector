import type { ListPackageDependenciesOptions } from 'cargo-deps-tools'
import process from 'node:process'
import { computeDuplicates } from '../../shared/reports/duplicates'
import { computeSourceSizes } from '../../shared/reports/sizes'
import { createInspectorRpcHandlers } from '../rpc/handlers'
import { formatAudit } from './format-audit'
import { formatDuplicates } from './format-duplicates'
import { formatOutdated } from './format-outdated'
import { formatSourceSizes } from './format-source-sizes'

export type ReportType = 'duplicates' | 'source-sizes' | 'audit' | 'outdated'

export interface RunReportOptions extends Partial<ListPackageDependenciesOptions> {
  type: ReportType
  root: string
  config?: string
  json: boolean
  limit?: number
  minVersions?: number
  includeWorkspace?: boolean
  force?: boolean
}

export async function runReport(options: RunReportOptions): Promise<void> {
  const handlers = createInspectorRpcHandlers({
    cwd: options.root,
    depth: options.depth,
    configFile: options.config,
    cargoPath: options.cargoPath,
    manifestPath: options.manifestPath,
    features: options.features,
    allFeatures: options.allFeatures,
    noDefaultFeatures: options.noDefaultFeatures,
    filterPlatform: options.filterPlatform,
    locked: options.locked,
    offline: options.offline,
    frozen: options.frozen,
    mode: 'build',
    quiet: true,
  })

  if (options.type === 'duplicates') {
    const payload = await handlers.getPayload()
    const data = computeDuplicates(payload.packages.values(), {
      minVersions: options.minVersions,
      limit: options.limit,
    })
    write(options.json ? toJson(data) : formatDuplicates(data))
    return
  }

  if (options.type === 'source-sizes') {
    const payload = await handlers.getPayload()
    const data = computeSourceSizes(payload.packages.values(), {
      limit: options.limit,
      includeWorkspace: options.includeWorkspace,
    })
    write(options.json ? toJson(data) : formatSourceSizes(data))
    return
  }

  if (options.type === 'audit') {
    const data = await handlers.getAudit(options.force)
    write(options.json ? toJson(data) : formatAudit(data))
    return
  }

  const data = await handlers.getOutdated(options.force)
  write(options.json ? toJson(data) : formatOutdated(data))
}

function toJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`
}

function write(text: string): void {
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`)
}
