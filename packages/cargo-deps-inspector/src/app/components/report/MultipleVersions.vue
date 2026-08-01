<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { computed, nextTick } from 'vue'
import { useRouter } from '#app/composables/router'
import { selectedNode } from '../../state/current'
import { filters } from '../../state/filters'
import { payloads } from '../../state/payload'
import { compareSemver } from '../../utils/semver'

const router = useRouter()
const duplicated = computed(() => [...payloads.filtered.versions.values()]
  .filter(packages => packages.length > 1)
  .map(packages => [...packages].sort((a, b) => compareSemver(a.version, b.version)))
  .sort((a, b) => b.length - a.length))

function showGraph(packages: PackageNode[]) {
  filters.state.focus = null
  filters.state.why = packages.map(pkg => pkg.packageId)
  selectedNode.value = packages[0]
  nextTick(() => router.push({ path: '/graph', hash: location.hash }))
}
</script>

<template>
  <template v-if="duplicated.length">
    <UiSubTitle>重复版本 crate <DisplayNumberBadge :number="duplicated.length" rounded-full text-sm /></UiSubTitle>
    <div badge-color-primary flex="~ gap-2 items-center" rounded-lg p2 my2 px3>
      <div i-ph-lightbulb-duotone /><span>Cargo 可能因版本约束或来源不同保留多个版本；请结合反向依赖判断是否能够统一约束。</span>
    </div>
    <div grid="~ cols-minmax-200px gap-4">
      <div v-for="packages of duplicated" :key="packages[0]!.name" border="~ base rounded-lg" bg-glass flex="~ col" :class="selectedNode && packages.includes(selectedNode) ? 'border-primary ring-4 ring-primary:20' : ''">
        <div flex="~ items-center gap-2" border="b base" px2 py1>
          <h2 font-mono flex-auto pl2>
            {{ packages[0]!.name }}
          </h2>
          <button v-tooltip="'在图谱中比较'" p1 rounded-full op-fade hover:bg-active hover:text-primary hover:op100 @click="showGraph(packages)">
            <div i-ph-graph-duotone text-lg />
          </button>
        </div>
        <div flex="~ col gap-1" p2>
          <button v-for="pkg of packages" :key="pkg.packageId" px2 rounded flex="~ items-center gap-2" font-mono hover="bg-active" :class="selectedNode === pkg ? 'bg-active' : ''" @click="selectedNode = pkg">
            <span op75 flex-auto text-left>v{{ pkg.version }}</span><DisplaySourceTypeBadge :pkg />
          </button>
        </div>
      </div>
    </div>
  </template>
  <UiEmptyState v-else type="checkmark" title="没有重复版本" message="当前依赖图中每个 crate 只有一个已解析版本" />
</template>
