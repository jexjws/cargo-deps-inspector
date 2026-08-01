<script setup lang="ts">
import type { PackageNode } from 'cargo-deps-tools'
import { Menu as VMenu } from 'floating-vue'
import { computed, nextTick } from 'vue'
import { useRouter } from '#app/composables/router'
import { getBackend } from '../../backends'
import { selectedNode } from '../../state/current'
import { filters } from '../../state/filters'
import { payloads } from '../../state/payload'

const props = defineProps<{ pkg: PackageNode }>()
const backend = getBackend()
const router = useRouter()
const duplicated = computed(() => {
  const entries = payloads.filtered.versions.get(props.pkg.name)
  return entries && entries.length > 1 ? entries : undefined
})
const docsUrl = computed(() => props.pkg.metadata.documentation || (props.pkg.sourceKind === 'registry' ? `https://docs.rs/${props.pkg.name}/${props.pkg.version}` : undefined))
const cratesUrl = computed(() => props.pkg.sourceKind === 'registry' ? `https://crates.io/crates/${props.pkg.name}/${props.pkg.version}` : undefined)

function showDuplicatedGraph(packages: PackageNode[]) {
  filters.state.focus = null
  filters.state.why = packages.map(pkg => pkg.packageId)
  selectedNode.value = packages[0]
  nextTick(() => router.push({ path: '/graph', hash: location.hash }))
}
</script>

<template>
  <div flex="~ col gap-2">
    <div flex gap2 items-center>
      <DisplayPackageName :name="pkg.name" font-mono text-2xl flex="~ wrap items-center gap-2" />
    </div>
    <div v-if="pkg.metadata.description" text-sm op-fade line-clamp-3 text-ellipsis mt--1 mb1>
      {{ pkg.metadata.description }}
    </div>
    <div flex="~ items-center wrap gap-2">
      <DisplayVersion :version="pkg.version" prefix="v" badge-color-gray rounded px2 />
      <div v-if="pkg.workspace" badge-color-lime px2 rounded text-sm>
        {{ $t('details.workspace') }}
      </div>
      <DisplaySourceTypeBadge :pkg />
      <div badge-color-gray px2 rounded text-sm font-mono>
        edition {{ pkg.metadata.edition }}
      </div>
      <VMenu v-if="duplicated" font-mono>
        <div pl2 pr1 rounded bg-rose:10 text-rose text-sm flex="~ items-center gap-1">
          {{ $t('details.versions', { count: duplicated.length }) }}<div i-ph-caret-down text-xs />
        </div>
        <template #popper>
          <div flex="~ col" p1>
            <button v-for="versionNode of duplicated" :key="versionNode.packageId" py1 px2 rounded flex="~ items-center gap-1" min-w-52 hover="bg-active" @click="selectedNode = versionNode">
              <DisplayVersion op75 flex-auto text-left :version="versionNode.version" />
              <DisplaySourceTypeBadge :pkg="versionNode" />
            </button>
            <div border="t base" my1 />
            <button py1 px2 rounded flex="~ items-center gap-1" hover="bg-active" @click="showDuplicatedGraph(duplicated)">
              <div i-ph-graph-duotone /><span text-sm>{{ $t('details.compareGraph') }}</span>
            </button>
          </div>
        </template>
      </VMenu>
      <div flex-auto />
      <div flex="~ gap--1 items-center">
        <a v-if="cratesUrl" v-tooltip="$t('details.openCratesIo')" :aria-label="$t('details.openCratesIo')" :href="cratesUrl" target="_blank" w-8 h-8 rounded-full hover:bg-active flex><div i-simple-icons-rust ma /></a>
        <a v-if="pkg.metadata.repository" v-tooltip="$t('details.openRepository')" :aria-label="$t('details.openRepository')" :href="pkg.metadata.repository" target="_blank" w-8 h-8 rounded-full hover:bg-active flex><div i-catppuccin-git ma /></a>
        <a v-if="docsUrl" v-tooltip="$t('details.openDocs')" :aria-label="$t('details.openDocs')" :href="docsUrl" target="_blank" w-8 h-8 rounded-full hover:bg-active flex><div i-ph-book-open-text-duotone ma /></a>
        <button v-if="backend.functions.openInEditor" v-tooltip="$t('details.openManifest')" :aria-label="$t('details.openManifest')" w-8 h-8 rounded-full hover:bg-active flex @click="backend.functions.openInEditor?.(pkg.manifestPath)">
          <div i-ph-file-code-duotone ma />
        </button>
      </div>
    </div>
    <div v-if="pkg.metadata.license || pkg.metadata.rust_version" flex="~ gap-2 wrap items-center" text-sm>
      <span v-if="pkg.metadata.license" op-fade>{{ $t('details.license') }} <code>{{ pkg.metadata.license }}</code></span>
      <span v-if="pkg.metadata.rust_version" op-fade>MSRV <code>{{ pkg.metadata.rust_version }}</code></span>
    </div>
  </div>
</template>
