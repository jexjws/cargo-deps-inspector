<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchOutdated, rawOutdated } from '../../state/data'

const loading = ref(false)
const entries = computed(() => rawOutdated.value?.status === 'ready' ? rawOutdated.value.data : [])
async function refresh(force = false) {
  loading.value = true
  try {
    await fetchOutdated(force)
  }
  finally {
    loading.value = false
  }
}
onMounted(() => refresh())
</script>

<template>
  <div>
    <UiSubTitle>
      过期依赖
      <DisplayNumberBadge v-if="entries.length" :number="entries.length" rounded-full text-sm color="badge-color-amber" />
      <button ml-a btn-action :disabled="loading" @click="refresh(true)">
        <div i-ph-arrows-clockwise-duotone :class="loading ? 'animate-spin' : ''" />重新检查
      </button>
    </UiSubTitle>
    <div v-if="!rawOutdated" border="~ base rounded-xl" bg-glass p5 op-fade>
      {{ loading ? '正在运行 cargo outdated…' : '当前后端没有提供过期依赖数据。' }}
    </div>
    <div v-else-if="rawOutdated.status !== 'ready'" border="~ base rounded-xl" bg-glass p5 flex="~ col gap-2">
      <div flex="~ gap-2 items-center" :class="rawOutdated.status === 'error' ? 'text-red' : 'text-amber'">
        <div i-ph-warning-duotone />{{ rawOutdated.message }}
      </div>
      <code v-if="rawOutdated.status === 'missing'" badge-color-gray rounded px2 py1 w-max>{{ rawOutdated.installCommand }}</code>
    </div>
    <UiEmptyState v-else-if="!entries.length" type="checkmark" title="依赖均为最新" message="cargo-outdated 未发现可更新项" />
    <ReportExpendableContainer v-else :list="entries" title="可更新的 Cargo 依赖" :reversable="false">
      <template #default="{ items }">
        <div grid="~ cols-[1fr_max-content_max-content_max-content_max-content] gap-x-4 gap-y-1 items-center font-mono">
          <div text-sm op-fade>
            Crate
          </div><div text-sm op-fade>
            当前
          </div><div text-sm op-fade>
            兼容
          </div><div text-sm op-fade>
            最新
          </div><div text-sm op-fade>
            类型
          </div>
          <template v-for="entry of items" :key="`${entry.workspace}:${entry.name}:${entry.kind}`">
            <span>{{ entry.name }}</span><span op-fade>{{ entry.project }}</span><span text-cyan>{{ entry.compat }}</span><span text-primary>{{ entry.latest }}</span><span badge-color-gray px2 rounded text-sm>{{ entry.kind || 'normal' }}</span>
          </template>
        </div>
      </template>
    </ReportExpendableContainer>
  </div>
</template>
