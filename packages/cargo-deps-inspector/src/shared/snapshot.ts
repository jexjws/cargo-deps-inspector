import type { CargoMetadata, ListPackageDependenciesResult, PackageNode } from 'cargo-deps-tools'
import type {
  CargoAuditReport,
  CargoDepsInspectorPayload,
  CargoDepsInspectorSnapshot,
  CargoOutdatedEntry,
  ExternalToolResult,
} from './types'
import { parseCargoMetadata, populateDependencyGraph } from 'cargo-deps-tools/browser'

export interface CreateSnapshotOptions {
  generatorVersion: string
  audit?: ExternalToolResult<CargoAuditReport>
  outdated?: ExternalToolResult<CargoOutdatedEntry[]>
}

export function createSnapshot(
  payload: CargoDepsInspectorPayload,
  options: CreateSnapshotOptions,
): CargoDepsInspectorSnapshot {
  const sourceSizes: CargoDepsInspectorSnapshot['sourceSizes'] = {}
  for (const pkg of payload.packages.values()) {
    if (pkg.resolved.sourceSize)
      sourceSizes[pkg.spec] = pkg.resolved.sourceSize
  }
  return {
    kind: 'cargo-deps-inspector-snapshot',
    schemaVersion: 1,
    generatedAt: Date.now(),
    generatorVersion: options.generatorVersion,
    metadata: payload.cargoMetadata,
    sourceSizes,
    audit: options.audit,
    outdated: options.outdated,
  }
}

export function isCargoMetadata(input: unknown): input is CargoMetadata {
  const value = input as Partial<CargoMetadata> | null
  return value?.version === 1
    && Array.isArray(value.packages)
    && Array.isArray(value.workspace_members)
}

export function isCargoDepsInspectorSnapshot(input: unknown): input is CargoDepsInspectorSnapshot {
  const value = input as Partial<CargoDepsInspectorSnapshot> | null
  return value?.kind === 'cargo-deps-inspector-snapshot'
    && value.schemaVersion === 1
    && isCargoMetadata(value.metadata)
}

export function payloadFromImport(input: unknown): {
  payload: CargoDepsInspectorPayload
  snapshot?: CargoDepsInspectorSnapshot
} {
  const snapshot = isCargoDepsInspectorSnapshot(input) ? input : undefined
  const metadata = snapshot?.metadata ?? input
  if (!isCargoMetadata(metadata))
    throw new TypeError('请选择 cargo metadata --format-version=1 生成的 JSON，或 Cargo Deps Inspector 增强快照。')

  const raw = parseCargoMetadata(metadata)
  const result = populateDependencyGraph(raw) as ListPackageDependenciesResult
  for (const pkg of result.packages.values()) {
    ;(pkg as PackageNode).resolved = {
      sourceSize: snapshot?.sourceSizes[pkg.spec],
    }
  }
  const ids = [...result.packages.keys()].sort()
  let hash = 2166136261
  for (const character of ids.join('\0')) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return {
    payload: {
      ...result,
      timestamp: snapshot?.generatedAt ?? Date.now(),
      hash: (hash >>> 0).toString(16),
    },
    snapshot,
  }
}
