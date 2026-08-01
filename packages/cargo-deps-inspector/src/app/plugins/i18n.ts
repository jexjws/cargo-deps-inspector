import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin } from '#app/nuxt'
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_STORAGE_KEY, messages } from '../locales'

function initialLocale() {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (isSupportedLocale(stored))
    return stored

  return DEFAULT_LOCALE
}

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = createI18n({
    legacy: false,
    locale: initialLocale(),
    fallbackLocale: 'en',
    messages,
  })

  nuxtApp.vueApp.use(i18n)

  watch(i18n.global.locale, (locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale
  }, { immediate: true })
})
