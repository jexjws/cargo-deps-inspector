import type { CargoMetadata } from 'cargo-deps-tools'
import { describe, expect, it } from 'vitest'
import { createSnapshot, payloadFromImport } from './snapshot'

const PACKAGE_ID = 'path+file:///workspace/root#root@0.1.0'

function metadata(): CargoMetadata {
  return {
    version: 1,
    workspace_root: '/workspace',
    target_directory: '/workspace/target',
    workspace_members: [PACKAGE_ID],
    workspace_default_members: [PACKAGE_ID],
    metadata: null,
    packages: [{
      id: PACKAGE_ID,
      name: 'root',
      version: '0.1.0',
      source: null,
      dependencies: [],
      targets: [],
      features: {},
      manifest_path: '/workspace/root/Cargo.toml',
      metadata: null,
      license: 'MIT',
      license_file: null,
      description: 'Snapshot fixture',
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
    }],
    resolve: {
      root: PACKAGE_ID,
      nodes: [{ id: PACKAGE_ID, dependencies: [], features: ['default'], deps: [] }],
    },
  }
}

describe('cargo import snapshots', () => {
  it('imports raw cargo metadata v1', () => {
    const { payload, snapshot } = payloadFromImport(metadata())

    expect(snapshot).toBeUndefined()
    expect(payload.packages.get(PACKAGE_ID)?.name).toBe('root')
    expect(payload.workspaceMembers).toEqual([PACKAGE_ID])
  })

  it('round-trips source sizes through an enhanced snapshot', () => {
    const source = payloadFromImport(metadata()).payload
    const pkg = source.packages.get(PACKAGE_ID)!
    pkg.resolved.sourceSize = {
      bytes: 42,
      files: 1,
      categories: { rust: { bytes: 42, count: 1 } },
    }

    const snapshot = createSnapshot(source, { generatorVersion: 'test' })
    const imported = payloadFromImport(snapshot)

    expect(snapshot.metadata.workspace_root).toBe('/workspace')
    expect(imported.snapshot).toBe(snapshot)
    expect(imported.payload.packages.get(PACKAGE_ID)?.resolved.sourceSize?.bytes).toBe(42)
  })

  it('rejects unrelated JSON documents', () => {
    expect(() => payloadFromImport({ packages: [] })).toThrow(/cargo metadata/)
  })
})
