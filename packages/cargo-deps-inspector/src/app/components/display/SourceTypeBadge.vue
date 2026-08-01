<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'

const props = defineProps<{ pkg: PackageNode, mode?: 'badge' | 'text' | 'both' }>()
const meta = computed(() => ({
  workspace: { label: 'workspace', title: 'Cargo 工作区成员', classes: 'badge-color-lime' },
  path: { label: 'path', title: '本地路径依赖', classes: 'badge-color-cyan' },
  registry: { label: 'registry', title: '注册表依赖', classes: 'badge-color-primary' },
  git: { label: 'git', title: 'Git 依赖', classes: 'badge-color-purple' },
  unknown: { label: 'unknown', title: '未知来源', classes: 'badge-color-gray' },
}[props.pkg.sourceKind]))
</script>

<template>
  <div v-tooltip="meta.title" :class="meta.classes" px2 rounded-full text-sm font-mono>
    {{ meta.label }}
  </div>
</template>
