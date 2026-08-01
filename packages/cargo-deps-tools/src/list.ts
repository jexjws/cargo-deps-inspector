import type { CargoMetadata, ListPackageDependenciesOptions, ListPackageDependenciesResult } from './types'
import pLimit from 'p-limit'
import { x } from 'tinyexec'
import { populateDependencyGraph } from './graph'
import { parseCargoMetadata } from './metadata'
import { getPackageSourceSize } from './size'

export function buildCargoMetadataArgs(options: ListPackageDependenciesOptions): string[] {
  if (options.allFeatures && options.noDefaultFeatures)
    throw new Error('--all-features and --no-default-features cannot be used together')
  if (options.allFeatures && options.features?.length)
    throw new Error('--all-features and --features cannot be used together')

  const args = ['metadata', '--format-version=1', '--color=never']
  if (options.manifestPath)
    args.push('--manifest-path', options.manifestPath)
  if (options.allFeatures)
    args.push('--all-features')
  else if (options.features?.length)
    args.push('--features', options.features.join(','))
  if (options.noDefaultFeatures)
    args.push('--no-default-features')
  if (options.filterPlatform)
    args.push('--filter-platform', options.filterPlatform)
  if (options.frozen) {
    args.push('--frozen')
  }
  else {
    if (options.locked !== false)
      args.push('--locked')
    if (options.offline)
      args.push('--offline')
  }
  return args
}

export async function getCargoVersion(options: Pick<ListPackageDependenciesOptions, 'cargoPath' | 'cwd'>): Promise<string | undefined> {
  try {
    const result = await x(options.cargoPath ?? 'cargo', ['--version'], {
      throwOnError: true,
      nodeOptions: { cwd: options.cwd },
    })
    return result.stdout.trim()
  }
  catch {
    return undefined
  }
}

export async function readCargoMetadata(options: ListPackageDependenciesOptions): Promise<CargoMetadata> {
  const cargoPath = options.cargoPath ?? 'cargo'
  try {
    const result = await x(cargoPath, buildCargoMetadataArgs(options), {
      throwOnError: true,
      nodeOptions: { cwd: options.cwd },
    })
    return JSON.parse(result.stdout) as CargoMetadata
  }
  catch (error: any) {
    const details = error?.stderr || error?.output?.stderr || error?.message || String(error)
    const hint = options.locked !== false
      ? '\nCargo Deps Inspector uses --locked by default and will not create or update Cargo.lock. Run Cargo once to update the lockfile, or pass --no-locked explicitly.'
      : ''
    throw new Error(`Failed to run cargo metadata: ${details}${hint}`, { cause: error })
  }
}

export async function listPackageDependencies(options: ListPackageDependenciesOptions): Promise<ListPackageDependenciesResult> {
  const [metadata, cargoVersion] = await Promise.all([
    readCargoMetadata(options),
    getCargoVersion(options),
  ])
  const raw = parseCargoMetadata(metadata, { ...options, cargoVersion })
  const base = populateDependencyGraph(raw) as ListPackageDependenciesResult
  const limit = pLimit(12)
  await Promise.all([...base.packages.values()].map(pkg => limit(async () => {
    pkg.resolved = { sourceSize: await getPackageSourceSize(pkg) }
  })))
  return base
}
