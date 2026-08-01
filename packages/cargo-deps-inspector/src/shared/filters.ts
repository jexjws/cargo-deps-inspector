import type { CargoDependencyKind, CargoPackageSourceKind } from 'cargo-deps-tools'

export interface FilterOptions {
  search: string
  sourceKinds: CargoPackageSourceKind[] | null
  dependencyKinds: CargoDependencyKind[] | null
  depths: (number | string)[] | null
  focus: string[] | null
  why: string[] | null
  excludes: string[] | null
  excludeWorkspace: boolean
  compareA: string[] | null
  compareB: string[] | null
}

export interface FilterSchema<Type> {
  type: StringConstructor | ArrayConstructor | BooleanConstructor
  default: Type
  category: 'select' | 'exclude' | 'compare' | 'option'
}

export const FILTERS_SCHEMA: { [Key in keyof FilterOptions]: FilterSchema<FilterOptions[Key]> } = {
  search: { type: String, default: '', category: 'select' },
  sourceKinds: { type: Array, default: null, category: 'select' },
  dependencyKinds: { type: Array, default: null, category: 'select' },
  depths: { type: Array, default: null, category: 'select' },
  focus: { type: Array, default: null, category: 'select' },
  why: { type: Array, default: null, category: 'select' },
  excludes: { type: Array, default: null, category: 'exclude' },
  excludeWorkspace: { type: Boolean, default: false, category: 'exclude' },
  compareA: { type: Array, default: [], category: 'compare' },
  compareB: { type: Array, default: [], category: 'compare' },
}
