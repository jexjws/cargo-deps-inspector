<script setup lang="ts">
import type { CargoFileCategory, PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'

const props = defineProps<{ pkg: PackageNode }>()

const labels: Record<CargoFileCategory, string> = {
  rust: 'Rust',
  manifest: 'Manifest',
  docs: 'Docs',
  tests: 'Tests',
  examples: 'Examples',
  benches: 'Benches',
  assets: 'Assets',
  build: 'Build',
  other: 'Other',
}
const classes: Record<CargoFileCategory, string> = {
  rust: 'badge-color-primary',
  manifest: 'badge-color-amber',
  docs: 'badge-color-cyan',
  tests: 'badge-color-green',
  examples: 'badge-color-lime',
  benches: 'badge-color-orange',
  assets: 'badge-color-purple',
  build: 'badge-color-red',
  other: 'badge-color-gray',
}

const nodes = computed(() => Object.entries(props.pkg.resolved.sourceSize?.categories ?? {})
  .filter((entry): entry is [CargoFileCategory, { bytes: number, count: number }] => Boolean(entry[1]?.bytes))
  .sort((a, b) => b[1].bytes - a[1].bytes)
  .map(([category, info]) => ({
    name: labels[category],
    value: info.bytes,
    class: classes[category],
    title: `${labels[category]}: ${info.count} files`,
  })))
</script>

<template>
  <UiPercentage v-if="nodes.length" :nodes :percentage="false" />
</template>
