<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import type { GraphBase, GraphBaseOptions } from 'nanovis'
import { useTemplateRef, watchEffect } from 'vue'

const props = defineProps<{
  graph: GraphBase<PackageNode | undefined, GraphBaseOptions<PackageNode | undefined>>
}>()

const el = useTemplateRef<HTMLDivElement>('el')

watchEffect(() => el.value?.append(props.graph.el))
</script>

<template>
  <div ref="el" data-a11y-skip />
</template>
