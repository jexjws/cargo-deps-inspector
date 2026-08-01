<script setup lang="ts">
import { toggleDark } from '../../composables/dark'
</script>

<template>
  <div flex="~ items-center gap-2" fixed right-4 top-4 z-panel-nav>
    <PanelFiltersMini />
    <div
      flex="~ items-center"
      bg-glass rounded-full border border-base shadow
    >
      <a
        v-tooltip="'在 GitHub 查看源码'"
        title="在 GitHub 查看源码"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        href="https://github.com/jexjws/cargo-deps-inspector" target="_blank"
      >
        <div i-ri-github-fill text-xl />
      </a>
      <button
        v-tooltip="'切换深色模式'"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        title="切换深色模式"
        @click="toggleDark()"
      >
        <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
      </button>
    </div>
  </div>
</template>
