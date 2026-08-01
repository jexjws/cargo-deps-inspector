import type {
  CargoAuditReport,
  CargoDepsInspectorPayload,
  CargoOutdatedEntry,
  ExternalToolResult,
} from '../../shared/types'
import { shallowRef, toRaw } from 'vue'
import { getBackend } from '../backends'
import { filters, filtersDefault } from './filters'
import { settings } from './settings'

export const rawPayload = shallowRef<CargoDepsInspectorPayload | null>(null)
export const rawAudit = shallowRef<ExternalToolResult<CargoAuditReport>>()
export const rawOutdated = shallowRef<ExternalToolResult<CargoOutdatedEntry[]>>()

export async function fetchData(force = false, propagateError = false): Promise<CargoDepsInspectorPayload | null> {
  const backend = getBackend()
  try {
    const data = await backend.functions.getPayload(force)
    rawPayload.value = data
    Object.assign(settings.value, structuredClone(toRaw(data.config?.defaultSettings || {})))
    Object.assign(filters.state, structuredClone(toRaw(filtersDefault.value)))
    return data
  }
  catch (error) {
    backend.connectionError.value = error
    if (propagateError)
      throw error
    return null
  }
}

export async function fetchAudit(force = false): Promise<void> {
  const function_ = getBackend().functions.getAudit
  if (function_)
    rawAudit.value = await function_(force)
}

export async function fetchOutdated(force = false): Promise<void> {
  const function_ = getBackend().functions.getOutdated
  if (function_)
    rawOutdated.value = await function_(force)
}
