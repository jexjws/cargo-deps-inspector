<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import { settings } from '../../state/settings'

defineProps<{ pkg: PackageNode }>()
</script>

<template>
  <UiPackageBorder
    :pkg
    as="button"
    outer="crate-card border rounded-lg"
    inner="flex flex-col gap-2 justify-center h-full hover:bg-active p2 px3"
    @click="selectedNode = pkg === selectedNode ? undefined : pkg"
  >
    <div flex="~ gap-2 items-center" text-left>
      <DisplayPackageSpec :pkg />
    </div>
    <div flex="~ wrap gap-2 items-center" text-sm>
      <DisplaySourceTypeBadge :pkg />
      <DisplayDependencyKindsBadge v-if="settings.showDependencyKindBadge !== 'none'" :pkg />
      <DisplayNumberBadge
        v-if="payloads.available.flatDependents(pkg).length"
        :number="payloads.available.flatDependents(pkg).length"
        icon="i-ph-arrow-elbow-down-right-duotone text-xs"
        rounded-full text-sm
      />
      <DisplayNumberBadge
        v-if="payloads.available.flatDependencies(pkg).length"
        :number="payloads.available.flatDependencies(pkg).length"
        icon="i-ph-lego-duotone text-xs"
        rounded-full text-sm
      />
      <DisplayFileSizeBadge
        v-if="settings.showSourceSizeBadge && pkg.resolved.sourceSize?.bytes"
        :bytes="pkg.resolved.sourceSize.bytes"
        :digits="0"
        rounded-full text-sm
      />
    </div>
  </UiPackageBorder>
</template>
