<script setup lang="ts">
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const packages = computed(() => payloads.filtered.packages
  .filter(pkg => pkg.resolved.sourceSize?.bytes)
  .sort((a, b) => (b.resolved.sourceSize?.bytes ?? 0) - (a.resolved.sourceSize?.bytes ?? 0)))
</script>

<template>
  <ReportExpendableContainer v-if="packages.length" :list="packages" :title="$t('reports.largestSource')">
    <template #default="{ items }">
      <div grid="~ cols-[1fr_max-content_1fr] gap-x-4 gap-y-1 items-center">
        <div /><div text-sm op-fade>
          {{ $t('reports.sourceSize') }}
        </div><div text-sm op-fade>
          {{ $t('reports.fileComposition') }}
        </div>
        <template v-for="pkg of items" :key="pkg.packageId">
          <button font-mono text-left hover:bg-active px2 ml--2 rounded @click="selectedNode = pkg">
            <DisplayPackageSpec :pkg />
          </button>
          <DisplayFileSizeBadge :bytes="pkg.resolved.sourceSize!.bytes" rounded-full text-sm />
          <UiPercentageSourceCategories :pkg />
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
  <UiEmptyState v-else :title="$t('reports.noSourceSize')" :message="$t('reports.noSourceSizeMessage')" />
</template>
