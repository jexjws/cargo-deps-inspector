import type { PackageNode } from 'cargo-deps-tools'
import type { SourceSizesEntry } from './dto'

export interface ComputeSourceSizesOptions {
  /** Cap the number of returned entries. Default `50`; non-positive means unlimited. */
  limit?: number
  /** Include workspace crates. Defaults to false. */
  includeWorkspace?: boolean
}

export function computeSourceSizes(
  packages: Iterable<PackageNode>,
  options: ComputeSourceSizesOptions = {},
): SourceSizesEntry[] {
  const includeWorkspace = options.includeWorkspace ?? false
  const limit = options.limit ?? 50

  const entries: SourceSizesEntry[] = []
  for (const pkg of packages) {
    const info = pkg.resolved.sourceSize
    if (!info?.bytes)
      continue
    if (!includeWorkspace && pkg.workspace)
      continue
    entries.push({
      packageId: pkg.packageId,
      name: pkg.name,
      version: pkg.version,
      workspace: pkg.workspace,
      source: pkg.source,
      sourceKind: pkg.sourceKind,
      bytes: info.bytes,
      files: info.files,
      categories: info.categories,
    })
  }

  entries.sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name))
  return limit > 0 ? entries.slice(0, limit) : entries
}
