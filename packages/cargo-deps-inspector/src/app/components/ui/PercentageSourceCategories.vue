<script setup lang="ts">
import type { CargoFileCategory, PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ pkg: PackageNode }>()
const { t } = useI18n()
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
    name: t(`sourceCategory.${category}`),
    value: info.bytes,
    class: classes[category],
    title: `${t(`sourceCategory.${category}`)}: ${t('common.files', { count: info.count })}`,
  })))
</script>

<template>
  <UiPercentage v-if="nodes.length" :nodes :percentage="false" />
</template>
