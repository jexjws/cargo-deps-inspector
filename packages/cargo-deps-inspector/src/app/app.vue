<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useHead } from '#imports'
import Entry from './entries/index'
import { setupQuery } from './state/query'

import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

const { locale, t } = useI18n()

useHead(() => ({
  title: t('meta.title'),
  htmlAttrs: { lang: locale.value },
  meta: [
    { name: 'description', content: t('meta.description') },
    { property: 'og:title', content: t('meta.title') },
    { property: 'og:description', content: t('meta.description') },
    { property: 'twitter:title', content: t('meta.title') },
    { property: 'twitter:description', content: t('meta.description') },
  ],
}))

setupQuery()
</script>

<template>
  <Entry />
  <UiNoMobile />
  <PanelNavRight />
</template>
