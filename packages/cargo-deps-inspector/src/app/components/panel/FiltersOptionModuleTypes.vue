<script setup lang="ts">
import type { CargoPackageSourceKind } from 'cargo-deps-tools'
import { computed } from 'vue'
import { filters } from '../../state/filters'

const sources: { value: CargoPackageSourceKind, label: string, classes: string }[] = [
  { value: 'workspace', label: 'Workspace', classes: 'badge-color-lime' },
  { value: 'path', label: 'Path', classes: 'badge-color-cyan' },
  { value: 'registry', label: 'Registry', classes: 'badge-color-primary' },
  { value: 'git', label: 'Git', classes: 'badge-color-purple' },
  { value: 'unknown', label: 'Unknown', classes: 'badge-color-gray' },
]

function modelFor(value: CargoPackageSourceKind) {
  return computed({
    get: () => filters.state.sourceKinds == null || filters.state.sourceKinds.includes(value),
    set(active: boolean) {
      const current = new Set(filters.state.sourceKinds ?? sources.map(item => item.value))
      if (active)
        current.add(value)
      else
        current.delete(value)
      filters.state.sourceKinds = current.size === sources.length ? null : [...current]
    },
  })
}

const models = Object.fromEntries(sources.map(item => [item.value, modelFor(item.value)]))
</script>

<template>
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div i-ph-database-duotone flex-none />
      <div>
        <div>{{ $t('filters.sourceTitle') }}</div>
        <div op-fade text-sm mt--0.5>
          {{ $t('filters.sourceDescription') }}
        </div>
      </div>
    </div>
    <div flex="~ gap-x-4 gap-y-2 wrap" mt1>
      <label v-for="source of sources" :key="source.value" flex="~ gap-1 items-center" select-none>
        <OptionCheckbox v-model="models[source.value]!.value" />
        <span :class="[source.classes, models[source.value]!.value ? '' : 'saturate-0 op75']" rounded-full px2 text-sm font-mono>
          {{ source.label }}
        </span>
      </label>
    </div>
  </div>
</template>
