<script setup lang="ts">
import { filters } from '../../state/filters'
import OptionItem from '../option/Item.vue'
import OptionSelectGroup from '../option/SelectGroup.vue'
import PanelFiltersOptionClusters from './FiltersOptionClusters.vue'
import PanelFiltersOptionDepth from './FiltersOptionDepth.vue'
import PanelFiltersOptionFocus from './FiltersOptionFocus.vue'
import PanelFiltersOptionModuleTypes from './FiltersOptionModuleTypes.vue'
import PanelFiltersOptionWhy from './FiltersOptionWhy.vue'
import PanelFiltersResults from './FiltersResults.vue'
</script>

<template>
  <div>
    <div p4 flex="~ gap-2 items-center">
      <button
        btn-action :disabled="filters.select.activated.length === 0"
        @click="filters.select.reset()"
      >
        <div i-ph-funnel-x-duotone />
        {{ $t('filters.reset') }}
      </button>
    </div>

    <div flex="~ col gap-4" border="t base">
      <label
        p4 flex-none h-full
        flex="~ items-center gap-1.5"
        hover:bg-active
      >
        <div i-ph-text-t-duotone text-lg :class="filters.state.search ? 'text-primary' : 'op-fade'" flex-none />
        <input
          v-model="filters.state.search"
          :placeholder="$t('filters.searchPlaceholder')"
          w-full bg-transparent outline-none
        >
        <button
          w-6 h-6 rounded-full hover:bg-active flex
          :class="filters.state.search ? '' : 'op0'"
          @click="filters.state.search = ''"
        >
          <div i-ph-x ma op-fade />
        </button>
      </label>
    </div>

    <PanelFiltersOptionModuleTypes />
    <PanelFiltersOptionClusters />

    <PanelFiltersOptionFocus />
    <PanelFiltersOptionWhy />
    <PanelFiltersOptionDepth />
    <PanelFiltersResults />
  </div>
</template>
