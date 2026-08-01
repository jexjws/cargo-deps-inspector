import type {
  CargoDependencyEdge,
  CargoDependencyKind,
  CargoMetadata,
  CargoMetadataDependency,
  CargoPackageSourceKind,
  ListPackageDependenciesRawResult,
  PackageNodeRaw,
  ParseCargoMetadataOptions,
} from './types'
import { dirname } from 'pathe'
import { dependencyKindToCluster } from './constants'

function assertCargoMetadata(value: unknown): asserts value is CargoMetadata {
  const metadata = value as Partial<CargoMetadata> | null
  if (!metadata || metadata.version !== 1 || !Array.isArray(metadata.packages) || !Array.isArray(metadata.workspace_members))
    throw new TypeError('Invalid cargo metadata JSON: expected Cargo metadata format version 1')
  if (!metadata.resolve || !Array.isArray(metadata.resolve.nodes))
    throw new TypeError('Invalid cargo metadata JSON: resolved dependencies are missing (do not use --no-deps)')
  if (typeof metadata.workspace_root !== 'string' || typeof metadata.target_directory !== 'string')
    throw new TypeError('Invalid cargo metadata JSON: workspace paths are missing')
}

function sourceKindOf(pkg: { source: string | null }, workspace: boolean): CargoPackageSourceKind {
  if (workspace)
    return 'workspace'
  if (pkg.source === null)
    return 'path'
  if (pkg.source.startsWith('registry+') || pkg.source.startsWith('sparse+'))
    return 'registry'
  if (pkg.source.startsWith('git+'))
    return 'git'
  return 'unknown'
}

function normalizeDependencyName(name: string): string {
  return name.replaceAll('-', '_')
}

function cargoKind(kind: 'dev' | 'build' | null): CargoDependencyKind {
  return kind ?? 'normal'
}

function findDeclaration(
  declarations: CargoMetadataDependency[],
  edgeName: string,
  kind: CargoDependencyKind,
  target: string | null,
): CargoMetadataDependency | undefined {
  const normalizedEdgeName = normalizeDependencyName(edgeName)
  return declarations.find((dependency) => {
    const name = normalizeDependencyName(dependency.rename ?? dependency.name)
    return name === normalizedEdgeName
      && cargoKind(dependency.kind) === kind
      && dependency.target === target
  }) ?? declarations.find((dependency) => {
    return normalizeDependencyName(dependency.rename ?? dependency.name) === normalizedEdgeName
      && cargoKind(dependency.kind) === kind
  })
}

function createEdge(
  name: string,
  packageId: string,
  kind: CargoDependencyKind,
  target: string | null,
  declaration: CargoMetadataDependency | undefined,
): CargoDependencyEdge {
  return {
    name,
    packageId,
    kind,
    target,
    requirement: declaration?.req,
    optional: declaration?.optional,
    usesDefaultFeatures: declaration?.uses_default_features,
    requestedFeatures: declaration?.features,
  }
}

export function parseCargoMetadata(
  input: unknown,
  options: ParseCargoMetadataOptions = {},
): ListPackageDependenciesRawResult {
  assertCargoMetadata(input)
  const metadata = input
  const packageById = new Map(metadata.packages.map(pkg => [pkg.id, pkg]))
  const resolveById = new Map(metadata.resolve!.nodes.map(node => [node.id, node]))
  const workspaceMembers = new Set(metadata.workspace_members)
  const activeIds = new Set([...resolveById.keys(), ...workspaceMembers])
  const packages = new Map<string, PackageNodeRaw>()

  for (const id of activeIds) {
    const pkg = packageById.get(id)
    if (!pkg)
      continue
    const workspace = workspaceMembers.has(id)
    const node: PackageNodeRaw = {
      spec: id,
      packageId: id,
      name: pkg.name,
      version: pkg.version,
      filepath: dirname(pkg.manifest_path),
      manifestPath: pkg.manifest_path,
      source: pkg.source,
      sourceKind: sourceKindOf(pkg, workspace),
      workspace,
      dependencies: new Set(),
      dependencyEdges: new Map(),
      clusters: new Set(),
      metadata: pkg,
      enabledFeatures: [...(resolveById.get(id)?.features ?? [])].sort(),
    }
    if (options.traverseFilter?.(node) !== false)
      packages.set(id, node)
  }

  for (const [id, node] of packages) {
    if (options.dependenciesFilter?.(node) === false)
      continue
    const resolved = resolveById.get(id)
    if (!resolved)
      continue
    for (const dependency of resolved.deps) {
      const targetNode = packages.get(dependency.pkg)
      if (!targetNode)
        continue
      const edges = dependency.dep_kinds.length
        ? dependency.dep_kinds.map(({ kind: rawKind, target }) => {
            const kind = cargoKind(rawKind)
            const declaration = findDeclaration(node.metadata.dependencies, dependency.name, kind, target)
            return createEdge(dependency.name, dependency.pkg, kind, target, declaration)
          })
        : [createEdge(dependency.name, dependency.pkg, 'normal', null, undefined)]

      node.dependencies.add(dependency.pkg)
      node.dependencyEdges.set(dependency.pkg, edges)
      for (const edge of edges) {
        targetNode.clusters.add(dependencyKindToCluster(edge.kind))
        if (edge.target)
          targetNode.clusters.add(`target:${edge.target}`)
      }
    }
  }

  // Filters may disconnect subgraphs that still exist in Cargo's resolve
  // array. Keep only nodes reachable from a retained workspace member.
  const maxDepth = options.depth !== undefined && Number.isFinite(options.depth)
    ? Math.max(0, options.depth)
    : Number.POSITIVE_INFINITY
  const reached = new Set<string>()
  const pending = metadata.workspace_members
    .filter(id => packages.has(id))
    .map(id => ({ id, depth: 0 }))
  while (pending.length) {
    const current = pending.shift()!
    if (reached.has(current.id) || current.depth > maxDepth)
      continue
    reached.add(current.id)
    if (current.depth === maxDepth)
      continue
    const node = packages.get(current.id)
    if (node)
      pending.push(...[...node.dependencies].map(id => ({ id, depth: current.depth + 1 })))
  }
  for (const id of packages.keys()) {
    if (!reached.has(id))
      packages.delete(id)
  }
  for (const node of packages.values()) {
    for (const id of node.dependencies) {
      if (!packages.has(id)) {
        node.dependencies.delete(id)
        node.dependencyEdges.delete(id)
      }
    }
  }

  return {
    root: metadata.workspace_root,
    cargoVersion: options.cargoVersion,
    targetDirectory: metadata.target_directory,
    workspaceMembers: metadata.workspace_members.filter(id => packages.has(id)),
    cargoMetadata: metadata,
    packages,
  }
}
