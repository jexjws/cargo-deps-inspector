import type { CargoDependencyKind, CargoPackageSourceKind } from './types'

export const CargoDependencyKinds: readonly CargoDependencyKind[] = Object.freeze(['normal', 'dev', 'build'])
export const CargoPackageSourceKinds: readonly CargoPackageSourceKind[] = Object.freeze(['workspace', 'path', 'registry', 'git', 'unknown'])

export const CLUSTER_DEP_NORMAL = 'dep:normal'
export const CLUSTER_DEP_DEV = 'dep:dev'
export const CLUSTER_DEP_BUILD = 'dep:build'

export function dependencyKindToCluster(kind: CargoDependencyKind): string {
  return `dep:${kind}`
}
