<script setup lang="ts">
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const packages = computed(() => payloads.filtered.packages
  .filter(pkg => payloads.available.flatDependencies(pkg).length)
  .sort((a, b) => payloads.available.flatDependencies(b).length - payloads.available.flatDependencies(a).length))
</script>

<template>
  <ReportExpendableContainer v-if="packages.length" :list="packages" :title="['传递依赖最多', '传递依赖最少']">
    <template #default="{ items }">
      <div grid="~ cols-[1fr_max-content_max-content_max-content] gap-x-4 gap-y-1 items-center">
        <div /><div text-sm op-fade>
          直接
        </div><div text-sm op-fade>
          传递
        </div><div text-sm op-fade>
          来源
        </div>
        <template v-for="pkg of items" :key="pkg.packageId">
          <button font-mono text-left hover:bg-active px2 ml--2 rounded @click="selectedNode = pkg">
            <DisplayPackageSpec :pkg />
          </button>
          <DisplayNumberBadge :number="payloads.available.dependencies(pkg).length" rounded-full text-sm />
          <DisplayNumberBadge :number="payloads.available.flatDependencies(pkg).length" rounded-full text-sm color="badge-color-primary" />
          <DisplaySourceTypeBadge :pkg />
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
  <UiEmptyState v-else title="没有传递依赖" message="当前筛选结果中没有含传递依赖的 crate" />
</template>
