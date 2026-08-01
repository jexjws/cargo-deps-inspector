<script setup lang="ts">
import type { CargoDependencyKind } from 'cargo-deps-tools'
import { computed } from 'vue'
import { filters } from '../../state/filters'

const kinds: { value: CargoDependencyKind, label: string, classes: string }[] = [
  { value: 'normal', label: 'normal', classes: 'badge-color-green' },
  { value: 'dev', label: 'dev', classes: 'badge-color-cyan' },
  { value: 'build', label: 'build', classes: 'badge-color-amber' },
]

function modelFor(value: CargoDependencyKind) {
  return computed({
    get: () => filters.state.dependencyKinds == null || filters.state.dependencyKinds.includes(value),
    set(active: boolean) {
      const current = new Set(filters.state.dependencyKinds ?? kinds.map(item => item.value))
      if (active)
        current.add(value)
      else
        current.delete(value)
      filters.state.dependencyKinds = current.size === kinds.length ? null : [...current]
    },
  })
}

const models = Object.fromEntries(kinds.map(item => [item.value, modelFor(item.value)]))
</script>

<template>
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div i-ph-git-branch-duotone flex-none />
      <div>
        <div>依赖类型</div>
        <div op-fade text-sm mt--0.5>
          normal、dev 与 build 依赖
        </div>
      </div>
    </div>
    <div flex="~ gap-4 wrap" mt1>
      <label v-for="kind of kinds" :key="kind.value" flex="~ gap-1 items-center" select-none>
        <OptionCheckbox v-model="models[kind.value]!.value" />
        <span :class="[kind.classes, models[kind.value]!.value ? '' : 'saturate-0 op75']" rounded-full px2 text-sm font-mono>
          {{ kind.label }}
        </span>
      </label>
    </div>
  </div>
</template>
