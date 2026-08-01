export type CargoDependencyKind = 'normal' | 'dev' | 'build'

export interface CargoMetadataDependency {
  name: string
  source: string | null
  req: string
  kind: 'dev' | 'build' | null
  rename: string | null
  optional: boolean
  uses_default_features: boolean
  features: string[]
  target: string | null
  path?: string
  registry: string | null
}

export interface CargoMetadataTarget {
  'kind': string[]
  'crate_types': string[]
  'name': string
  'src_path': string
  'edition': string
  'required-features'?: string[]
  'doc': boolean
  'doctest': boolean
  'test': boolean
}

export interface CargoMetadataPackage {
  name: string
  version: string
  id: string
  license: string | null
  license_file: string | null
  description: string | null
  source: string | null
  dependencies: CargoMetadataDependency[]
  targets: CargoMetadataTarget[]
  features: Record<string, string[]>
  manifest_path: string
  metadata: Record<string, unknown> | null
  publish: string[] | null
  authors: string[]
  categories: string[]
  default_run: string | null
  rust_version: string | null
  keywords: string[]
  readme: string | null
  repository: string | null
  homepage: string | null
  documentation: string | null
  edition: string
  links: string | null
}

export interface CargoMetadataResolveDepKind {
  kind: 'dev' | 'build' | null
  target: string | null
}

export interface CargoMetadataResolveDep {
  name: string
  pkg: string
  dep_kinds: CargoMetadataResolveDepKind[]
}

export interface CargoMetadataResolveNode {
  id: string
  dependencies: string[]
  deps: CargoMetadataResolveDep[]
  features: string[]
}

export interface CargoMetadata {
  packages: CargoMetadataPackage[]
  workspace_members: string[]
  workspace_default_members: string[]
  resolve: {
    nodes: CargoMetadataResolveNode[]
    root: string | null
  } | null
  target_directory: string
  workspace_root: string
  metadata: Record<string, unknown> | null
  version: 1
}
