import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin } from '#app/nuxt'
import { LOCALE_PREFERENCE_STORAGE_KEY, LOCALE_STORAGE_KEY, messages, resolveInitialLocale } from '../locales'

function initialLocale() {
  const preferredLocales = navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]

  try {
    return resolveInitialLocale(
      localStorage.getItem(LOCALE_STORAGE_KEY),
      localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY) === 'true',
      preferredLocales,
    )
  }
  catch {
    return resolveInitialLocale(null, false, preferredLocales)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const locale = initialLocale()
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages,
  })

  nuxtApp.vueApp.use(i18n)
  document.documentElement.lang = locale

  watch(i18n.global.locale, (locale) => {
    document.documentElement.lang = locale
  })
})
