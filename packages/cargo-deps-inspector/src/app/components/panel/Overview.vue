<script setup lang="ts">
import { computed } from 'vue'
import { version } from '../../../../package.json'
import { getBackend } from '../../backends'
import { rawPayload } from '../../state/data'
import { payloads, totalSourceSize } from '../../state/payload'
import { settings } from '../../state/settings'

const location = window.location
const backend = getBackend()

const multipleVersionsCount = computed(() => [...payloads.available.versions.values()].filter(entries => entries.length > 1).length)
const licensesCount = computed(() => new Set(payloads.available.packages.map(pkg => pkg.metadata.license || '<未声明>')).size)
const gitCount = computed(() => payloads.available.packages.filter(pkg => pkg.sourceKind === 'git').length)
const targetCount = computed(() => new Set(payloads.available.packages.flatMap(pkg => pkg.metadata.targets.map(target => target.kind).flat())).size)
const sourceBreakdown = computed(() => {
  const counts = new Map<string, number>()
  for (const pkg of payloads.available.packages)
    counts.set(pkg.sourceKind, (counts.get(pkg.sourceKind) ?? 0) + 1)
  const classes: Record<string, string> = {
    workspace: 'badge-color-lime',
    path: 'badge-color-cyan',
    registry: 'badge-color-primary',
    git: 'badge-color-purple',
    unknown: 'badge-color-gray',
  }
  return [...counts].map(([name, value]) => ({ name, value, class: classes[name] }))
})
</script>

<template>
  <div flex="~ col">
    <h1 text-lg p4 flex="~ gap-3 items-center">
      <UiLogo w-9 h-9 alt="Cargo Deps Inspector" class="hover:animate-spin-reverse" />
      <div flex="~ col gap-0" leading-none>
        <span font-700 text-primary>Cargo Deps</span>
        <div flex="~ gap-1 items-end">
          <div op75>
            Inspector
          </div>
          <div op-fade text-xs font-mono>
            v{{ version }}
          </div>
        </div>
      </div>
      <div flex-auto />
      <button v-tooltip="'收起侧栏'" w-10 h-10 mr--2 rounded-full op30 hover="op100 bg-active" flex="~ items-center justify-center" @click="settings.collapseSidepanel = true">
        <div i-ph-caret-double-left />
      </button>
    </h1>

    <div v-if="rawPayload" border="t base" flex="~ col gap-3" p5>
      <button flex="~ gap-2 items-center" @click="backend.functions.openInFinder?.(rawPayload.root)">
        <div i-catppuccin-folder-rust-open icon-catppuccin flex-none />
        <span font-mono break-all text-left leading-tight>{{ rawPayload.config?.name ?? rawPayload.root }}</span>
      </button>
      <div flex="~ gap-2 items-center">
        <div i-logos-rust text-lg flex-none />
        <span>{{ rawPayload.cargoVersion || 'Cargo' }}</span>
      </div>
      <div flex="~ gap-2 items-center">
        <div i-ph-cube-duotone flex-none text-lime />
        <DisplayNumberBadge :number="payloads.workspace.packages.length" rounded-full text-sm color="badge-color-lime" />
        <span>个 workspace crate</span>
      </div>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/grid/depth', hash: location.hash }">
        <div i-ph-package-duotone flex-none text-primary />
        <DisplayNumberBadge :number="payloads.available.packages.length" rounded-full text-sm color="badge-color-primary" />
        <span>个已解析 crate</span>
      </NuxtLink>
      <NuxtLink v-if="multipleVersionsCount" flex="~ gap-2 items-center" :to="{ path: '/report/duplicates', hash: location.hash }">
        <div i-ph-copy-duotone flex-none text-orange />
        <DisplayNumberBadge :number="multipleVersionsCount" rounded-full text-sm color="badge-color-orange" />
        <span>个重复版本 crate</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/report/licenses', hash: location.hash }">
        <div i-ph-scales-duotone flex-none text-amber />
        <DisplayNumberBadge :number="licensesCount" rounded-full text-sm color="badge-color-amber" />
        <span>种许可证声明</span>
      </NuxtLink>
      <div v-if="gitCount" flex="~ gap-2 items-center">
        <div i-ph-git-branch-duotone flex-none text-purple />
        <DisplayNumberBadge :number="gitCount" rounded-full text-sm color="badge-color-purple" />
        <span>个 Git 依赖</span>
      </div>
      <div flex="~ gap-2 items-center">
        <div i-ph-crosshair-duotone flex-none />
        <DisplayNumberBadge :number="targetCount" rounded-full text-sm />
        <span>种 Cargo target 类型</span>
      </div>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/report/source-size', hash: location.hash }">
        <div i-ph-hard-drives-duotone flex-none text-primary />
        <DisplayFileSizeBadge :bytes="totalSourceSize" :percent="false" rounded-full text-sm />
        <span>依赖源码总占用</span>
      </NuxtLink>
    </div>

    <UiPercentage v-if="sourceBreakdown.length" :nodes="sourceBreakdown" :rounded="false" />
    <UiCredits border="t base" />
  </div>
</template>
