import { satisfies } from 'verkit'

export interface PackageNodeLike {
  name: string
  version: string
}

/**
 * Construct a filter to match a Cargo package name.
 *
 * - serde@1.0.0 -> Exact match
 * - serde or serde@* -> Any version of the crate
 * - tokio@^1.0 -> Any version matching the range
 * - cargo-* -> Any crate matching the wildcard
 */
export function constructPackageFilter(range: string): (pkg: PackageNodeLike) => boolean {
  const separator = range.lastIndexOf('@')
  const name = separator > 0 ? range.slice(0, separator) : range
  const version = separator > 0 ? range.slice(separator + 1) || '*' : '*'
  const hasWildcard = name?.includes('*')
  const nameMatch = hasWildcard
    ? new RegExp(`^${name.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
    : name

  return (pkg) => {
    const isNameMatch = nameMatch instanceof RegExp ? nameMatch.test(pkg.name) : pkg.name === name
    let isVersionMatch = version === '*' || pkg.version === version
    if (!isVersionMatch) {
      try {
        isVersionMatch = satisfies(pkg.version, version)
      }
      catch {
        isVersionMatch = false
      }
    }
    return isNameMatch && isVersionMatch
  }
}

export function constructPackageFilters<Node extends PackageNodeLike = PackageNodeLike>(
  ranges: (string | ((pkg: Node) => boolean)) [],
  mode: 'some' | 'every',
): (pkg: Node) => boolean {
  const filters = ranges.map(x => typeof x === 'string' ? constructPackageFilter(x) : x)
  return pkg => mode === 'some'
    ? filters.some(filter => filter(pkg))
    : filters.every(filter => filter(pkg))
}
