import type {
  ListPackageDependenciesBaseResult,
  ListPackageDependenciesRawResult,
  PackageNodeBase,
} from './types'

export function populateDependencyGraph(input: ListPackageDependenciesRawResult): ListPackageDependenciesBaseResult {
  const packages = new Map<string, PackageNodeBase>()

  for (const [id, pkg] of input.packages) {
    packages.set(id, Object.assign(pkg, {
      dependents: new Set<string>(),
      depth: Number.POSITIVE_INFINITY,
      shallowestDependent: undefined,
      flatDependencies: new Set<string>(),
      flatDependents: new Set<string>(),
      flatClusters: new Set(pkg.clusters),
    }) as PackageNodeBase)
  }

  for (const pkg of packages.values()) {
    for (const dependencyId of pkg.dependencies)
      packages.get(dependencyId)?.dependents.add(pkg.spec)
  }

  const queue: PackageNodeBase[] = []
  for (const id of input.workspaceMembers) {
    const root = packages.get(id)
    if (!root)
      continue
    root.depth = 0
    queue.push(root)
  }

  while (queue.length) {
    const current = queue.shift()!
    for (const dependencyId of current.dependencies) {
      const dependency = packages.get(dependencyId)
      if (!dependency)
        continue
      const nextDepth = current.depth + 1
      if (nextDepth < dependency.depth) {
        dependency.depth = nextDepth
        dependency.shallowestDependent = new Set([current.spec])
        queue.push(dependency)
      }
      else if (nextDepth === dependency.depth) {
        dependency.shallowestDependent ||= new Set()
        dependency.shallowestDependent.add(current.spec)
      }
    }
  }

  for (const pkg of packages.values()) {
    const seen = new Set<string>()
    const pending = [...pkg.dependencies]
    while (pending.length) {
      const dependencyId = pending.pop()!
      if (seen.has(dependencyId))
        continue
      seen.add(dependencyId)
      pkg.flatDependencies.add(dependencyId)
      const dependency = packages.get(dependencyId)
      if (dependency)
        pending.push(...dependency.dependencies)
    }
  }

  for (const pkg of packages.values()) {
    for (const dependencyId of pkg.flatDependencies)
      packages.get(dependencyId)?.flatDependents.add(pkg.spec)
  }

  let clustersChanged = true
  while (clustersChanged) {
    clustersChanged = false
    for (const pkg of packages.values()) {
      for (const dependencyId of pkg.dependencies) {
        const dependency = packages.get(dependencyId)
        if (!dependency)
          continue
        for (const cluster of pkg.flatClusters) {
          if (!dependency.flatClusters.has(cluster)) {
            dependency.flatClusters.add(cluster)
            clustersChanged = true
          }
        }
      }
    }
  }

  return { ...input, packages }
}
