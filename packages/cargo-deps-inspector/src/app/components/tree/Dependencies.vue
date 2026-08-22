<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'
import DisplayClusterBadge from '../display/ClusterBadge.vue'
import RenderNextTick from '../RenderNextTick'
import TreeDependencies from './Dependencies.vue'
import TreeItem from './Item.vue'

const props = withDefaults(defineProps<{
  currents?: PackageNode[]
  list?: PackageNode[]
  type: 'dependencies' | 'dependents'
  seen?: string[]
  depth?: number
  maxDepth?: number
  groupBy?: 'none' | 'source' | 'kind'
}>(), { depth: 1, maxDepth: 6, groupBy: 'none' })

const seen = computed(() => [...(props.seen ?? []), ...(props.currents?.map(pkg => pkg.packageId) ?? [])])
const tree = computed(() => props.currents?.filter(Boolean).map(pkg => ({
  pkg,
  children: props.list?.filter((candidate) => {
    if (seen.value.includes(candidate.packageId))
      return false
    return props.type === 'dependents' ? candidate.dependencies.has(pkg.packageId) : pkg.dependencies.has(candidate.packageId)
  }),
})).sort((a, b) => (b.children?.length ?? 0) - (a.children?.length ?? 0)))

const groups = computed(() => {
  if (props.groupBy === 'none' || props.depth !== 1)
    return null
  const map = new Map<string, PackageNode[]>()
  for (const pkg of props.currents ?? []) {
    const keys = props.groupBy === 'source'
      ? [pkg.sourceKind]
      : [...pkg.flatClusters].filter(value => value.startsWith('dep:')).map(value => value.slice(4))
    for (const key of keys.length ? keys : ['other'])
      map.set(key, [...(map.get(key) ?? []), pkg])
  }
  return [...map].map(([key, packages]) => ({ key, packages }))
})
</script>

<template>
  <div flex="~ col gap-1">
    <template v-if="groups">
      <div v-for="group of groups" :key="group.key" flex="~ col gap-1">
        <div op-fade text-sm mt2 mb1 font-mono>
          {{ group.key }}
        </div>
        <TreeDependencies :currents="group.packages" :list :type :seen :depth :max-depth group-by="none" />
      </div>
    </template>
    <template v-else>
      <template v-for="entry of tree" :key="entry.pkg.packageId">
        <TreeItem :pkg="entry.pkg" />
        <template v-if="entry.children?.length">
          <RenderNextTick v-if="depth < maxDepth">
            <TreeDependencies ml4 :currents="entry.children" :list :type :seen :depth="depth + 1" :max-depth />
          </RenderNextTick>
          <div v-else-if="maxDepth > 2" ml6>
            <span op-fade px2 bg-active rounded text-sm>{{ $t('tree.more', { count: entry.children.length }) }}</span>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
