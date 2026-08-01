<script setup lang="ts">
import type { Backend } from '../types/backend'
import { ref, shallowRef } from 'vue'
import { payloadFromImport } from '../../shared/snapshot'
import { backend } from '../backends'
import { fetchData } from '../state/data'
import MainEntry from './main.vue'

const error = shallowRef<unknown>()
const loading = ref(false)
const ready = ref(false)

async function importFile(file: File): Promise<void> {
  error.value = undefined
  loading.value = true
  try {
    const parsed = payloadFromImport(JSON.parse(await file.text()))
    const importedBackend: Backend = {
      name: 'import',
      status: ref('connected'),
      connectionError: shallowRef(),
      connect() {},
      functions: {
        getPayload: async () => parsed.payload,
        getAudit: parsed.snapshot?.audit ? async () => parsed.snapshot!.audit! : undefined,
        getOutdated: parsed.snapshot?.outdated ? async () => parsed.snapshot!.outdated! : undefined,
      },
    }
    backend.value = importedBackend
    await fetchData()
    ready.value = true
  }
  catch (cause) {
    error.value = cause
  }
  finally {
    loading.value = false
  }
}

function onInput(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file)
    void importFile(file)
}

function onDrop(event: DragEvent): void {
  const file = event.dataTransfer?.files?.[0]
  if (file)
    void importFile(file)
}
</script>

<template>
  <MainEntry v-if="ready" :backend />
  <main v-else h-full min-h-screen flex="~ items-center justify-center" p6>
    <section w-full max-w-2xl bg-glass border="~ base rounded-2xl" shadow-xl of-hidden>
      <div p8 flex="~ col items-center text-center gap-3">
        <UiLogo w-20 h-20 class="hover:animate-spin-reverse" />
        <p badge-color-lime rounded-full px3 py1 text-sm>
          纯浏览器查看器
        </p>
        <h1 text-3xl font-700>
          导入 Cargo 依赖数据
        </h1>
        <p op-fade max-w-xl>
          可打开 <code badge-color-gray rounded px1>cargo metadata --format-version=1</code> 原始 JSON，或 Cargo Deps Inspector 增强快照。
        </p>

        <label
          mt4 w-full min-h-44 border="2 dashed base" rounded-xl
          flex="~ col items-center justify-center gap-3" cursor-pointer
          hover="bg-active border-primary:50" transition-colors
          @dragover.prevent @drop.prevent="onDrop"
        >
          <input sr-only type="file" accept="application/json,.json" @change="onInput">
          <div :class="loading ? 'i-ph-spinner-gap animate-spin' : 'i-ph-upload-simple-duotone'" text-3xl text-primary />
          <strong text-lg>{{ loading ? '正在解析…' : '选择或拖放 JSON 文件' }}</strong>
          <span op-fade>文件仅在当前浏览器标签页内处理，不会上传。</span>
        </label>
      </div>
      <div border="t base" p4 px6 flex="~ gap-2 items-start" text-sm badge-color-amber>
        <div i-ph-warning-duotone flex-none mt0.5 />
        <p>增强快照会保留绝对本地路径。分享前请检查其中可能包含的隐私信息。</p>
      </div>
      <div v-if="error" border="t base" p4 px6 text-red flex="~ gap-2 items-start">
        <div i-ph-x-circle-duotone flex-none mt0.5 />
        <p break-all>
          {{ error }}
        </p>
      </div>
    </section>
  </main>
</template>
