import type { PackageNode } from 'cargo-deps-tools'
import { computed, reactive } from 'vue'
import { rawPayload } from './data'
import { filters, filterSelectPredicate, filtersExplicitExcludePredicate } from './filters'

export type ComputedPayload = ReturnType<typeof createComputedPayload>

function createComputedPayload(getter: () => PackageNode[]) {
  const packages = computed(getter)
  const map = computed(() => {
    const result = new Map<string, PackageNode>()
    for (const pkg of packages.value) {
      result.set(pkg.packageId, pkg)
      result.set(pkg.spec, pkg)
    }
    return result
  })
  const versions = computed(() => {
    const result = new Map<string, PackageNode[]>()
    for (const pkg of packages.value) {
      const entries = result.get(pkg.name) ?? []
      entries.push(pkg)
      result.set(pkg.name, entries)
    }
    return result
  })
  const get = (input: string | PackageNode): PackageNode | undefined => {
    return map.value.get(typeof input === 'string' ? input : input.packageId)
  }
  const has = (input: string | PackageNode): boolean => get(input) !== undefined
  const getList = (ids: Iterable<string>): PackageNode[] => [...ids].map(id => map.value.get(id)).filter(Boolean) as PackageNode[]
  const dependencies = (pkg: PackageNode): PackageNode[] => getList(pkg.dependencies)
  const dependents = (pkg: PackageNode): PackageNode[] => getList(pkg.dependents)
  const flatDependencies = (pkg: PackageNode): PackageNode[] => getList(pkg.flatDependencies)
  const flatDependents = (pkg: PackageNode): PackageNode[] => getList(pkg.flatDependents)
  const flatClusters = (pkg: PackageNode): string[] => [...pkg.flatClusters]
  const isInDepCluster = (pkg: PackageNode, cluster: string): boolean => pkg.clusters.has(`dep:${cluster}`) || pkg.flatClusters.has(`dep:${cluster}`)

  return reactive({
    packages,
    map,
    versions,
    get,
    has,
    getList,
    dependencies,
    dependents,
    flatDependencies,
    flatDependents,
    flatClusters,
    isInDepCluster,
  })
}

const main = createComputedPayload(() => [...(rawPayload.value?.packages.values() ?? [])])
const excludedIds = computed(() => {
  const result = new Set<string>()
  for (const pkg of main.packages) {
    if (filters.state.excludeWorkspace && pkg.workspace)
      result.add(pkg.packageId)
    if (filtersExplicitExcludePredicate(pkg)) {
      result.add(pkg.packageId)
      for (const dependency of pkg.flatDependencies)
        result.add(dependency)
    }
  }
  return result
})
const available = createComputedPayload(() => main.packages.filter(pkg => !excludedIds.value.has(pkg.packageId)))
const filtered = createComputedPayload(() => available.packages.filter(filterSelectPredicate.value))
const workspace = createComputedPayload(() => main.packages.filter(pkg => pkg.workspace))
const excluded = createComputedPayload(() => main.packages.filter(pkg => excludedIds.value.has(pkg.packageId)))
const compareA = createComputedPayload(() => {
  const ids = dependencyClosure(filters.state.compareA ?? [])
  return available.packages.filter(pkg => ids.has(pkg.packageId))
})
const compareB = createComputedPayload(() => {
  const ids = dependencyClosure(filters.state.compareB ?? [])
  return available.packages.filter(pkg => ids.has(pkg.packageId))
})

export const payloads = { main, available, filtered, workspace, excluded, compareA, compareB }

export const totalSourceSize = computed(() => available.packages.reduce(
  (total, pkg) => total + (pkg.resolved.sourceSize?.bytes ?? 0),
  0,
))

export function dependencyClosure(ids: Iterable<string>): Set<string> {
  const result = new Set<string>()
  for (const id of ids) {
    const pkg = available.get(id)
    if (!pkg)
      continue
    result.add(pkg.packageId)
    for (const dependency of pkg.flatDependencies)
      result.add(dependency)
  }
  return result
}
