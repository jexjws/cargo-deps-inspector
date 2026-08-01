<script setup lang="ts">
import { filters } from '../../state/filters'
</script>

<template>
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div i-ph-network-slash-duotone flex-none />
      <div>排除项</div>
      <div flex-auto />
      <button btn-action :disabled="filters.exclude.activated.length === 0" @click="filters.exclude.reset()">
        <div i-ph-trash-simple-duotone />
        重置
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
      在 crate 详情中可排除指定 crate 及其引入的依赖。
    </div>
    <OptionItem title="排除工作区成员" description="保留第三方依赖，只隐藏 workspace crate">
      <OptionCheckbox v-model="filters.state.excludeWorkspace" />
    </OptionItem>
  </div>
</template>
