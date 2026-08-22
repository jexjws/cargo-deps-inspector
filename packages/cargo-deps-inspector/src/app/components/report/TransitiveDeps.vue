<script setup lang="ts">
import DisplayNumberBadge from '@antfu/design/components/Display/DisplayNumberBadge.vue'
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import DisplayPackageSpec from '../display/PackageSpec.vue'
import UiEmptyState from '../ui/EmptyState.vue'
import UiPercentageModuleType from '../ui/PercentageModuleType.vue'
import ReportExpendableContainer from './ExpendableContainer.vue'

const packages = computed(() => payloads.filtered.packages
  .filter(pkg => payloads.available.flatDependencies(pkg).length)
  .sort((a, b) => payloads.available.flatDependencies(b).length - payloads.available.flatDependencies(a).length))
</script>

<template>
  <ReportExpendableContainer v-if="packages.length" :list="packages" :title="[$t('reports.mostTransitive'), $t('reports.leastTransitive')]">
    <template #default="{ items }">
      <div grid="~ cols-[1fr_max-content_max-content_max-content] gap-x-4 gap-y-1 items-center">
        <div /><div text-sm op-fade>
          {{ $t('reports.direct') }}
        </div><div text-sm op-fade>
          {{ $t('reports.transitive') }}
        </div><div text-sm op-fade>
          {{ $t('reports.source') }}
        </div>
        <template v-for="pkg of items" :key="pkg.packageId">
          <button font-mono text-left hover:bg-active px2 ml--2 rounded @click="selectedNode = pkg">
            <DisplayPackageSpec :pkg />
          </button>
          <DisplayNumberBadge :number="payloads.available.dependencies(pkg).length" rounded-full text-sm />
          <DisplayNumberBadge :number="payloads.available.flatDependencies(pkg).length" rounded-full text-sm color="badge-color-primary" />
          <DisplaySourceTypeBadge :pkg />
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
  <UiEmptyState v-else :title="$t('reports.noTransitive')" :message="$t('reports.noTransitiveMessage')" />
</template>
