import type { BaseOptions } from './base'
import type { CargoMetadata } from './metadata'
import type { PackageNode, PackageNodeBase, PackageNodeRaw } from './node'

export interface CargoResolutionOptions {
  manifestPath?: string
  features?: string[]
  allFeatures?: boolean
  noDefaultFeatures?: boolean
  filterPlatform?: string
  /** Defaults to true to ensure inspection never creates or updates Cargo.lock. */
  locked?: boolean
  offline?: boolean
  frozen?: boolean
}

export interface ListPackageDependenciesOptions extends BaseOptions, CargoResolutionOptions {
  /** Maximum graph depth from workspace members. Omit for the complete graph. */
  depth?: number
  traverseFilter?: (node: PackageNodeRaw) => boolean
  dependenciesFilter?: (node: PackageNodeRaw) => boolean
}

export interface ParseCargoMetadataOptions {
  depth?: number
  cargoVersion?: string
  traverseFilter?: (node: PackageNodeRaw) => boolean
  dependenciesFilter?: (node: PackageNodeRaw) => boolean
}

export interface ListPackageDependenciesRawResult {
  root: string
  cargoVersion?: string
  targetDirectory: string
  workspaceMembers: string[]
  cargoMetadata: CargoMetadata
  packages: Map<string, PackageNodeRaw>
}

export interface ListPackageDependenciesBaseResult extends Omit<ListPackageDependenciesRawResult, 'packages'> {
  packages: Map<string, PackageNodeBase>
}

export interface ListPackageDependenciesResult extends Omit<ListPackageDependenciesBaseResult, 'packages'> {
  packages: Map<string, PackageNode>
}
