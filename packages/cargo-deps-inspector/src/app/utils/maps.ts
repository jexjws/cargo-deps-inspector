import type { PackageNode } from 'cargo-deps-tools'

export function buildVersionToPackagesMap(packages: PackageNode[]) {
  const map = new Map<string, PackageNode[]>()
  for (const pkg of packages) {
    if (!map.has(pkg.name))
      map.set(pkg.name, [])
    map.get(pkg.name)!.push(pkg)
  }
  return map
}
