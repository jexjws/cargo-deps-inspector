<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchAudit, rawAudit } from '../../state/data'

const loading = ref(false)
const findings = computed(() => rawAudit.value?.status === 'ready'
  ? [...rawAudit.value.data.vulnerabilities.list, ...Object.values(rawAudit.value.data.warnings).flat()]
  : [])

async function refresh(force = false) {
  loading.value = true
  try {
    await fetchAudit(force)
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
      RustSec 安全审计
      <DisplayNumberBadge v-if="findings.length" :number="findings.length" rounded-full text-sm color="badge-color-red" />
      <button ml-a btn-action :disabled="loading" @click="refresh(true)">
        <div i-ph-arrows-clockwise-duotone :class="loading ? 'animate-spin' : ''" />重新审计
      </button>
    </UiSubTitle>
    <div v-if="!rawAudit" border="~ base rounded-xl" bg-glass p5 op-fade>
      {{ loading ? '正在运行 cargo audit…' : '当前后端没有提供安全审计数据。' }}
    </div>
    <div v-else-if="rawAudit.status !== 'ready'" border="~ base rounded-xl" bg-glass p5 flex="~ col gap-2">
      <div flex="~ gap-2 items-center" :class="rawAudit.status === 'error' ? 'text-red' : 'text-amber'">
        <div i-ph-warning-duotone />{{ rawAudit.message }}
      </div>
      <code v-if="rawAudit.status === 'missing'" badge-color-gray rounded px2 py1 w-max>{{ rawAudit.installCommand }}</code>
    </div>
    <UiEmptyState v-else-if="!findings.length" type="checkmark" title="未发现 RustSec 问题" message="cargo-audit 未报告漏洞或警告" />
    <div v-else grid="~ cols-minmax-320px gap-3">
      <article v-for="finding of findings" :key="`${finding.advisory.id}:${finding.package.name}`" border="~ base rounded-xl" bg-glass p4 flex="~ col gap-2">
        <div flex="~ gap-2 items-center">
          <code text-red>{{ finding.advisory.id }}</code><strong>{{ finding.advisory.title }}</strong>
        </div>
        <div font-mono>
          {{ finding.package.name }}@{{ finding.package.version }}
        </div>
        <p v-if="finding.advisory.description" op-fade text-sm line-clamp-4>
          {{ finding.advisory.description }}
        </p>
        <div v-if="finding.versions?.patched?.length" text-sm>
          <span op-fade>已修复版本：</span><code>{{ finding.versions.patched.join(', ') }}</code>
        </div>
        <a v-if="finding.advisory.url" :href="finding.advisory.url" target="_blank" text-primary hover:underline text-sm>查看公告</a>
      </article>
    </div>
  </div>
</template>
