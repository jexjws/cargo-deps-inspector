import { describe, expect, it } from 'vitest'
import { buildCargoMetadataArgs } from './list'

const base = { cwd: '/workspace' }

describe('buildCargoMetadataArgs', () => {
  it('uses format v1 and --locked by default', () => {
    expect(buildCargoMetadataArgs(base)).toEqual([
      'metadata',
      '--format-version=1',
      '--color=never',
      '--locked',
    ])
  })

  it('forwards feature, target and offline resolution options', () => {
    expect(buildCargoMetadataArgs({
      ...base,
      manifestPath: 'crates/app/Cargo.toml',
      features: ['cli', 'serde'],
      noDefaultFeatures: true,
      filterPlatform: 'x86_64-unknown-linux-gnu',
      offline: true,
    })).toEqual([
      'metadata',
      '--format-version=1',
      '--color=never',
      '--manifest-path',
      'crates/app/Cargo.toml',
      '--features',
      'cli,serde',
      '--no-default-features',
      '--filter-platform',
      'x86_64-unknown-linux-gnu',
      '--locked',
      '--offline',
    ])
  })

  it('lets --frozen replace --locked and --offline', () => {
    expect(buildCargoMetadataArgs({ ...base, frozen: true, locked: false, offline: true }).slice(-1)).toEqual(['--frozen'])
  })

  it('rejects incompatible feature selectors', () => {
    expect(() => buildCargoMetadataArgs({ ...base, allFeatures: true, features: ['cli'] })).toThrow(/all-features/)
    expect(() => buildCargoMetadataArgs({ ...base, allFeatures: true, noDefaultFeatures: true })).toThrow(/all-features/)
  })
})
