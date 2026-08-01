<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ pkg: PackageNode, mode?: 'badge' | 'text' | 'both' }>()
const { t } = useI18n()
const meta = computed(() => ({
  workspace: { label: 'workspace', title: t('source.workspace'), classes: 'badge-color-lime' },
  path: { label: 'path', title: t('source.path'), classes: 'badge-color-cyan' },
  registry: { label: 'registry', title: t('source.registry'), classes: 'badge-color-primary' },
  git: { label: 'git', title: t('source.git'), classes: 'badge-color-purple' },
  unknown: { label: 'unknown', title: t('source.unknown'), classes: 'badge-color-gray' },
}[props.pkg.sourceKind]))
</script>

<template>
  <div v-tooltip="meta.title" :class="meta.classes" px2 rounded-full text-sm font-mono>
    {{ meta.label }}
  </div>
</template>
