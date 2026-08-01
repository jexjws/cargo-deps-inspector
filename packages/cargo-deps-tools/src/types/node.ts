import type { CargoDependencyKind, CargoMetadataPackage } from './metadata'
import type { PackageSourceSizeInfo } from './size'

export type CargoPackageSourceKind = 'workspace' | 'path' | 'registry' | 'git' | 'unknown'

export interface CargoDependencyEdge {
  /** Crate name as referenced by the consumer, including dependency renames. */
  name: string
  /** Resolved Cargo package id of the dependency. */
  packageId: string
  kind: CargoDependencyKind
  target: string | null
  requirement?: string
  optional?: boolean
  usesDefaultFeatures?: boolean
  requestedFeatures?: string[]
}

export interface PackageNodeRaw {
  /** Opaque Cargo package id. It is the canonical graph key. */
  spec: string
  packageId: string
  name: string
  version: string
  filepath: string
  manifestPath: string
  source: string | null
  sourceKind: CargoPackageSourceKind
  workspace: boolean
  dependencies: Set<string>
  dependencyEdges: Map<string, CargoDependencyEdge[]>
  clusters: Set<string>
  metadata: CargoMetadataPackage
  enabledFeatures: string[]
}

export interface PackageNodeBase extends PackageNodeRaw {
  dependents: Set<string>
  depth: number
  shallowestDependent: Set<string> | undefined
  flatDependencies: Set<string>
  flatDependents: Set<string>
  flatClusters: Set<string>
}

export interface PackageNode extends PackageNodeBase {
  resolved: {
    sourceSize?: PackageSourceSizeInfo
  }
}
