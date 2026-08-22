<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from '#app/composables/router'
import { NuxtLink } from '#components'
import ReportDeprecated from '../../components/report/Deprecated.vue'
import ReportEngines from '../../components/report/Engines.vue'
import ReportFunding from '../../components/report/Funding.vue'
import ReportInstallSize from '../../components/report/InstallSize.vue'
import ReportLicenses from '../../components/report/Licenses.vue'
import ReportMaintainerActions from '../../components/report/MaintainerActions.vue'
import ReportMultipleVersions from '../../components/report/MultipleVersions.vue'
import ReportPublishTime from '../../components/report/PublishTime.vue'
import ReportTransitiveDeps from '../../components/report/TransitiveDeps.vue'
import ReportUsedBy from '../../components/report/UsedBy.vue'
import ReportVulnerability from '../../components/report/Vulnerability.vue'

const location = window.location
const { t } = useI18n()
const params = useRoute().params as Record<string, string[] | string>
const selected = computed(() => {
  const value = Array.isArray(params.report) ? params.report[0] : params.report
  return value || 'all'
})
const tabs = computed(() => [
  { path: 'dependencies', label: t('reports.relationships'), icon: 'i-ph-link-simple-duotone' },
  { path: 'source-size', label: t('reports.sourceSize'), icon: 'i-ph-hard-drives-duotone' },
  { path: 'duplicates', label: t('reports.duplicates'), icon: 'i-ph-copy-duotone' },
  { path: 'licenses', label: t('reports.licenses'), icon: 'i-ph-scales-duotone' },
  { path: 'audit', label: 'RustSec', icon: 'i-ph-shield-warning-duotone' },
  { path: 'outdated', label: t('reports.outdated'), icon: 'i-ph-clock-counter-clockwise-duotone' },
  { path: '', label: t('reports.all'), icon: 'i-ph-grid-four-duotone' },
])
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
