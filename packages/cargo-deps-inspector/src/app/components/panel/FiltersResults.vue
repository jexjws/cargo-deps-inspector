<script setup lang="ts">
import DisplayNumberBadge from '@antfu/design/components/Display/DisplayNumberBadge.vue'
import { payloads } from '../../state/payload'
import UiPercentageModuleType from '../ui/PercentageModuleType.vue'
</script>

<template>
  <div border="t base">
    <div flex="~ gap-2 items-center" p4 pb0>
      <div i-ph-chart-bar-duotone flex-none />
      {{ $t('filters.resultsTitle') }}
    </div>
    <div p3 flex="~ col gap-2 ">
      <div flex="~ items-center gap-2">
        <i18n-t keypath="filters.results" tag="span" op-fade>
          <template #filtered>
            <DisplayNumberBadge :number="payloads.filtered.packages.length" rounded-full color="badge-color-primary" inline-flex op100 />
          </template>
          <template #total>
            <DisplayNumberBadge :number="payloads.available.packages.length" rounded-full inline-flex op100 />
          </template>
        </i18n-t>
      </div>
      <div v-if="payloads.excluded.packages.length" flex="~ items-center gap-1" text-0.85rem>
        <span op-mute>(</span>
        <span op-fade>{{ $t('filters.excludedCount', { count: payloads.excluded.packages.length }) }}</span>
        <span op-mute>)</span>
      </div>
    </div>
  </div>
</template>
