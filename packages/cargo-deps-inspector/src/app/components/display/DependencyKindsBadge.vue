<script setup lang="ts">
import type { CargoDependencyKind, PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const kinds = computed<CargoDependencyKind[]>(() => {
  const result = new Set<CargoDependencyKind>()
  for (const cluster of props.pkg.flatClusters) {
    if (cluster === 'dep:normal' || cluster === 'dep:dev' || cluster === 'dep:build')
      result.add(cluster.slice(4) as CargoDependencyKind)
  }
  return [...result].filter(kind => settings.value.showDependencyKindBadge === 'all' || settings.value.showDependencyKindBadge === kind)
})

const classes: Record<CargoDependencyKind, string> = {
  normal: 'badge-color-green',
  dev: 'badge-color-cyan',
  build: 'badge-color-amber',
}
</script>

<template>
  <div flex="~ gap-1 items-center">
    <span
      v-for="kind of kinds"
      :key="kind"
      :class="classes[kind]"
      rounded-full px2 text-sm font-mono
    >
      {{ kind }}
    </span>
  </div>
</template>
