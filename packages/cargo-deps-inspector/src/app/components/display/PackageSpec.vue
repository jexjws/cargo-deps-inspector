<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'

defineProps<{
  pkg: PackageNode
}>()
</script>

<template>
  <span>
    <span
      v-if="pkg.workspace"
      h-1em w-1.5em relative of-visible inline-block
    >
      <div
        title="Workspace Package"
        i-catppuccin-folder-packages-open icon-catppuccin mr2 absolute left-0 top-0
      />
    </span>
    <DisplayPackageName
      :name="pkg.name"
      :pkg="pkg"
    />
    <DisplayVersion
      color-base
      :version="pkg.version"
      prefix="@"
      op-fade
    />
    <slot />
  </span>
</template>
