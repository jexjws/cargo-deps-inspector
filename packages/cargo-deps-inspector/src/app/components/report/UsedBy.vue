<script setup lang="ts">
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const packages = computed(() => payloads.filtered.packages
  .filter(pkg => payloads.available.flatDependents(pkg).length)
  .sort((a, b) => payloads.available.flatDependents(b).length - payloads.available.flatDependents(a).length))
</script>

<template>
  <ReportExpendableContainer v-if="packages.length" :list="packages" :title="['被依赖最多', '被依赖最少']">
    <template #default="{ items }">
      <div grid="~ cols-[1fr_max-content_max-content] gap-x-4 gap-y-1 items-center">
        <div /><div text-sm op-fade>
          直接
        </div><div text-sm op-fade>
          传递
        </div>
        <template v-for="pkg of items" :key="pkg.packageId">
          <button font-mono text-left hover:bg-active px2 ml--2 rounded flex="~ gap-2 items-center" @click="selectedNode = pkg">
            <DisplaySourceTypeBadge :pkg /><DisplayPackageSpec :pkg />
          </button>
          <DisplayNumberBadge :number="payloads.available.dependents(pkg).length" rounded-full text-sm />
          <DisplayNumberBadge :number="payloads.available.flatDependents(pkg).length" rounded-full text-sm color="badge-color-primary" />
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
  <UiEmptyState v-else title="没有反向依赖" message="当前筛选结果中没有被其他 crate 使用的依赖" />
</template>
