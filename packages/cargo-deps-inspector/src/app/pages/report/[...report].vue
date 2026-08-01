<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app/composables/router'

const location = window.location
const params = useRoute().params as Record<string, string[] | string>
const selected = computed(() => {
  const value = Array.isArray(params.report) ? params.report[0] : params.report
  return value || 'all'
})
const tabs = [
  { path: 'dependencies', label: '依赖关系', icon: 'i-ph-link-simple-duotone' },
  { path: 'source-size', label: '源码体积', icon: 'i-ph-hard-drives-duotone' },
  { path: 'duplicates', label: '重复版本', icon: 'i-ph-copy-duotone' },
  { path: 'licenses', label: '许可证', icon: 'i-ph-scales-duotone' },
  { path: 'audit', label: 'RustSec', icon: 'i-ph-shield-warning-duotone' },
  { path: 'outdated', label: '过期依赖', icon: 'i-ph-clock-counter-clockwise-duotone' },
  { path: '', label: '全部', icon: 'i-ph-grid-four-duotone' },
]
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <NuxtLink v-for="tab of tabs" :key="tab.path" btn-action as="button" :to="{ path: `/report${tab.path ? `/${tab.path}` : ''}`, hash: location.hash }" active-class="text-primary bg-primary:5">
      <div :class="tab.icon" />{{ tab.label }}
    </NuxtLink>
  </div>
  <ReportTransitiveDeps v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportUsedBy v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportInstallSize v-if="selected === 'source-size' || selected === 'all'" />
  <ReportMultipleVersions v-if="selected === 'duplicates' || selected === 'all'" />
  <ReportLicenses v-if="selected === 'licenses' || selected === 'all'" />
  <ReportAudit v-if="selected === 'audit' || selected === 'all'" />
  <ReportOutdated v-if="selected === 'outdated' || selected === 'all'" />
</template>
