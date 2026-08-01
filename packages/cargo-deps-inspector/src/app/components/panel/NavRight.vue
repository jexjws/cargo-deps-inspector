<script setup lang="ts">
import type { SupportedLocale } from '../../locales'
import { vClosePopper, Menu as VMenu } from 'floating-vue'
import { useI18n } from 'vue-i18n'
import { toggleDark } from '../../composables/dark'
import { localeOptions } from '../../locales'

const { locale, t } = useI18n()

function selectLocale(value: SupportedLocale) {
  locale.value = value
}
</script>

<template>
  <div flex="~ items-center gap-2" fixed right-4 top-4 z-panel-nav>
    <PanelFiltersMini />
    <div
      flex="~ items-center"
      bg-glass rounded-full border border-base shadow
    >
      <a
        v-tooltip="t('nav.github')"
        :title="t('nav.github')"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        href="https://github.com/jexjws/cargo-deps-inspector" target="_blank"
      >
        <div i-ri-github-fill text-xl />
      </a>
      <VMenu placement="bottom-end" :distance="8">
        <button
          v-tooltip="t('nav.language')"
          w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
          flex="~ items-center justify-center"
          :title="t('nav.language')"
          :aria-label="t('nav.language')"
          aria-haspopup="menu"
        >
          <div i-ph-translate-duotone text-xl />
        </button>
        <template #popper>
          <div role="menu" :aria-label="t('nav.language')" min-w-38 p1 flex="~ col gap-0.5">
            <button
              v-for="option of localeOptions"
              :key="option.value"
              v-close-popper
              role="menuitemradio"
              :aria-checked="locale === option.value"
              :class="locale === option.value ? 'text-primary bg-primary:10' : 'hover:bg-active'"
              px3 py2 rounded-lg flex="~ items-center gap-2" text-left
              @click="selectLocale(option.value)"
            >
              <div w-4 flex-none>
                <div v-if="locale === option.value" i-ph-check-bold />
              </div>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </template>
      </VMenu>
      <button
        v-tooltip="t('nav.darkMode')"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        :title="t('nav.darkMode')"
        :aria-label="t('nav.darkMode')"
        @click="toggleDark()"
      >
        <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
      </button>
    </div>
  </div>
</template>
