import type { PackageNode } from 'cargo-deps-tools'
import { describe, expect, it } from 'vitest'
import { computeSourceSizes } from './sizes'

function pkg(name: string, bytes: number, workspace = false): PackageNode {
  return {
    name,
    version: '1.0.0',
    spec: `${name}@1.0.0`,
    packageId: `${name}@1.0.0`,
    source: workspace ? null : 'registry+test',
    sourceKind: workspace ? 'workspace' : 'registry',
    workspace,
    resolved: { sourceSize: { bytes, files: 2, categories: { rust: { bytes, count: 2 } } } },
  } as unknown as PackageNode
}

describe('computeSourceSizes', () => {
  it('sorts descending and excludes workspace crates by default', () => {
    const result = computeSourceSizes([pkg('small', 10), pkg('workspace', 100, true), pkg('large', 50)])
    expect(result.map(entry => entry.name)).toEqual(['large', 'small'])
  })

  it('supports workspace crates and result limits', () => {
    const result = computeSourceSizes([pkg('a', 10), pkg('workspace', 100, true)], { includeWorkspace: true, limit: 1 })
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('workspace')
  })
})
