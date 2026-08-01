<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { computed, ref } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const selected = ref<string[]>([])
const groups = computed(() => {
  const map = new Map<string, PackageNode[]>()
  for (const pkg of payloads.filtered.packages) {
    const license = pkg.metadata.license || '<未声明>'
    map.set(license, [...(map.get(license) ?? []), pkg])
  }
  return [...map].sort((a, b) => b[1].length - a[1].length)
})
const filtered = computed(() => groups.value.filter(([license]) => selected.value.includes(license)).flatMap(([, packages]) => packages))
function toggle(license: string) {
  selected.value = selected.value.includes(license)
    ? selected.value.filter(value => value !== license)
    : [...selected.value, license]
}
function toggleAll() {
  selected.value = selected.value.length ? [] : groups.value.map(([license]) => license)
}
</script>

<template>
  <ReportExpendableContainer v-if="groups.length" :list="[]" title="许可证声明">
    <div grid="~ cols-2 gap-4">
      <div>
        <div pb4 pt1>
          <button btn-action @click="toggleAll()">
            {{ selected.length ? '取消全选' : '选择全部' }}
          </button>
        </div>
        <div flex="~ col gap-y-1">
          <button v-for="group of groups" :key="group[0]" text-left hover:bg-active px2 ml--2 rounded flex="~ gap-2 items-center" :class="{ 'text-primary': selected.includes(group[0]) }" @click="toggle(group[0])">
            <OptionCheckbox :model-value="selected.includes(group[0])" pointer-events-none /><span>{{ group[0] }}</span><DisplayNumberBadge :number="group[1].length" rounded-full text-sm w-max mra />
          </button>
        </div>
      </div>
      <div border="l base" pl4>
        <div v-if="!filtered.length" text-center py10 px5 op-fade italic>
          从左侧选择许可证以查看 crate
        </div>
        <div v-else grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1 items-center">
          <div text-sm op-fade>
            许可证
          </div><div text-sm op-fade>
            来源
          </div><div />
          <template v-for="pkg of filtered" :key="pkg.packageId">
            <span badge-color-gray px2 rounded-full text-sm>{{ pkg.metadata.license || '<未声明>' }}</span><DisplaySourceTypeBadge :pkg />
            <button font-mono text-left hover:bg-active px2 ml--2 rounded @click="selectedNode = pkg">
              <DisplayPackageSpec :pkg />
            </button>
          </template>
        </div>
      </div>
    </div>
  </ReportExpendableContainer>
  <UiEmptyState v-else title="没有许可证信息" message="当前筛选结果中没有 crate" />
</template>
