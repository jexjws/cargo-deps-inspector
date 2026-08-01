import type { PackageNode } from 'cargo-deps-tools'
import type { FilterOptions } from '../../shared/filters'
import { objectEntries } from '@vueuse/core'
import { dependencyKindToCluster } from 'cargo-deps-tools/constants'
import { constructPackageFilters } from 'cargo-deps-tools/utils'
import { computed, reactive, toRaw } from 'vue'
import { FILTERS_SCHEMA } from '../../shared/filters'
import { rawPayload } from './data'

export * from '../../shared/filters'

function schemaDefaults(): FilterOptions {
  return Object.fromEntries(
    Object.entries(FILTERS_SCHEMA).map(([key, value]) => [key, structuredClone(value.default)]),
  ) as unknown as FilterOptions
}

export const filtersDefault = computed<FilterOptions>(() => ({
  ...schemaDefaults(),
  ...(rawPayload.value?.config?.defaultFilters || {}),
}))

export const FILTER_KEYS_SELECT = objectEntries(FILTERS_SCHEMA)
  .filter(([, value]) => value.category === 'select')
  .map(([key]) => key) as (keyof FilterOptions)[]
export const FILTER_KEYS_EXCLUDES = objectEntries(FILTERS_SCHEMA)
  .filter(([, value]) => value.category === 'exclude')
  .map(([key]) => key) as (keyof FilterOptions)[]

const state = reactive<FilterOptions>(schemaDefaults())

export function filtersExcludePredicate(pkg: PackageNode): boolean {
  if (state.excludeWorkspace && pkg.workspace)
    return true
  return filtersExplicitExcludePredicate(pkg)
}

export function filtersExplicitExcludePredicate(pkg: PackageNode): boolean {
  if (!state.excludes?.length)
    return false
  return constructPackageFilters(state.excludes, 'some')(pkg)
}

export const filterSelectPredicate = computed(() => {
  const search = state.search.trim().toLocaleLowerCase()
  const focus = state.focus?.length ? new Set(state.focus) : undefined
  const why = state.why?.length ? new Set(state.why) : undefined
  const depths = state.depths?.map(value => Number(value))

  return (pkg: PackageNode): boolean => {
    if (state.sourceKinds?.length && !state.sourceKinds.includes(pkg.sourceKind))
      return false
    if (state.dependencyKinds?.length && !state.dependencyKinds.some((kind) => {
      return pkg.workspace || pkg.flatClusters.has(dependencyKindToCluster(kind))
    })) {
      return false
    }
    if (depths?.length && !depths.includes(pkg.depth))
      return false
    if (focus && !focus.has(pkg.packageId) && ![...focus].some(id => pkg.flatDependents.has(id)))
      return false
    if (why && !why.has(pkg.packageId) && ![...why].some(id => pkg.flatDependencies.has(id)))
      return false
    if (search) {
      const metadata = pkg.metadata
      const haystack = [
        pkg.name,
        pkg.version,
        pkg.packageId,
        pkg.sourceKind,
        metadata.description,
        metadata.license,
        metadata.repository,
        ...metadata.authors,
        ...metadata.keywords,
      ].filter(Boolean).join(' ').toLocaleLowerCase()
      if (!haystack.includes(search))
        return false
    }
    return true
  }
})

export function isDeepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function reset(keys: (keyof FilterOptions)[]): void {
  for (const key of keys) {
    (state as any)[key] = structuredClone(toRaw(filtersDefault.value[key]))
  }
}

function toggleList(key: 'focus' | 'why' | 'excludes', value: string, active?: boolean): void {
  const current = new Set(state[key] ?? [])
  const shouldAdd = active ?? !current.has(value)
  if (shouldAdd)
    current.add(value)
  else
    current.delete(value)
  state[key] = current.size ? [...current] : null
}

export const filters = reactive({
  state,
  select: {
    reset: () => reset(FILTER_KEYS_SELECT),
    activated: computed(() => FILTER_KEYS_SELECT.filter(key => !isDeepEqual(state[key], filtersDefault.value[key]))),
  },
  exclude: {
    reset: () => reset(FILTER_KEYS_EXCLUDES),
    activated: computed(() => FILTER_KEYS_EXCLUDES.filter(key => !isDeepEqual(state[key], filtersDefault.value[key]))),
  },
  focus: { toggle: (value: string, active?: boolean) => toggleList('focus', value, active) },
  why: { toggle: (value: string, active?: boolean) => toggleList('why', value, active) },
  excludes: { toggle: (value: string, active?: boolean) => toggleList('excludes', value, active) },
})
