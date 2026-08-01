export type CargoFileCategory
  = | 'rust'
    | 'manifest'
    | 'docs'
    | 'tests'
    | 'examples'
    | 'benches'
    | 'assets'
    | 'build'
    | 'other'

export interface PackageSourceSizeInfo {
  bytes: number
  files: number
  categories: Partial<Record<CargoFileCategory, { bytes: number, count: number }>>
}
