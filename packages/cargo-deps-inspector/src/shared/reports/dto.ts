import type { PackageSourceSizeInfo } from 'cargo-deps-tools'

export interface DuplicatesEntry {
  name: string
  versions: string[]
  packageIds: string[]
}

export interface SourceSizesEntry {
  packageId: string
  name: string
  version: string
  workspace: boolean
  source: string | null
  sourceKind: string
  bytes: number
  files: number
  categories: PackageSourceSizeInfo['categories']
}
