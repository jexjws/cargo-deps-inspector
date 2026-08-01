import type { CargoMetadata, CargoMetadataPackage } from './types'
import { describe, expect, it } from 'vitest'
import { populateDependencyGraph } from './graph'
import { parseCargoMetadata } from './metadata'

const A = 'path+file:///workspace/a#0.1.0'
const B = 'registry+https://github.com/rust-lang/crates.io-index#dep-b@1.2.0'
const C = 'git+https://example.test/dep-c#0.3.0'

function pkg(id: string, name: string, source: string | null, dependencies: CargoMetadataPackage['dependencies'] = []): CargoMetadataPackage {
  return {
    id,
    name,
    version: id === B ? '1.2.0' : id === C ? '0.3.0' : '0.1.0',
    source,
    dependencies,
    targets: [],
    features: {},
    manifest_path: `/workspace/${name}/Cargo.toml`,
    metadata: null,
    license: 'MIT',
    license_file: null,
    description: null,
    publish: null,
    authors: [],
    categories: [],
    default_run: null,
    rust_version: null,
    keywords: [],
    readme: null,
    repository: null,
    homepage: null,
    documentation: null,
    edition: '2024',
    links: null,
  }
}

function metadata(): CargoMetadata {
  return {
    version: 1,
    workspace_root: '/workspace',
    target_directory: '/workspace/target',
    workspace_members: [A],
    workspace_default_members: [A],
    metadata: null,
    packages: [
      pkg(A, 'root-a', null, [{
        name: 'dep-b',
        source: 'registry+https://github.com/rust-lang/crates.io-index',
        req: '^1.0',
        kind: 'dev',
        rename: 'renamed_dep',
        optional: true,
        uses_default_features: false,
        features: ['derive'],
        target: 'cfg(unix)',
        registry: null,
      }]),
      pkg(B, 'dep-b', 'registry+https://github.com/rust-lang/crates.io-index', [{
        name: 'dep-c',
        source: 'git+https://example.test/dep-c',
        req: '*',
        kind: null,
        rename: null,
        optional: false,
        uses_default_features: true,
        features: [],
        target: null,
        registry: null,
      }]),
      pkg(C, 'dep-c', 'git+https://example.test/dep-c'),
    ],
    resolve: {
      root: A,
      nodes: [
        { id: A, dependencies: [B], features: ['default'], deps: [{ name: 'renamed_dep', pkg: B, dep_kinds: [{ kind: 'dev', target: 'cfg(unix)' }] }] },
        { id: B, dependencies: [C], features: [], deps: [{ name: 'dep_c', pkg: C, dep_kinds: [{ kind: null, target: null }] }] },
        { id: C, dependencies: [], features: [], deps: [] },
      ],
    },
  }
}

describe('parseCargoMetadata', () => {
  it('keeps opaque package ids and Cargo edge semantics', () => {
    const result = populateDependencyGraph(parseCargoMetadata(metadata(), { cargoVersion: 'cargo 1.97.1' }))
    const root = result.packages.get(A)!
    const dependency = result.packages.get(B)!
    const transitive = result.packages.get(C)!

    expect(root.enabledFeatures).toEqual(['default'])
    expect(root.dependencyEdges.get(B)).toEqual([{
      name: 'renamed_dep',
      packageId: B,
      kind: 'dev',
      target: 'cfg(unix)',
      requirement: '^1.0',
      optional: true,
      usesDefaultFeatures: false,
      requestedFeatures: ['derive'],
    }])
    expect(dependency.sourceKind).toBe('registry')
    expect(transitive.sourceKind).toBe('git')
    expect([root.depth, dependency.depth, transitive.depth]).toEqual([0, 1, 2])
    expect(transitive.flatClusters).toEqual(new Set(['dep:normal', 'dep:dev', 'target:cfg(unix)']))
  })

  it('prunes by depth without leaving dangling edges', () => {
    const result = parseCargoMetadata(metadata(), { depth: 1 })
    expect([...result.packages.keys()]).toEqual([A, B])
    expect(result.packages.get(B)?.dependencies.size).toBe(0)
  })

  it('removes subgraphs disconnected by a traverse filter', () => {
    const result = parseCargoMetadata(metadata(), { traverseFilter: node => node.packageId !== B })
    expect([...result.packages.keys()]).toEqual([A])
  })

  it('rejects metadata created with --no-deps', () => {
    expect(() => parseCargoMetadata({ ...metadata(), resolve: null })).toThrow(/--no-deps/)
  })
})
