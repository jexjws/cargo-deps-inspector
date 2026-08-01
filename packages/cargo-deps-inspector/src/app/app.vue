<script setup lang="ts">
import { useHead } from '#imports'
import Entry from './entries/index'
import { setupQuery } from './state/query'

import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Cargo Deps Inspector',
})

setupQuery()
</script>

<template>
  <Entry />
  <UiNoMobile />
  <PanelNavRight />
</template>
