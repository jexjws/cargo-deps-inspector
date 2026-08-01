<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { computed } from 'vue'
import { filters } from '../../state/filters'
import { payloads } from '../../state/payload'
import { query } from '../../state/query'
import { settings } from '../../state/settings'

const props = defineProps<{ pkg: PackageNode }>()
const isExcluded = computed(() => payloads.excluded.has(props.pkg))
const selectionMode = computed<'focus' | 'why' | 'exclude' | 'none'>({
  get() {
    if (filters.state.focus?.includes(props.pkg.packageId))
      return 'focus'
    if (filters.state.why?.includes(props.pkg.packageId))
      return 'why'
    if (filters.state.excludes?.includes(props.pkg.packageId))
      return 'exclude'
    return 'none'
  },
  set(value) {
    filters.focus.toggle(props.pkg.packageId, value === 'focus')
    filters.why.toggle(props.pkg.packageId, value === 'why')
    filters.excludes.toggle(props.pkg.packageId, value === 'exclude')
  },
})
const sourceSize = computed(() => props.pkg.resolved.sourceSize?.bytes ?? 0)
const totalSize = computed(() => [props.pkg, ...payloads.available.flatDependencies(props.pkg)].reduce((sum, pkg) => sum + (pkg.resolved.sourceSize?.bytes ?? 0), 0))
const dependencyList = computed(() => settings.value.deepDependenciesTree ? payloads.available.flatDependencies(props.pkg) : payloads.available.dependencies(props.pkg))
const dependentList = computed(() => settings.value.deepDependenciesTree ? payloads.available.flatDependents(props.pkg) : payloads.available.dependents(props.pkg))
</script>

<template>
  <div class="details-drawer" of-hidden h-full flex="~ col gap-0">
    <div absolute top-2 right-2>
      <button w-10 h-10 rounded-full op30 hover="op100 bg-active" flex @click="query.selected = ''">
        <div i-ph-x ma />
      </button>
    </div>
    <PanelPackageDetailsInfo :pkg p5 pb2 />

    <div grid="~ cols-3 gap-2 items-center" p2 border="t base">
      <button flex="~ items-center gap-1 justify-center" px4 py1 rounded hover:bg-active :class="selectionMode === 'focus' ? 'text-teal bg-teal:10!' : 'op-fade'" @click="selectionMode = selectionMode === 'focus' ? 'none' : 'focus'">
        <div i-ph-arrows-in-cardinal-duotone /><span>聚焦</span>
      </button>
      <button flex="~ items-center gap-1 justify-center" px4 py1 rounded hover:bg-active :class="selectionMode === 'why' ? 'text-orange bg-orange:10!' : 'op-fade'" @click="selectionMode = selectionMode === 'why' ? 'none' : 'why'">
        <div i-ph-seal-question-duotone /><span>为何引入</span>
      </button>
      <button flex="~ items-center gap-1 justify-center" px4 py1 rounded hover:bg-active border="~ transparent" :class="selectionMode === 'exclude' ? 'text-purple bg-purple:10!' : isExcluded ? 'border-dashed! border-purple:50!' : 'op-fade'" @click="selectionMode = selectionMode === 'exclude' ? 'none' : 'exclude'">
        <div i-ph-network-slash-duotone /><span>排除</span>
      </button>
    </div>

    <div v-if="sourceSize" p4 border="t base" flex="~ col gap-2">
      <div flex="~ gap-3 wrap items-center">
        <div flex="~ items-center gap-1">
          <span text-sm op-fade>当前源码</span><DisplayFileSizeBadge :bytes="sourceSize" rounded-lg />
        </div>
        <div flex="~ items-center gap-1">
          <span text-sm op-fade>含传递依赖</span><DisplayFileSizeBadge :bytes="totalSize" rounded-lg />
        </div>
      </div>
      <div v-if="pkg.resolved.sourceSize" grid="~ cols-2 gap-x-3 gap-y-1" text-sm op-fade>
        <span>文件 {{ pkg.resolved.sourceSize.files.toLocaleString() }}</span>
        <span>分类 {{ Object.keys(pkg.resolved.sourceSize.categories).length.toLocaleString() }}</span>
      </div>
      <UiPercentageSourceCategories v-if="settings.showFileComposition" :pkg />
    </div>

    <div v-if="pkg.enabledFeatures.length" p4 border="t base" flex="~ col gap-2">
      <div flex="~ gap-2 items-center">
        <div i-ph-toggle-right-duotone /><span op-fade text-sm>已启用 Features</span><DisplayNumberBadge :number="pkg.enabledFeatures.length" rounded-full text-xs />
      </div>
      <div flex="~ gap-1 wrap">
        <code v-for="feature of pkg.enabledFeatures" :key="feature" badge-color-gray px2 rounded text-xs>{{ feature }}</code>
      </div>
    </div>

    <div flex select-none h-10 mt2>
      <div border="b base" w2 />
      <button flex-1 border="~ base" rounded-t-lg p1 :class="settings.packageDetailsTab === 'dependents' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'" @click="settings.packageDetailsTab = 'dependents'">
        被依赖 <DisplayNumberBadge :number="dependentList.length" rounded-full text-xs inline-flex />
      </button>
      <div border="b base" w2 />
      <button flex-1 border="~ base" rounded-t-lg p1 :class="settings.packageDetailsTab === 'dependencies' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'" @click="settings.packageDetailsTab = 'dependencies'">
        依赖 <DisplayNumberBadge :number="dependencyList.length" rounded-full text-xs inline-flex />
      </button>
      <div border="b base" px2 flex="~ items-center">
        <button v-tooltip="'切换直接/传递依赖'" p1 rounded-full hover:bg-active @click="settings.deepDependenciesTree = !settings.deepDependenciesTree">
          <div :class="settings.deepDependenciesTree ? 'i-ph-text-align-right-duotone' : 'i-ph-text-align-justify-duotone'" />
        </button>
      </div>
    </div>

    <div flex="~ col gap-1" flex-auto of-auto p3>
      <TreeDependencies v-if="settings.packageDetailsTab === 'dependents' && dependentList.length" :currents="dependentList" :list="payloads.available.packages" type="dependents" :max-depth="settings.deepDependenciesTree ? 6 : 1" :group-by="settings.dependenciesGroupBy" />
      <TreeDependencies v-else-if="settings.packageDetailsTab === 'dependencies' && dependencyList.length" :currents="dependencyList" :list="payloads.available.packages" type="dependencies" :max-depth="settings.deepDependenciesTree ? 6 : 1" :group-by="settings.dependenciesGroupBy" />
      <UiEmptyState
        v-else
        :title="settings.packageDetailsTab === 'dependencies' ? '没有依赖' : '没有反向依赖'"
        :message="settings.packageDetailsTab === 'dependencies' ? '这个 crate 没有已解析依赖' : '没有其他 crate 依赖它'"
      />
    </div>
  </div>
</template>
