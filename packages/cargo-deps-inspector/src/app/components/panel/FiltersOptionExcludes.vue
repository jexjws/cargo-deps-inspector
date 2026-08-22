<script setup lang="ts">
import FormCheckbox from '@antfu/design/components/Form/FormCheckbox.vue'
import { filters } from '../../state/filters'
import OptionItem from '../option/Item.vue'
</script>

<template>
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div i-ph-network-slash-duotone flex-none />
      <div>{{ $t('filters.excludeTitle') }}</div>
      <div flex-auto />
      <button btn-action :disabled="filters.exclude.activated.length === 0" @click="filters.exclude.reset()">
        <div i-ph-trash-simple-duotone />
        {{ $t('common.reset') }}
      </button>
    </div>
    <div v-if="filters.state.excludes?.length" flex="~ gap-2 wrap">
      <div v-for="spec of filters.state.excludes" :key="spec" badge-color-purple rounded-full px2 pl3 py0.5 flex="~ gap-1 items-center" max-w-full>
        <div font-mono text-sm truncate>
          {{ spec }}
        </div>
        <button op-fade hover:op100 @click="filters.excludes.toggle(spec, false)">
          <div i-ph-x />
        </button>
      </div>
    </div>
    <div v-else op-fade text-sm italic>
      {{ $t('filters.noExclusions') }}
    </div>
    <OptionItem :title="$t('filters.excludeWorkspace')" :description="$t('filters.excludeWorkspaceDescription')">
      <OptionCheckbox v-model="filters.state.excludeWorkspace" />
    </OptionItem>
  </div>
</template>
