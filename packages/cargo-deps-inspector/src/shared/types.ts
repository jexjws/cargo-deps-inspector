import type {
  CargoMetadata,
  CargoResolutionOptions,
  ListPackageDependenciesResult,
  PackageNodeRaw,
  PackageSourceSizeInfo,
} from 'cargo-deps-tools'
import type { FilterOptions } from './filters'

export type { FilterOptions }

export interface CargoDepsInspectorPayload extends ListPackageDependenciesResult {
  timestamp: number
  hash: string
  config?: CargoDepsInspectorConfig
}

export interface CargoDepsInspectorHeartbeat {
  status: 'heartbeat'
  heartbeat: number
}

export interface CargoDepsInspectorError {
  status: 'error'
  error: unknown
}

export type CargoDepsInspectorLog
  = CargoDepsInspectorPayload
    | CargoDepsInspectorHeartbeat
    | CargoDepsInspectorError

export interface CargoExternalToolOptions {
  enabled?: boolean
  timeoutMs?: number
}

export interface CargoAuditOptions extends CargoExternalToolOptions {
  noFetch?: boolean
  stale?: boolean
  ignore?: string[]
}

export interface CargoOutdatedOptions extends CargoExternalToolOptions {
  offline?: boolean
  depth?: number
  rootDepsOnly?: boolean
}

export interface CargoDepsInspectorConfig {
  /** Display name for the inspected workspace. */
  name?: string
  /** Arguments forwarded to `cargo metadata`. `locked` defaults to true. */
  cargo?: Omit<CargoResolutionOptions, 'manifestPath'> & {
    manifestPath?: string
    /** Cargo executable or absolute path. */
    cargoPath?: string
  }
  /** Optional on-demand integrations. Both are enabled by default when installed. */
  externalTools?: {
    audit?: boolean | CargoAuditOptions
    outdated?: boolean | CargoOutdatedOptions
  }
  /** Exclude matching crates and their outgoing graph. */
  excludePackages?: (string | ((node: PackageNodeRaw) => boolean))[]
  /** Keep matching crates but omit their dependencies. */
  excludeDependenciesOf?: (string | ((node: PackageNodeRaw) => boolean))[]
  defaultFilters?: Partial<FilterOptions>
  defaultSettings?: Partial<SettingsOptions>
  onPayloadReady?: (payload: CargoDepsInspectorPayload) => void | Promise<void>
}

export interface SettingsOptions {
  graphRender: 'normal' | 'dots'
  deepDependenciesTree: boolean
  dependenciesGroupBy: 'none' | 'source' | 'kind'
  packageDetailsTab: 'dependencies' | 'dependents'
  colorizePackageSize: boolean
  showSourceSizeBadge: boolean
  showDependencyKindBadge: 'none' | 'normal' | 'dev' | 'build' | 'all'
  showFileComposition: boolean
  chartColoringMode: 'spectrum' | 'source'
  chartMetric: 'source-size' | 'packages'
  collapseSidepanel: boolean
  chartAnimation: boolean
}

export interface CargoAuditPackage {
  name: string
  version: string
  source?: string
}

export interface CargoAuditAdvisory {
  id: string
  title: string
  description?: string
  date?: string
  url?: string
  informational?: string
  categories?: string[]
  keywords?: string[]
  cvss?: string
}

export interface CargoAuditFinding {
  advisory: CargoAuditAdvisory
  package: CargoAuditPackage
  versions?: {
    patched?: string[]
    unaffected?: string[]
  }
}

export interface CargoAuditReport {
  database?: {
    'advisory-count'?: number
    'last-commit'?: string | null
    'last-updated'?: string | null
  }
  vulnerabilities: {
    found: boolean
    count: number
    list: CargoAuditFinding[]
  }
  warnings: Record<string, CargoAuditFinding[]>
}

export interface CargoOutdatedEntry {
  workspace: string
  name: string
  project: string
  compat: string
  latest: string
  kind: string | null
  platform: string | null
}

export type ExternalToolResult<T>
  = { status: 'ready', generatedAt: number, data: T }
    | { status: 'disabled', message: string }
    | { status: 'missing', message: string, installCommand: string }
    | { status: 'error', message: string }

export interface CargoDepsInspectorSnapshot {
  kind: 'cargo-deps-inspector-snapshot'
  schemaVersion: 1
  generatedAt: number
  generatorVersion: string
  metadata: CargoMetadata
  sourceSizes: Record<string, PackageSourceSizeInfo>
  audit?: ExternalToolResult<CargoAuditReport>
  outdated?: ExternalToolResult<CargoOutdatedEntry[]>
}
