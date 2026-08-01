import type { SettingsOptions } from '../../shared/types'
import { useLocalStorage } from '@vueuse/core'

export const SETTINGS_DEFAULT: SettingsOptions = {
  graphRender: 'normal',
  deepDependenciesTree: true,
  dependenciesGroupBy: 'kind',
  packageDetailsTab: 'dependencies',
  colorizePackageSize: true,
  showSourceSizeBadge: true,
  showDependencyKindBadge: 'all',
  showFileComposition: true,
  chartColoringMode: 'source',
  chartMetric: 'source-size',
  collapseSidepanel: false,
  chartAnimation: true,
}

export const settings = useLocalStorage<SettingsOptions>(
  'cargo-deps-inspector-settings',
  { ...SETTINGS_DEFAULT },
  { deep: true, mergeDefaults: true },
)
