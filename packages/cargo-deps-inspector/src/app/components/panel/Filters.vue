<script setup lang="ts">
import { filters } from '../../state/filters'
</script>

<template>
  <div>
    <div p4 flex="~ gap-2 items-center">
      <button
        btn-action :disabled="filters.select.activated.length === 0"
        @click="filters.select.reset()"
      >
        <div i-ph-funnel-x-duotone />
        重置筛选
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
          placeholder="按名称、版本、作者、许可证或关键字筛选"
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
