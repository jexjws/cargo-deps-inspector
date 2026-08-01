<script setup lang="ts">
import type { CargoDependencyKind, CargoPackageSourceKind, PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'
import { useRoute } from '#app/composables/router'
import { payloads } from '../../state/payload'

type GridTab = 'depth' | 'source' | 'kind' | 'licenses' | 'editions' | 'targets'
interface Group {
  name: string
  packages: PackageNode[]
  source?: CargoPackageSourceKind
  kind?: CargoDependencyKind
  expanded?: boolean
}

const params = useRoute().params as Record<string, string[] | string>
const tab = computed<GridTab>(() => {
  const value = Array.isArray(params.grid) ? params.grid[0] : params.grid
  return (value as GridTab) || 'depth'
})
const location = window.location
const MAX_DEPTH = 5

function groupBy(getKeys: (pkg: PackageNode) => string[], expanded = false): Group[] {
  const map = new Map<string, PackageNode[]>()
  for (const pkg of payloads.filtered.packages) {
    const keys = getKeys(pkg)
    for (const key of keys.length ? keys : ['<未声明>'])
      map.set(key, [...(map.get(key) ?? []), pkg])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, packages]) => ({ name, packages, expanded }))
}

const groups = computed<Group[]>(() => {
  if (tab.value === 'source')
    return groupBy(pkg => [pkg.sourceKind], true).map(group => ({ ...group, source: group.name as CargoPackageSourceKind }))
  if (tab.value === 'kind') {
    return groupBy(pkg => [...pkg.flatClusters].filter(value => value.startsWith('dep:')).map(value => value.slice(4)), true)
      .map(group => ({ ...group, kind: group.name as CargoDependencyKind }))
  }
  if (tab.value === 'licenses')
    return groupBy(pkg => [pkg.metadata.license || '<未声明>'])
  if (tab.value === 'editions')
    return groupBy(pkg => [pkg.metadata.edition], true)
  if (tab.value === 'targets')
    return groupBy(pkg => [...new Set(pkg.metadata.targets.flatMap(target => target.kind))])

  const map = new Map<number, PackageNode[]>()
  for (const pkg of payloads.filtered.packages) {
    const depth = Math.min(pkg.depth, MAX_DEPTH)
    map.set(depth, [...(map.get(depth) ?? []), pkg])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([depth, packages]) => ({
      name: depth === 0 ? 'Workspace crates' : depth === MAX_DEPTH ? `深度 ${depth}+` : `深度 ${depth}`,
      packages,
      expanded: depth < 3,
    }))
})

const tabs = [
  { path: 'depth', label: '深度', icon: 'i-ph-stack-simple-duotone' },
  { path: 'source', label: '来源', icon: 'i-ph-database-duotone' },
  { path: 'kind', label: '依赖类型', icon: 'i-ph-git-branch-duotone' },
  { path: 'licenses', label: '许可证', icon: 'i-ph-scales-duotone' },
  { path: 'editions', label: 'Edition', icon: 'i-ph-calendar-dots-duotone' },
  { path: 'targets', label: 'Targets', icon: 'i-ph-crosshair-duotone' },
]
</script>

<template>
  <div flex="~ col gap-2">
    <div flex="~ gap-2 items-center wrap" mb4>
      <div op-fade>
        分组方式
      </div>
      <NuxtLink
        v-for="item of tabs"
        :key="item.path"
        btn-action as="button"
        :to="{ path: `/grid/${item.path}`, hash: location.hash }"
        active-class="text-primary bg-primary:5"
      >
        <div :class="item.icon" />{{ item.label }}
      </NuxtLink>
    </div>

    <GridExpand v-for="group of groups" :key="group.name" :packages="group.packages" :module-value="group.expanded">
      <template #title>
        <div flex="~ items-center gap-1">
          <span v-if="group.source" badge-color-primary rounded-full px2 font-mono text-sm>{{ group.source }}</span>
          <span v-else-if="group.kind" badge-color-cyan rounded-full px2 font-mono text-sm>{{ group.kind }}</span>
          <span v-else op75>{{ group.name }}</span>
        </div>
        <DisplayNumberBadge :number="group.packages.length" rounded-full ml2 text-base />
      </template>
    </GridExpand>
  </div>
</template>
