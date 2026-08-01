<script setup lang="ts">
import { filters } from '../../state/filters'
import { query } from '../../state/query'
</script>

<template>
  <div v-if="filters.select.activated.length" bg-glass rounded-3xl border border-base shadow flex="~ items-center">
    <button relative pl2 pr1 @click="query.selected = '~filters'">
      <div i-ph-funnel-duotone text-xl op-fade />
      <div absolute top--2 right--2 w-4 h-4 bg-primary-600 shadow text-white rounded-full flex text-0.6rem>
        <span ma line-height-none>{{ filters.select.activated.length }}</span>
      </div>
    </button>
    <div v-if="filters.state.search" border="l base" flex="~ gap-1 items-center" px2 max-w-44>
      <div i-ph-text-t-duotone flex-none />
      <span truncate>{{ filters.state.search }}</span>
    </div>
    <div v-if="filters.state.sourceKinds?.length" border="l base" flex="~ gap-1 items-center" px2 font-mono text-sm>
      {{ filters.state.sourceKinds.join(', ') }}
    </div>
    <div v-if="filters.state.dependencyKinds?.length" border="l base" flex="~ gap-1 items-center" px2 font-mono text-sm>
      {{ filters.state.dependencyKinds.join(', ') }}
    </div>
    <button v-tooltip="'清除筛选'" w8 h8 rounded-full hover:bg-active op-fade hover:op100 flex="~ items-center justify-center" @click="filters.select.reset()">
      <div i-ph-x />
    </button>
  </div>
</template>
