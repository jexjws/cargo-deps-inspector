<script setup lang="ts">
import { getBackend } from '../../backends'
import { fetchData } from '../../state/data'
import { settings } from '../../state/settings'

const backend = getBackend()
</script>

<template>
  <div>
    <div flex="~ col gap-2" p4>
      <OptionItem :title="$t('settings.sourceSize')" :description="$t('settings.sourceSizeDescription')">
        <OptionCheckbox v-model="settings.showSourceSizeBadge" />
      </OptionItem>
      <OptionItem :title="$t('settings.colorBySize')" :description="$t('settings.colorBySizeDescription')">
        <OptionCheckbox v-model="settings.colorizePackageSize" />
      </OptionItem>
      <OptionItem :title="$t('settings.dependencyBadges')" :description="$t('settings.dependencyBadgesDescription')">
        <OptionSelectGroup v-model="settings.showDependencyKindBadge" :options="['none', 'normal', 'dev', 'build', 'all']" :titles="[$t('settings.hidden'), 'Normal', 'Dev', 'Build', $t('common.all')]" />
      </OptionItem>
      <OptionItem :title="$t('settings.treeGrouping')" :description="$t('settings.treeGroupingDescription')">
        <OptionSelectGroup v-model="settings.dependenciesGroupBy" :options="['none', 'source', 'kind']" :titles="[$t('settings.ungrouped'), $t('settings.source'), $t('settings.kind')]" />
      </OptionItem>
      <OptionItem :title="$t('settings.fullTree')" :description="$t('settings.fullTreeDescription')">
        <OptionCheckbox v-model="settings.deepDependenciesTree" />
      </OptionItem>
      <OptionItem :title="$t('settings.chartAnimation')" :description="$t('settings.chartAnimationDescription')">
        <OptionCheckbox v-model="settings.chartAnimation" />
      </OptionItem>
    </div>
    <PanelFiltersOptionExcludes />
    <div v-if="backend.isDynamic" border="t base" p4>
      <button btn-action @click="fetchData(true)">
        <div i-ph-arrows-clockwise-duotone />{{ $t('settings.reparse') }}
      </button>
    </div>
  </div>
</template>
