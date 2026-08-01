import type { Ref } from 'vue'
import type {
  CargoAuditReport,
  CargoDepsInspectorPayload,
  CargoOutdatedEntry,
  ExternalToolResult,
} from '../../shared/types'

export interface BackendCallableFunctions {
  getPayload: (force?: boolean) => Promise<CargoDepsInspectorPayload>
  getAudit?: (force?: boolean) => Promise<ExternalToolResult<CargoAuditReport>>
  getOutdated?: (force?: boolean) => Promise<ExternalToolResult<CargoOutdatedEntry[]>>
  openInEditor?: (filename: string) => void
  openInFinder?: (filename: string) => void
}

export interface Backend {
  name: 'dev' | 'static' | 'import'
  status: Ref<'idle' | 'connecting' | 'connected' | 'error'>
  connectionError: Ref<unknown | undefined>
  connect: () => Promise<void> | void
  isDynamic?: boolean
  functions: BackendCallableFunctions
}
