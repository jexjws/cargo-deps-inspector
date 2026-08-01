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
      {{ $t('reports.auditTitle') }}
      <DisplayNumberBadge v-if="findings.length" :number="findings.length" rounded-full text-sm color="badge-color-red" />
      <button ml-a btn-action :disabled="loading" @click="refresh(true)">
        <div i-ph-arrows-clockwise-duotone :class="loading ? 'animate-spin' : ''" />{{ $t('reports.auditAgain') }}
      </button>
    </UiSubTitle>
    <div v-if="!rawAudit" border="~ base rounded-xl" bg-glass p5 op-fade>
      {{ loading ? $t('reports.auditRunning') : $t('reports.auditUnavailable') }}
    </div>
    <div v-else-if="rawAudit.status !== 'ready'" border="~ base rounded-xl" bg-glass p5 flex="~ col gap-2">
      <div flex="~ gap-2 items-center" :class="rawAudit.status === 'error' ? 'text-red' : 'text-amber'">
        <div i-ph-warning-duotone />{{ rawAudit.message }}
      </div>
      <code v-if="rawAudit.status === 'missing'" badge-color-gray rounded px2 py1 w-max>{{ rawAudit.installCommand }}</code>
    </div>
    <UiEmptyState v-else-if="!findings.length" type="checkmark" :title="$t('reports.auditClean')" :message="$t('reports.auditCleanMessage')" />
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
          <span op-fade>{{ $t('reports.patchedVersions') }}</span><code>{{ finding.versions.patched.join(', ') }}</code>
        </div>
        <a v-if="finding.advisory.url" :href="finding.advisory.url" target="_blank" text-primary hover:underline text-sm>{{ $t('reports.viewAdvisory') }}</a>
      </article>
    </div>
  </div>
</template>
