<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { selectedNode } from '../../state/current'

withDefaults(defineProps<{ pkg?: PackageNode, showSourceType?: boolean }>(), { showSourceType: true })
</script>

<template>
  <button v-if="pkg" flex="~ gap-2 items-center" ws-nowrap rounded hover="bg-active" @click="selectedNode = pkg">
    <slot name="before" />
    <DisplaySourceTypeBadge v-if="showSourceType" :pkg />
    <DisplayPackageSpec :pkg />
    <slot name="after" />
  </button>
</template>
